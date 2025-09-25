// Gadgets fix by @hallo178 for v47
/* What it fixes:
- Enabling gadgets
- Cooling gadgets down
- Getting gadget types
- Count gadget remaining uses
*/
/* What it doesn't fix:
- Display remaining uses
*/
// WARNING: This script doesn't fix gadget's logic on it's own!! It only fixes crashes and adds cooldown logic!
// https://dsc.gg/candybrawl

var config = {
    disableGadgetCooldowns: false,
    infiniteGadgets: false,
    alwaysForceGadget: false,
    gadgetToForce: "next_attack_change",
    canUseGadget: true,
    maxGadgetUses: 7,
}

const base = Process.getModuleByName("libg.so").base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);
const bitStreamWritePositiveInt = new NativeFunction(base.add(0xC67C68), "pointer", ["pointer", "int", "int"]);
const bitStreamWritePositiveVInt = new NativeFunction(base.add(0xB3A0F4), "pointer", ["pointer", "int", "int"]);

var gadget = "dash";
var gadgetCooldown = 0;
var canCoolDownGadget = false;
var gadgetEnabled = false;
var gadgetUses = 0;

function stringPtr(txt) {
    return Memory.allocUtf8String(txt);
}

function readStringObject(pointer) {
    var len = pointer.add(4).readInt()
    if (len >= 8) {
        return pointer.add(Process.pointerSize * 2).readPointer().readUtf8String(len)
    }
    return pointer.add(Process.pointerSize * 2).readUtf8String(len)
}

function createStringObject(txt) {
    const sptr = stringPtr(txt);
    const ptr = malloc(200);
    stringCtor(ptr, sptr);
    return ptr;
}

function updateGadgetCooldown() {
    if (gadgetCooldown >= 1 && canCoolDownGadget) {
        gadgetCooldown -= 1
    } else {
        if (canCoolDownGadget) gadgetCooldown = 0
    }
    if (config.infiniteGadgets) gadgetUses = 0
    if (config.disableGadgetCooldowns) gadgetCooldown = 0
    if (gadgetUses >= config.maxGadgetUses) gadgetCooldown = 100
    if (!config.canUseGadget) gadgetCooldown = 100
}

function fixAccessory() {
    const getType = new NativeFunction(base.add(0xAE06B0), "pointer", ["pointer"])
    Interceptor.attach(base.add(0xBD0ADC), {
        onEnter(args) {
            gadget = readStringObject(getType(args[1]))
            console.log("[* LogicAccessory::LogicAccessory] Gadget created with type: " + gadget)
        }
    })
    Interceptor.attach(base.add(0xAE06B0), {
        onLeave(retval) {
            if (config.alwaysForceGadget) retval.replace(createStringObject(config.gadgetToForce))
        }
    })
    Interceptor.replace(base.add(0x5A4F84), new NativeCallback(function(a1, a2, a3) {
        updateGadgetCooldown();
        bitStreamWritePositiveInt(a2, 0, 1);
        bitStreamWritePositiveVInt(a2, gadgetCooldown, 3);
        bitStreamWritePositiveVInt(a2, Number(!gadgetCooldown == 0), 4); // State
        if (gadgetCooldown != 0) {
            bitStreamWritePositiveInt(a2, 0, 14);
            bitStreamWritePositiveInt(a2, 0, 9);
        }
    }, "void", ["pointer", "pointer", "int"]))
    Interceptor.attach(base.add(0x83B6E4), {
        onEnter(args) {
            console.log("[* LogicAccessory::triggerAccessory] Gadget triggered! Current cooldown: " + gadgetCooldown + ", can gadget be cooled down: " + canCoolDownGadget + ", gadget currently enabled: " + gadgetEnabled + ", gadget type: " + gadget)
            if (gadgetCooldown == 0) {
                gadgetCooldown = 100
                canCoolDownGadget = false;
                gadgetEnabled = true;
                gadgetUses += 1
                if (gadget == "next_attack_change") {
                    console.log("[* LogicAccessory::triggerAccessory] Attack changed for 5 seconds!(fake it didnt actually do anything XD)")
                    setTimeout(function() {
                        gadgetEnabled = false;
                        canCoolDownGadget = true;
                    }, 5000)
                } else {
                    console.log("[* LogicAccessory::triggerAccessory] Unknown gadget type: '" + gadget + "', triggering cooldown")
                    gadgetEnabled = false;
                    canCoolDownGadget = true;
                }
            }
        }
    })
    Interceptor.attach(base.add(0xE082F4), {
        onEnter(args) {
            gadgetEnabled = false;
            canCoolDownGadget = false;
            gadgetCooldown = 0;
            gadgetUses = 0;
        }
    })
    console.log("[* Candybrawl] Gadgets fixed!")
}


fixAccessory();
