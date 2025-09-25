// Script that disables bot's AIs in v47
// Made by @hallo178
// https://dsc.gg/candybrawl

const base = Process.getModuleByName('libg.so').base;

Interceptor.replace(base.add(0xBCFBB0), new NativeCallback(function(a1) { // LogicCharacterServer::tickAI
    return a1;
}, "pointer", ["pointer"]));