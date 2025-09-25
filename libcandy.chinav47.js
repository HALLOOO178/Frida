// Script to enable china mode in v47 while also bypassing the tencent login
// By @hallo178
// https://dsc.gg/candybrawl

const base = Process.getModuleByName("libg.so").base;

const LogicVersionIsChinaBuild = base.add(0x4E915C);
const TencentManagerIsFeatureEnabled = base.add(0x38A598);

Interceptor.attach(LogicVersionIsChinaBuild, {
    onLeave(retval) {
        retval.replace(ptr(1))
    }
});

Interceptor.attach(TencentManagerIsFeatureEnabled, {
    onLeave(retval) {
        retval.replace(ptr(0))
    }
});


console.log("Injected!");
