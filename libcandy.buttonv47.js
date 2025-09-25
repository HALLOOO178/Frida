// Button adder for v47
// Made by @hallo178
// https://dsc.gg/candybrawl 

const base = Process.getModuleByName('libg.so').base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stageInstance = base.add(0x180A8D8);
const customButtonPressed = base.add(0x9D4160);
const homeModeEnter = base.add(0x80AEEC);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);
const stageAddChild = new NativeFunction(base.add(0x2B6BA0), "int", ["pointer", "pointer"]);
const gameButtonSetText = new NativeFunction(base.add(0x4DA5DC), "int", ["pointer", "pointer", "bool"]);
const gameButtonConstructor = new NativeFunction(base.add(0xB38D88), "pointer", ["pointer"]);
const resourceManagerGetMovieClip = new NativeFunction(base.add(0x9119AC), "pointer", ["pointer", "pointer", "bool"]);
const displayObjectSetSetXY = new NativeFunction(base.add(0xCF8464), "pointer", ["pointer", "float", "float"]);
const customButtonSetMovieClip = new NativeFunction(base.add(0xC0AB3C), "pointer", ["pointer", "pointer", "bool"]);
const movieClipGotoAndStopAtFrameIndex = new NativeFunction(base.add(0x9668B4), "pointer", ["pointer", "int"]);

function example(arg) {
    console.log("Example! Argument: " + arg)
}

function stringPtr(txt) {
    return Memory.allocUtf8String(txt);
}

function createStringObject(txt) {
    const sptr = stringPtr(txt);
    const ptr = malloc(200);
    stringCtor(ptr, sptr);
    return ptr;
}

function spawnItem(item, text, x, y, hasButtonAnimation, frame) {
    console.log(`[* Debug] Spawning item! Type: ${item}, Text: ${text}, Position: (${x}, ${y}), Is button: ${hasButtonAnimation}`)
    var memory = malloc(700);
    gameButtonConstructor(memory);
    var movieClip = resourceManagerGetMovieClip(stringPtr("sc/ui.sc"), stringPtr(item), 1);
    customButtonSetMovieClip(memory, movieClip, hasButtonAnimation);
    movieClipGotoAndStopAtFrameIndex(movieClip, frame);
    displayObjectSetSetXY(memory, x, y);
    gameButtonSetText(memory, createStringObject(text), 1);
    return memory;
}

function createButton(text, x, y, func, arg) {
    var btn = spawnItem("country_item", text, x, y, 1, 1);
    stageAddChild(stageInstance.readPointer(), btn)
    Interceptor.attach(customButtonPressed, {
        onEnter(args) {
            if (args[0].toInt32() == btn.toInt32()) func(arg)
        }
    })
}

Interceptor.attach(homeModeEnter, {
    onEnter(args) {
        createButton("idk", 100, 100, example, "https://dsc.gg/candybrawl")
    }
})