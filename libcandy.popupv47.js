const base = Process.getModuleByName("libg.so").base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);

const guiGetInstance = new NativeFunction(base.add(0x1B1F0C), "pointer", []);
const genericPopupCtor = new NativeFunction(base.add(0xC4CD5C), "pointer", ["pointer", "pointer", "int", "int", "pointer", "pointer", "pointer"]);
const guiShowPopup = new NativeFunction(base.add(0x1BE450), "void", ["pointer", "pointer", "int", "int", "int"]);
const popupBaseAddCloseButton = new NativeFunction(base.add(0x54FCD4), "void", ["pointer"]);
const genericPopupSetTitleTID = new NativeFunction(base.add(0x908E38), "int", ["pointer", "pointer"]);
const genericPopupSetTextTID = new NativeFunction(base.add(0x2E0B3C), "pointer", ["pointer", "pointer", "pointer"]);
const genericPopupAddButton = new NativeFunction(base.add(0x848FC0), "pointer", ["pointer", "pointer", "bool"]);

function createStringObject(txt) {
    const sptr = Memory.allocUtf8String(txt);
    const ptr = malloc(200);
    stringCtor(ptr, sptr);
    return ptr;
}

function createPopup(title="test", text="popup text", buttonText="button", grayOut=1, allowStacking=0) {
    var popup = malloc(300)
    var empty = createStringObject("")
    genericPopupCtor(popup, createStringObject("popup_brawltv"), 0, 0, empty, empty, empty);
    genericPopupSetTitleTID(popup, createStringObject(title))
    genericPopupSetTextTID(popup, createStringObject("info_txt"), createStringObject(text))
    var btn = genericPopupAddButton(popup, createStringObject("ok_button"), 0)
    new NativeFunction(btn.readPointer().add(192).readPointer(), "pointer", ["pointer", "pointer", "bool"])(btn, createStringObject(buttonText), 1)
    popupBaseAddCloseButton(popup);
    guiShowPopup(guiGetInstance(), popup, 1, allowStacking, grayOut)
    return btn.toInt32()
}

Interceptor.attach(base.add(0x9D4160), { // Shows a popup whenever a button is pressed (CustomButton::ButtonPressed)
    onEnter(args) {
        createPopup();
    }

})
