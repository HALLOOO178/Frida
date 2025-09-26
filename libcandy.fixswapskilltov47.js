// LogicCharacterServer::swapSkillTo() Logic by @hallo178 and @smp_11 for v47
// https://dsc.gg/candybrawl | https://discord.gg/4vdVES3brc

const base = Process.getModuleByName('libg.so').base;
const free = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('free'), 'void', ['pointer']);
const logicSkillServerCtor = new NativeFunction(base.add(0x4C013C), "pointer", ["pointer", "pointer", "int"]);
const logicSkillServerDctor = new NativeFunction(base.add(0xAC6DD0), "int", ["pointer"]);
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

function fixSwapSkillTo() {
    Interceptor.replace(base.add(0x8BD054), new NativeCallback(function(a1, a2, a3) {
        if (![0, 1].includes(a2)) {
            console.log("[* LogicCharacterServer::swapSkillTo] Unknown skill slot: " + a2)
            return malloc(48)
        }
        var newSkill = malloc(48)
        logicSkillServerCtor(newSkill, a3, a2);
        const skillContainer = a1.add(284).readPointer()
        const skillCount = skillContainer.add(8).readPointer()
        const skillServer = skillContainer.add(4 * a2).readPointer()
        if (!skillServer.isNull()) {
            skillContainer.add(8).writeInt(skillCount.toInt32() - 1);
            logicSkillServerDctor(skillServer);
            free(skillServer);
        }
        skillContainer.add(8).writeInt(skillCount.toInt32() + 1);
        skillContainer.add(4 * a2).writePointer(newSkill)
        return newSkill;
    }, "pointer", ["pointer", "int", "pointer"]))
    console.log("[* LogicCharacterServer::swapSkillTo] swapSkillTo fixed!")
}

fixSwapSkillTo();