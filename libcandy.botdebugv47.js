// Script by Hallo
// https://dsc.gg/candybrawl

const base = Process.getModuleByName('libg.so').base;
const trainingBrawlerCard = 0x17FC974; // "ShotgunGirl"

function enableBotDebug() {
    Memory.protect(base.add(trainingBrawlerCard), 1, "rw-");
    base.add(trainingBrawlerCard).writeUtf8String(card)
}

enableBotDebug()