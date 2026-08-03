// NativeSCID server redirect
// by https://dsc.gg/candybrawl or more specifically @hallo178

// Disclaimer: this script barely works and it breaks often, dont use it in a production environment

const base = Process.getModuleByName("libg.so").base;

const connect = Process.getModuleByName("libc.so").getExportByName("connect");
const ntohs = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('ntohs'), 'uint16', ['uint16']);
const inet_addr = new NativeFunction(Process.getModuleByName("libc.so").getExportByName("inet_addr"), "uint32", ["pointer"]);

var connectcount = 0;

function inet2ip(value) {
    return [
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff
    ].join(".");
}

Interceptor.attach(connect, {
    onEnter(args) {
        if (["13.35.198.34", "13.35.198.44", "52.84.108.12", "52.84.108.37"].includes(inet2ip(args[1].add(4).readInt()))) {
            connectcount++;
            args[1].add(2).writeU16(ntohs(5000));
            args[1].add(4).writeInt(inet_addr(Memory.allocUtf8String("192.168.0.239")));
            console.log("connect " + connectcount);
        }
    }
});

console.log("Hooked")