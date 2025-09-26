// Script by Hallo
// https://dsc.gg/candybrawl

const base = Process.getModuleByName('libg.so').base;
const trainingBrawlerCard = 0x15CC5BC; // "ShotgunGirl"

function setTrainingCard(card) {
    Memory.protect(base.add(trainingBrawlerCard), card.length, "rw-");
    base.add(trainingBrawlerCard).writeUtf8String(card)
}

setTrainingCard("Jester")
