const base = Process.getModuleByName("libg.so").base;

const LogicCharacterServerEncode = base.add(0x86B86C);

const buffAddresses = {
    target: base.add(0x86BB1C),
    mute: base.add(0x86BB28),
    slowness: base.add(0x86BAE8),
    speed: base.add(0x86BADC),
    slippery: base.add(0x86BA98),
    suppress: base.add(0x86BAF8),
}

var enabledBuffs = []

function enableBuff(offset, state) {
    Memory.patchCode(offset, 4, function(code) {
        var w = new ArmWriter(code, {pc: offset})
        if (state) w.putInstruction(0)
        else w.putInstruction(-476049408)
        w.flush()
    })
}

function toggleBuff(buffID, state, offset) {
    if (state) {
        if (!enabledBuffs.includes(buffID)) enabledBuffs.push(buffID)
    } else {
        enabledBuffs.pop(buffID)
    }
    enableBuff(offset, state)
}

// Example usage:
toggleBuff(0, true, buffAddresses.target) // Now everyone will be targeted forever

console.log("Injected!");