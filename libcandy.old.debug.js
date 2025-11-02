// Debug menu for v47
// Made by @hallo178
// Help by natesworks
// https://dsc.gg/candybrawl

// PS: This is just a very old version I found that's apparently from august or something, so don't expect it to be any good since I was still learning frida and js back then
// I'm surprised this even works at all honestly...

var debugOpen = false;
var debugCreated = false;
var debugButton = ptr(0);
var debugMenu = ptr(0);
var closeButton = ptr(0);
var floaterButton = ptr(0);
var miscCategory = ptr(0);

var categories = {
    misc: {
        open: false,
        btnCount: 1
    }
}

const base = Process.getModuleByName('libg.so').base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stageInstance = base.add(0x180A8D8);
const homeModeEnter = base.add(0x80AEEC);
const resourceListererAddFile = base.add(0xA72A90);
const TIDConnecting = base.add(0x017C3F56);
const linkDotBrawlStars = base.add(0x1595050);
const customButtonPressed = base.add(0x9D4160);
const gameMainInstance = base.add(0x180B548);

const gameMainInit = new NativeFunction(base.add(0x848085), 'void', ['pointer']);
const addFile = new NativeFunction(resourceListererAddFile, "int", ["pointer", "pointer", "int", "int", "int", "int", "int"]);
const gameButtonSetText = new NativeFunction(base.add(0x4DA5DC), "int", ["pointer", "pointer", "bool"]);
const showFloaterTextAtDefaultPos = new NativeFunction(base.add(0x1CFC30), "int", ["pointer", "pointer", "float", "int"]);
const displayObjectSetSetXY = new NativeFunction(base.add(0xCF8464), "pointer", ["pointer", "float", "float"]);
const customButtonSetMovieClip = new NativeFunction(base.add(0xC0AB3C), "pointer", ["pointer", "pointer", "bool"]);
const stageAddChild = new NativeFunction(base.add(0x2B6BA0), "int", ["pointer", "pointer"]);
const stageRemoveChild = new NativeFunction(base.add(0x4F6A20), "int", ["pointer", "pointer"]);
const resourceManagerGetMovieClip = new NativeFunction(base.add(0x9119AC), "pointer", ["pointer", "pointer", "bool"]);
const guiGetInstance = new NativeFunction(base.add(0x1B1F0C), "pointer", []);
const gameButtonConstructor = new NativeFunction(base.add(0xB38D88), "pointer", ["pointer"]);
const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]); // Thanks to @platonix_ for the offset

function getMiscCategoryPos() {
    return 100
}

function getMiscCategoryBTNPos(idx) {
    return getMiscCategoryPos() + (idx * 55)
}

function createDebugFile() {
    const adder = Interceptor.attach(resourceListererAddFile, 
        {
            onEnter(arg) {
                adder.detach();
                addFile(arg[0], stringPtr("sc/debug.sc"), -1, -1, -1, -1, 0);
                console.log("[* ResourceListener::addFile] sc/debug.sc added!");
            }
        }
    );
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

function spawnItem(item, text, x, y) {
    console.log("[* Debug] Spawning item!")
    var memory = malloc(1024);
    gameButtonConstructor(memory);
    let movieClip = resourceManagerGetMovieClip(stringPtr("sc/debug.sc"), stringPtr(item), 1);
    customButtonSetMovieClip(memory, movieClip, ["debug_menu"].includes(item) ? 0 : 1);
    displayObjectSetSetXY(memory, x, y);
    gameButtonSetText(memory, createStringObject(text), 1);
    return memory;
}

function createOpenButton(letter, x, y) {
    debugButton = spawnItem("debug_button", letter, x, y);
    stageAddChild(stageInstance.readPointer(), debugButton);
    console.log("[* Stage::addChild] Debug button created!");
}

function openMiscCategory() {
    floaterButton = spawnItem("debug_menu_item", "Show floater", 1050, getMiscCategoryBTNPos(1));
    stageAddChild(stageInstance.readPointer(), floaterButton);
}

function createDebugMenu(x, y) {
    debugMenu = spawnItem("debug_menu", "D", x, y);
    stageAddChild(stageInstance.readPointer(), debugMenu);
    closeButton = spawnItem("nothing", "D", 1225, 42);
    stageAddChild(stageInstance.readPointer(), closeButton);
    miscCategory = spawnItem("debug_menu_category", (categories.misc.open ? "- " : "+ ") + "Misc", 1050, getMiscCategoryPos());
    stageAddChild(stageInstance.readPointer(), miscCategory);
    if (categories.misc.open) openMiscCategory()
    console.log("[* Stage::addChild] Debug menu created!");
}

function closeDebugMenu() {
    try {
        stageRemoveChild(stageInstance.readPointer(), debugMenu);
        stageRemoveChild(stageInstance.readPointer(), closeButton);
        stageRemoveChild(stageInstance.readPointer(), miscCategory);
        stageRemoveChild(stageInstance.readPointer(), floaterButton);
    } catch {}
}

function updateDebugMenu() {
    closeDebugMenu()
    createDebugMenu(1200, 0)
}

Interceptor.attach(homeModeEnter, 
    {
        onEnter(arg) {
            if (!debugCreated) {
                console.log("[* HomeMode::enter] loading debug...")
                createOpenButton("D", 20, 560);
                debugCreated = true;
            }
        }
    }
);

Interceptor.attach(customButtonPressed, 
    {
        onEnter(args) {
            if (args[0].toInt32() == debugButton.toInt32()) {
                debugOpen = !debugOpen
                if (debugOpen) {
                    createDebugMenu(1200, 0)
                } else {
                    closeDebugMenu()
                }
            }
            if (args[0].toInt32() == closeButton.toInt32()) {
                debugOpen = false
                closeDebugMenu()
            }
            if (args[0].toInt32() == miscCategory.toInt32()) {
                categories.misc.open = !categories.misc.open
                updateDebugMenu()
            }
            if (args[0].toInt32() == floaterButton.toInt32()) {
                showFloaterTextAtDefaultPos(guiGetInstance(), createStringObject("https://dsc.gg/candybrawl"), 0.0, -1)
            }
        }
    }
)

console.log("[* Candybrawl] Script loaded! By https://dsc.gg/candybrawl")

createDebugFile();
