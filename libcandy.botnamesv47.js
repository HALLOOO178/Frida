// Random bot names in v47
// Made by @hallo178
// https://dsc.gg/candybrawl

const base = Process.getModuleByName('libg.so').base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const botNames = ["Hallo", "Hyper", "Rotolav", "SMP", "Anglefire"];

const localizationGetString = base.add(0xD7FDB8);
const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);

function createStringObject(txt) {
    const sptr = Memory.allocUtf8String(txt);
    const ptr = malloc(200);
    stringCtor(ptr, sptr);
    return ptr;
}

function readStringObject(pointer) {
    var len = pointer.add(4).readInt()
    if (len >= 8) {
        return pointer.add(8).readPointer().readUtf8String(len)
    }
    return pointer.add(8).readUtf8String(len)
}


function getRandomItemFromList(list) {
    var randIdx = Math.floor(Math.random() * list.length);
    return list[randIdx];
}

Interceptor.attach(localizationGetString, {
    onEnter(args) {
        this.tid = readStringObject(args[1])
    },
    onLeave(retval) {
        if (this.tid.includes("TID_BOT_")) retval.replace(createStringObject(getRandomItemFromList(botNames)))
    }
})