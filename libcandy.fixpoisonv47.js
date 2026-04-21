const maxPoisonStack = 16;
const poisonSecondsPerProjectile = {
    CrowProjectile: 4,
    SnakeOilProjectile: 2,
    JesterUltiProjectilePoisoning: 6
};
const defaultPoisonLastingTime = 3;
const percentPerProjectile = {
    CrowProjectile: 100,
    SnakeOilProjectile: 100,
    JesterUltiProjectilePoisoning: 100
};
const defaultPercentage = 100;
const poisonType = 4; // 4 = stacking, literally anything else behaves the exact same

const base = Process.getModuleByName('libg.so').base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const logicCharacterServerTick = base.add(0xC4F1F4);
const logicProjectileServerApplyDamageSpecialEffects = base.add(0xA72920);

const logicCharacterServerDestruct = new NativeFunction(base.add(0x1AA5D0), "void", ["pointer"]);
const logicPoisonServerTick = new NativeFunction(base.add(0xDC7258), "bool", ["pointer", "pointer"]);
const logicGameObjectServerGetData = new NativeFunction(base.add(0x8626B8), "pointer", ["pointer"]);
const LogicDataGetValueAt = new NativeFunction(base.add(0x6D8D08), "pointer", ["pointer", "int"]);

const String = {
    read(ptr) {
        var len = ptr.add(4).readInt();
        if (len >= 8) {
            return ptr.add(8).readPointer().readUtf8String(len);
        }
        return ptr.add(8).readUtf8String(len);
    }
};

function getPoisonTimePerProjectile(proj) {
    if (proj in poisonSecondsPerProjectile) return poisonSecondsPerProjectile[proj];
    return defaultPoisonLastingTime;
}

function getPoisonDamagerPercentage(proj) {
    if (proj in percentPerProjectile) return percentPerProjectile[proj];
    return defaultPercentage;
}


function readValueFromObjectData(object, column, isString=false) {
    if (object.isNull()) return isString ? "0" : 0
    return isString ? String.read(LogicDataGetValueAt(object, column)) : LogicDataGetValueAt(object, column);
}

const LogicPoisonServer = {
    ctor(a1, a2, a3, a4, a5, a6, a7) {
        console.log("LogicPoisonServer.ctor", "Creating poison of type: " + a7);
        var newPoison = malloc(256);
        newPoison.writeInt(a1) // How often it ticks
        newPoison.add(20).writePointer(a6);
        newPoison.add(16).writeInt(a5);
        newPoison.add(24).writeInt(a7); // Type
        newPoison.add(28).writeU8(a4);
        newPoison.add(12).writeInt(a3); // Damage
        newPoison.add(8).writeInt(a2); // Damage, again...
        newPoison.add(4).writeInt(0);
        return newPoison;
    },
    tick(a1, a2) {
        return logicPoisonServerTick(a1, a2);
    },
    destruct(a1, a2) {
        var poisonArray = a1.add(900).readPointer();
        if (poisonArray.isNull()) return;
        var poisonCount = a1.add(908).readInt();
        for (var i = 0; i < poisonCount; i++) {
            var entry = poisonArray.add(i * 4).readPointer();
            if (entry.equals(a2)) {
                for (var j = i; j < poisonCount - 1; j++) {
                    var next = poisonArray.add((j + 1) * 4).readPointer();
                    poisonArray.add(j * 4).writePointer(next);
                }
                poisonArray.add((poisonCount - 1) * 4).writePointer(ptr(0));
                a1.add(908).writeInt(poisonCount - 1);
                return;
            }
        }
    }
}

function applyPoison(a1, a2, a3, a4, source=ptr(-1)) {
    var spreadDamage = Math.floor(a3 / a2);
    var tickedAmount = 0;
    var poisonArray = a1.add(900).readPointer();
    var poisonCount = a1.add(908).readInt();
    if (poisonCount >= 1 && a4 != 4) return;
    if (poisonCount + 1 > maxPoisonStack) return;

    var newPoison = LogicPoisonServer.ctor(0, spreadDamage, spreadDamage, 0, 0, source, a4);

    if (poisonArray.isNull()) {
        poisonArray = malloc(4 * maxPoisonStack);
        poisonArray.writeByteArray(new Uint8Array(4 * maxPoisonStack));
        a1.add(900).writePointer(poisonArray);
        poisonCount = 0;
        a1.add(908).writeInt(0);
    }

    poisonArray.add(poisonCount * 4).writePointer(newPoison);
    a1.add(908).writeInt(poisonCount + 1);
    var ticker = Interceptor.attach(logicCharacterServerTick, {
        onEnter(args) {
            if (args[0].equals(a1)) {
                var dealtDamage = LogicPoisonServer.tick(newPoison, a1);
                if (dealtDamage) tickedAmount++;
                if (tickedAmount >= a2) {
                    LogicPoisonServer.destruct(a1, newPoison);
                    ticker.detach();
                }
            }
        }
    });
}

Interceptor.replace(logicCharacterServerDestruct, new NativeCallback(function(a1) {
    a1.add(908).writeInt(0);
    a1.add(900).writePointer(ptr(0));
    return logicCharacterServerDestruct(a1);
}, "void", ["pointer"]));

Interceptor.attach(logicProjectileServerApplyDamageSpecialEffects, {
    onEnter(args) {
        var data = logicGameObjectServerGetData(args[0]);
        var projectileName = readValueFromObjectData(data, 0, true);
        var time = getPoisonTimePerProjectile(projectileName);
        if (getPoisonDamagerPercentage(projectileName) > 0) {
            var DMG = args[0].add(26 * 4).readInt() * (getPoisonDamagerPercentage(projectileName) / 100);
            applyPoison(args[1], time, DMG * time, poisonType, args[0].add(40).readPointer());
        }
    }
});