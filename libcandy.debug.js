// Debug menu for v47
// Made by @hallo178
// https://dsc.gg/candybrawl

var settings = {
    chinaMode: false,
    infiniteUlti: false
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
const GUIUpdate = base.add(0x24B628);
const TencentManagerIsFeatureEnabled = base.add(0x38A598);
const YoozooManagerIsEnabled = base.add(0x514B00);
const isChinaBuild = base.add(0x4E915C);

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
const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);
const scrollAreaCtor = new NativeFunction(base.add(0xB022E4), "pointer", ["pointer", "float", "float", "int"]);
const scrollAreaEnableVerticalDrag = new NativeFunction(base.add(0xA74F38), "pointer", ["pointer", "bool"]);
const scrollAreaEnableHorizontalDrag = new NativeFunction(base.add(0x89A7DC), "pointer", ["pointer", "int"]);
const scrollAreaEnablePitching = new NativeFunction(base.add(0x95B5E8), "pointer", ["pointer", "int"]);
const scrollAreaSetAlignment = new NativeFunction(base.add(0xB6E770), "pointer", ["pointer", "int"]);
const scrollAreaAddContent = new NativeFunction(base.add(0xB662E0), "pointer", ["pointer", "pointer"]);
const scrollAreaUpdate = new NativeFunction(base.add(0xB9C9B4), "pointer", ["pointer", "float"])
const scrollAreaUpdateBounds = new NativeFunction(base.add(0x8C59F4), "pointer", ["pointer"]);
const displayObjectSetScale = new NativeFunction(base.add(0x4588B8), "pointer", ["pointer", "float"]);
const spriteRemoveChild = new NativeFunction(base.add(0x358120), "void", ["pointer", "pointer"]);
const displayObjectSetPixelSnappedXY = new NativeFunction(base.add(0x8A42E8), "pointer", ["pointer", "float", "float"]);
const logicCharacterServerUltiUsed = new NativeFunction(base.add(0x8511F8), "pointer", ["pointer"]);
const gameMainReloadGame = new NativeFunction(base.add(0xCEF33C), "void", ["pointer"]);

const String = {
    ptr(str) {
        return Memory.allocUtf8String(str);
    },
    ctor(str) {
        var mem = malloc(128);
        stringCtor(mem, String.ptr(str));
        return mem;
    }
}

const DebugFuncs = {
    toggleChinaMode()  {
        settings.chinaMode = !settings.chinaMode;
        Interceptor.attach(isChinaBuild, {
            onLeave(retval) {
                retval.replace(ptr(Number(settings.chinaMode)));
            }
        });
        Interceptor.attach(TencentManagerIsFeatureEnabled, {
            onLeave(retval) {
                retval.replace(ptr(Number(settings.chinaMode)));
            }
        });
        Interceptor.attach(YoozooManagerIsEnabled, {
            onLeave(retval) {
                retval.replace(ptr(Number(settings.chinaMode)));
            }
        });
        Interceptor.attach(base.add(0x4C3188), {
            onLeave(retval) {
                retval.replace(ptr(Number(settings.chinaMode)));
            }
        });
    },
    toggleInfiniteUlti() {
        settings.infiniteUlti = !settings.infiniteUlti;
    },
    reload() {
        debugMenu.closeDebugMenu();
        GUI.stageRemoveChild(debugMenu.openBTN);
        debugMenu.hasSpawnedOpenBtn = false;
        gameMainReloadGame(gameMainInstance.readPointer());
    }
}

const GUI = {
    stageAddChild(obj) {
        stageAddChild(stageInstance.readPointer(), obj);
    },
    scrollAreaAddChild(obj) {
        scrollAreaAddContent(debugMenu.buttonArea, obj);
    },
    stageRemoveChild(obj) {
        stageRemoveChild(stageInstance.readPointer(), obj);
    },
    scrollAreaRemoveChild(obj) {
        spriteRemoveChild(debugMenu.buttonArea.add(84).readPointer(), obj);
        scrollAreaUpdateBounds(debugMenu.buttonArea);
    }
}

function loadSC(scName) {
    const adder = Interceptor.attach(resourceListererAddFile, 
        {
            onEnter(arg) {
                adder.detach();
                addFile(arg[0], String.ptr(scName), -1, -1, -1, -1, 0);
                console.log("[* ResourceListener::addFile] " + scName + " loaded!");
            }
        }
    );
}

function spawnItem(item, text, x, y, scFile="sc/debug.sc", movieClipFrame=-1) {
    var hasButtonAnimation = 0
    if (!["debug_menu"].includes(item)) hasButtonAnimation = 1
    console.log(`[* Debug] Spawning item! Type: ${item}, Text: ${text}, Position: (${x}, ${y}), Is button: ${hasButtonAnimation}`)
    var memory = malloc(700);
    gameButtonConstructor(memory);
    var movieClip = resourceManagerGetMovieClip(String.ptr(scFile), String.ptr(item), 1);
    customButtonSetMovieClip(memory, movieClip, hasButtonAnimation);
    displayObjectSetSetXY(memory, x, y);
    gameButtonSetText(memory, String.ctor(text), 1);
    if (movieClipFrame != -1) movieClipGotoAndStopAtFrameIndex(movieClip, movieClipFrame);
    return [memory, movieClip];
}

var debugMenu = {
    categories: {},
    categoryBTNs: [],
    showingBTNsCount: 0,
    buttonArea: ptr(0),
    menu: ptr(0),
    openBTN: ptr(0),
    hasSpawnedOpenBtn: false,
    scrollAreaUpdater: null,
    debugOpen: false,
    allBTNS: [],
    show() {
        debugMenu.ctor();
        debugMenu.createDebugCategory("Main");
        debugMenu.createAndAddButton("Reload", DebugFuncs.reload, [], "Main", {type: "default"});
        debugMenu.createAndAddButton("Toggle China mode", DebugFuncs.toggleChinaMode, [], "Main", {type: "onoff", state: settings.chinaMode});
        debugMenu.createDebugCategory("Battle");
        debugMenu.createAndAddButton("Infinite ulti", DebugFuncs.toggleInfiniteUlti, [], "Battle", {type: "onoff", state: settings.infiniteUlti});
        debugMenu.debugOpen = true;
    },
    ctor() {
        debugMenu.showingBTNsCount = 0;
        debugMenu.categories = {};
        debugMenu.allBTNS = [];

        debugMenu.menu = spawnItem("debug_menu", "Debug Menu", 1200, 0)[0];

        debugMenu.buttonArea = malloc(2000);
        scrollAreaCtor(debugMenu.buttonArea, 600, 550, 1);
        debugMenu.buttonArea.add(528).writeU8(1);
        scrollAreaEnableVerticalDrag(debugMenu.buttonArea, 1);
        scrollAreaEnableHorizontalDrag(debugMenu.buttonArea, 0);
        scrollAreaEnablePitching(debugMenu.buttonArea, 0);
        scrollAreaSetAlignment(debugMenu.buttonArea, 4);
        displayObjectSetPixelSnappedXY(debugMenu.buttonArea, 900, 35);

        GUI.stageAddChild(debugMenu.menu);
        GUI.stageAddChild(debugMenu.buttonArea);

        debugMenu.scrollAreaUpdater = Interceptor.attach(GUIUpdate, {
            onLeave(retval) {
                scrollAreaUpdate(debugMenu.buttonArea, 20);
            }
        });

        GUI.scrollAreaAddChild(spawnItem("nothing", "X", 150, 0)[0]);
    },
    spawnOpenButton() {
        if (debugMenu.hasSpawnedOpenBtn) return;
        var BTN = spawnItem("debug_button", "D", 20, 560);
        GUI.stageAddChild(BTN[0]);
        Interceptor.attach(customButtonPressed, {
            onEnter(args) {
                if (args[0].toInt32() == BTN[0].toInt32()) {
                    if (debugMenu.debugOpen) debugMenu.closeDebugMenu();
                    else debugMenu.show();
                }
            }
        });
        this.openBTN = BTN[0];
    },
    createDebugCategory(name, open=false) {
        debugMenu.showingBTNsCount++;
        var category = spawnItem("debug_menu_category", (open ? "- " : "+ ") + name, 150, 55 * debugMenu.showingBTNsCount);
        GUI.scrollAreaAddChild(category[0]);
        debugMenu.categories[name] = {
            btns: [],
            open: open,
            Y: 55 + 55 * (Object.getOwnPropertyNames(debugMenu.categories).length + 1),
            createdBtns: 0,
            opener: category
        };
        Interceptor.attach(customButtonPressed, {
            onEnter(args) {
                if (args[0].toInt32() == category[0].toInt32()) {
                    debugMenu.categories[name].open = !debugMenu.categories[name].open;
                    gameButtonSetText(category[0], String.ctor((debugMenu.categories[name].open ? "- " : "+ ") + name), 1);
                    debugMenu.oldYOff = debugMenu.YOffset
                    for (let i = 0; i < debugMenu.categories[name].btns.length; i++) {
                        var BTN = debugMenu.categories[name].btns[i]
                        if (debugMenu.categories[name].open) {
                            GUI.scrollAreaAddChild(BTN);
                            debugMenu.showingBTNsCount++;
                        }
                        else {
                            GUI.scrollAreaRemoveChild(BTN);
                            debugMenu.showingBTNsCount--;
                        }
                    }
                    debugMenu.updateDebugMenu();
                }
            }
        });
        debugMenu.categoryBTNs.push(category[0]);
        debugMenu.allBTNS.push({
            IDX: debugMenu.allBTNS.length,
            instance: category,
            relyOn: "nothing",
            catName: name
        });
    },
    addButtonToCategory(cat, btn) {
        debugMenu.categories[cat].btns.push(btn);
        debugMenu.categories[cat].Y += 55;
    },
    createDebugButton(txt, callback, args, cat, metadata) {
        debugMenu.categories[cat].createdBtns++;
        var BTN = spawnItem("debug_menu_item", txt, 150, debugMenu.categories[cat].Y * debugMenu.categories[cat].createdBtns);
        if (metadata.type == "onoff") gameButtonSetText(BTN[0], String.ctor(txt + (metadata.state ? "| ON" : "| OFF")), 1);
        Interceptor.attach(customButtonPressed, {
            onEnter(invokargs) {
                if (invokargs[0].toInt32() == BTN[0].toInt32()) {
                    switch (metadata.type) {
                        case "default":
                            callback(...args);
                            break;
                        case "onoff":
                            metadata.state = !metadata.state;
                            gameButtonSetText(BTN[0], String.ctor(txt + (metadata.state ? "| ON" : "| OFF")), 1);
                            callback(...args);
                            break;
                    }
                }
            }
        });
        debugMenu.allBTNS.push({
            IDX: debugMenu.allBTNS.length,
            instance: BTN,
            relyOn: cat
        })
        return BTN[0];
    },
    createAndAddButton(txt, callback, args, cat, metadata) {
        var BTN = debugMenu.createDebugButton(txt, callback, args, cat, metadata);
        debugMenu.addButtonToCategory(cat, BTN);
    },
    updateDebugMenu() {
        var row = 0
        for (let [catName, catData] of Object.entries(debugMenu.categories)) {
            let openerY = 55 * (row + 1);
            catData.opener[0].add(32).writeFloat(openerY);
            row++;

            if (!catData.open) continue;

            for (let btn of catData.btns) {
                let Y = 55 * (row + 1);
                btn.add(32).writeFloat(Y);
                row++;
            }
        }
    },
    closeDebugMenu() {
        debugMenu.scrollAreaUpdater.detach();
        GUI.stageRemoveChild(debugMenu.buttonArea);
        GUI.stageRemoveChild(debugMenu.menu);
        debugMenu.debugOpen = false;
    }
}

Interceptor.attach(homeModeEnter, {
    onEnter(args) {
        debugMenu.spawnOpenButton();
    }
});

Interceptor.replace(logicCharacterServerUltiUsed, new NativeCallback(function(a1) {
    if (!settings.infiniteUlti) return logicCharacterServerUltiUsed(a1);
    else return ptr(0);
}, "pointer", ["pointer"]));

loadSC("sc/debug.sc");
console.log("[* Candybrawl] Script loaded successfully!")