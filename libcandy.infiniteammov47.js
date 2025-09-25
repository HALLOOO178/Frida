// Infinite ammo in v47
// Made by @hallo178
// https://dsc.gg/candybrawl

const base = Process.getModuleByName("libg.so").base;
const logicSkillDataGetMaxCharge = base.add(0x469A04);

Interceptor.attach(logicSkillDataGetMaxCharge, {
    onLeave(retval) {
        retval.replace(ptr(0));
    }
})