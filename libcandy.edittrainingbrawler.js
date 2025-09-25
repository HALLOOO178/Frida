// Script by Hallo
// https://dsc.gg/candybrawl

const base = Module.getBaseAddress('libg.so');
const trainingBrawlerCard = 0x15CC5BC; // "ShotgunGirl"

function setTrainingCard(card) {
    Memory.protect(base.add(trainingBrawlerCard), card.length, "rw-");
    Memory.writeUtf8String(base.add(trainingBrawlerCard), card);
}

setTrainingCard("Jester")