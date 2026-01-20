// Power cube logic for v47
// By @hallo178
// https://dsc.gg/candybrawl

const base = Process.getModuleByName("libg.so").base;

const HPBuff = 400;
const CubesPerPickup = 1;

const logicItemServerTick = new NativeFunction(base.add(0x839068), "pointer", ["pointer"]);
const logicGameObjectServerGetData = new NativeFunction(base.add(0x8626B8), "pointer", ["pointer"])

function addPowerCubes(char, amount) {
    var existingCubes = char.add(896).readInt();
    var HP = char.add(144).readU32();
    var maxHP = char.add(148).readU32();
    char.add(896).writeInt(existingCubes + amount);
    char.add(144).writeU32(HP + HPBuff * amount);
    char.add(148).writeU32(maxHP + HPBuff * amount);
}

Interceptor.replace(logicItemServerTick, new NativeCallback(function(a1) {
    var Data = logicGameObjectServerGetData(a1);
    var type = Data.add(64).readInt();
    var characterServer = a1.add(72).readPointer();
    if (type == 9 && !characterServer.isNull() && a1.add(64).readInt() >= 250) {
        addPowerCubes(characterServer, CubesPerPickup);
    }
    return logicItemServerTick(a1);
}, "pointer", ["pointer"]));

console.log("Injected!");