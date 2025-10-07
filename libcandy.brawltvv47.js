// Script by hallo
// https://dsc.gg/candybrawl

const base = Process.getModuleByName('libg.so').base;

Interceptor.attach(base.add(0xA57290), { // LogicBattleModeClient::addVisionUpdate
    onEnter(args) {
        var Spectators = args[1].add(92).readInt() // Amount of spectators, i set it to the ticks but feel free to set it to whatever you want
        args[1].add(104).writeInt(Spectators) // Spectators
        args[1].add(108).writeInt(1) // Is BrawlTV?(Set to 0 if you want normal spectators)
    }

})
