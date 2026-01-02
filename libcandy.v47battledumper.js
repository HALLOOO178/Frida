// Battle structure dumper for v47
// THIS SCRIPT CAN ONLY DUMP OFFLINE BATTLE STRUCTURE!!!!!
// Made by @hallo
// https://dsc.gg/candybrawl

const base = Process.getModuleByName("libg.so").base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stageInstance = base.add(0x180A8D8);
const customButtonPressed = base.add(0x9D4160);
const loadingScreenCreateLoadingSplash = base.add(0xE40F30);

const LogicSkillServerEncode = base.add(0x54663C);
const LogicCharacterServerEncode = base.add(0x86B86C);
const LogicGameObjectServerEncode = base.add(0x5500BC);

const writePositiveInt = base.add(0xC67C68);
const writeInt = base.add(0x32F52C);
const writePositiveVInt = base.add(0xB3A0F4);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);

const stageAddChild = new NativeFunction(base.add(0x2B6BA0), "int", ["pointer", "pointer"]);
const gameButtonSetText = new NativeFunction(base.add(0x4DA5DC), "int", ["pointer", "pointer", "bool"]);
const gameButtonConstructor = new NativeFunction(base.add(0xB38D88), "pointer", ["pointer"]);
const resourceManagerGetMovieClip = new NativeFunction(base.add(0x9119AC), "pointer", ["pointer", "pointer", "bool"]);
const displayObjectSetSetXY = new NativeFunction(base.add(0xCF8464), "pointer", ["pointer", "float", "float"]);
const customButtonSetMovieClip = new NativeFunction(base.add(0xC0AB3C), "pointer", ["pointer", "pointer", "bool"]);
const movieClipGotoAndStopAtFrameIndex = new NativeFunction(base.add(0x9668B4), "pointer", ["pointer", "int"]);
const guiContainerGetMovieClip = new NativeFunction(base.add(0x854190), "pointer", ["pointer"]);

function createStringObject(txt) {
    const sptr = Memory.allocUtf8String(txt);
    const ptr = malloc(200);
    stringCtor(ptr, sptr);
    return ptr;
}

function spawnItem(item, text, x, y, hasButtonAnimation, frame) {
    var memory = malloc(700);
    gameButtonConstructor(memory);
    var movieClip = resourceManagerGetMovieClip(Memory.allocUtf8String("sc/ui.sc"), Memory.allocUtf8String(item), 1);
    customButtonSetMovieClip(memory, movieClip, hasButtonAnimation);
    movieClipGotoAndStopAtFrameIndex(movieClip, frame);
    displayObjectSetSetXY(memory, x, y);
    gameButtonSetText(memory, createStringObject(text), 1);
    return memory;
}

function attachHooks() {
    var bitstreamHooks = []
    var result = []
    bitstreamHooks.push(Interceptor.attach(writePositiveInt, {
        onEnter(args) {
            if (args[2].toInt32() > 1) var res = "BitStream::writePositiveInt(" + args[1].toInt32() + ", " + args[2].toInt32() + "); // Writes " + args[1].toInt32() + " with " + args[2].toInt32() + " bits."
            else var res = "BitStream::writeBoolean(" + args[1].toInt32() + ", " + args[2].toInt32() + "); // Writes a boolean that's set to " + (args[1] == 1 ? "true" : "false")
            console.log(res)
            result.push(res)
        }
    }))
    bitstreamHooks.push(Interceptor.attach(writeInt, {
        onEnter(args) {
            var res = "BitStream::writeInt(" + args[1].toInt32() + ", " + args[2].toInt32() + "); // Writes " + args[1].toInt32() + " with " + args[2].toInt32() + " bits."
            console.log(res)
            result.push(res)
        }
    }))
    bitstreamHooks.push(Interceptor.attach(writePositiveVInt, {
        onEnter(args) {
            var res = "BitStream::writePositiveVInt(" + args[1].toInt32() + ", " + args[2].toInt32() + "); // Writes " + args[1].toInt32() + " with " + args[2].toInt32() + " bits."
            console.log(res)
            result.push(res)
        }
    }))
    return bitstreamHooks
}

function dumpCharcterServer() {
    var bitstreamHooks = []
    console.log("// LogicCharacterServer::encode start")
    var hook = Interceptor.attach(LogicCharacterServerEncode, {
        onEnter(args) {
            bitstreamHooks = attachHooks()
        },
        onLeave(retval) {
            bitstreamHooks.forEach(function(bs) {
                bs.detach()
            })
            hook.detach()
        }
    })
    console.log("")
}

function dumpSkillServer() {
    var bitstreamHooks = []
    console.log("// LogicSkillServer::encode start")
    var hook = Interceptor.attach(LogicSkillServerEncode, {
        onEnter(args) {
            bitstreamHooks = attachHooks()
        },
        onLeave(retval) {
            bitstreamHooks.forEach(function(bs) {
                bs.detach()
            })
            hook.detach()
        }
    })
    console.log("")
}

function dumpGameObjectServer() {
    var bitstreamHooks = []
    console.log("// LogicGameObjectServer::encode start")
    var hook = Interceptor.attach(LogicGameObjectServerEncode, {
        onEnter(args) {
            bitstreamHooks = attachHooks()
        },
        onLeave(retval) {
            bitstreamHooks.forEach(function(bs) {
                bs.detach()
            })
            hook.detach()
        }
    })
    console.log("")
}

Interceptor.attach(loadingScreenCreateLoadingSplash, {
    onEnter(args) {
        var CharacterServerDump = spawnItem("country_item", "Dump LogicCharacterServer", 100, 100, 1, 1)
        var SkillServerDump = spawnItem("country_item", "Dump LogicSkillServer", 300, 100, 1, 1)
        var GameObjectServerDump = spawnItem("country_item", "Dump LogicGameObjectServer", 500, 100, 1, 1)
        stageAddChild(stageInstance.readPointer(), CharacterServerDump)
        stageAddChild(stageInstance.readPointer(), SkillServerDump)
        stageAddChild(stageInstance.readPointer(), GameObjectServerDump)
        Interceptor.attach(customButtonPressed, {
            onEnter(args) {
                if (args[0].toInt32() == CharacterServerDump.toInt32()) dumpCharcterServer()
                if (args[0].toInt32() == SkillServerDump.toInt32()) dumpSkillServer()
                if (args[0].toInt32() == GameObjectServerDump.toInt32()) dumpGameObjectServer()
            }
        })
    }
})