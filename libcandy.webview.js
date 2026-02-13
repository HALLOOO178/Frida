const base = Process.getModuleByName("libg.so").base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);

const guiGetInstance = new NativeFunction(base.add(0x1B1F0C), "pointer", []);
const guiShowPopup = new NativeFunction(base.add(0x1BE450), "void", ["pointer", "pointer", "int", "int", "int"]);
const popupBaseAddCloseButton = new NativeFunction(base.add(0x54FCD4), "void", ["pointer"]);
const genericPopupSetTitleTID = new NativeFunction(base.add(0x908E38), "int", ["pointer", "pointer"]);
const simpleWebviewCtor = new NativeFunction(base.add(0xDD9840), "pointer", ["pointer"]);
const simpleWebviewLoadUrl = new NativeFunction(base.add(0x754A88), "pointer", ["pointer", "pointer"]);

function createStringObject(txt) {
    const sptr = Memory.allocUtf8String(txt);
    const ptr = malloc(200);
    stringCtor(ptr, sptr);
    return ptr;
}

function readStringObject(pointer) {
    var len = pointer.add(4).readInt()
    console.log(len)
    if (len >= 8) {
        return pointer.add(8).readPointer().readUtf8String(len)
    }
    return pointer.add(8).readUtf8String(len)
}

function createWebview(title, url) {
    var popup = malloc(300)
    simpleWebviewCtor(popup)
    simpleWebviewLoadUrl(popup, createStringObject(url))
    genericPopupSetTitleTID(popup, createStringObject(title))
    guiShowPopup(guiGetInstance(), popup, 0, 1, 1)
}

Interceptor.attach(base.add(0x9D4160), { // Shows a webview whenever a button is pressed
    onEnter(args) {
       createWebview("google", "https://google.com/")
    }
})