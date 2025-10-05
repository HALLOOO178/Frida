// Gadgets fix by @hallo178 for v47
/* What it fixes:
- Enabling gadgets
- Cooling gadgets down
- Getting gadget types
- Count and display gadget remaining uses
- Fix dashing gadgets
- Fix random ulti(Chester's fist gadget) gadgets
*/
// WARNING: This script doesn't fix gadget's logic on it's own!! It only fixes crashes and adds cooldown logic!
// https://dsc.gg/candybrawl

var config = {
    disableGadgetCooldowns: false, // Self explainatory, disables cooldowns but keeps the maximum amount of uses
    infiniteGadgets: true, // Keeps the cooldown but makes the uses infinite, just like the new gadgets
    alwaysForceGadget: false, // Only allows to use a specific gadget type
    gadgetToForce: "dash", // Gadget type to always use
    canUseGadget: true, // Disables/Enables the button
    maxGadgetUses: 3, // Maximum amount of gadget uses, the maximum that can be displayed is 7 so anything over it will be shown as 7
    cooldownLengthMultiplier: 1, // 1 = Default, higher = faster, lower = slower
}

const base = Process.getModuleByName("libg.so").base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);

// Functions to fix gadget structure
const bitStreamWriteBoolean = new NativeFunction(base.add(0x89068C), "pointer", ["pointer", "bool"]);
const bitStreamWritePositiveInt = new NativeFunction(base.add(0xC67C68), "pointer", ["pointer", "int", "int"]);
const bitStreamWritePositiveVInt = new NativeFunction(base.add(0xB3A0F4), "pointer", ["pointer", "int", "int"]);

// Dashing gadget logic functions
const logicCharacterServerTriggerPushback = new NativeFunction(base.add(0x603478), "pointer", ["pointer", "int", "int", "int", "int", "bool", "int", "int", "int", "bool", "int", "int", "int", "int", "int"]);
const logicGameObjectServerGetX = new NativeFunction(base.add(0x96BF14), "int", ["pointer"]);
const logicGameObjectServerGetY = new NativeFunction(base.add(0x13CB30), "int", ["pointer"]);
const logicMathGetRotatedX = new NativeFunction(base.add(0x1B50A0), "int", ["int", "int", "int"]);
const logicMathGetRotatedY = new NativeFunction(base.add(0x6D4234), "int", ["int", "int", "int"]);
const logicAccessoryGetActivationAngle = new NativeFunction(base.add(0x65AA38), "int", ["pointer"]);
const logicCharacterServerGetMoveAngle = new NativeFunction(base.add(0xB64B70), "int", ["pointer"]);

// Random ulti gadget logic function
const LogicDataTablesGetSkillByName = new NativeFunction(base.add(0xB14918), "pointer", ["pointer", "int"]);
const free = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('free'), 'void', ['pointer']);
const logicSkillServerCtor = new NativeFunction(base.add(0x4C013C), "pointer", ["pointer", "pointer", "int"]);
const logicSkillServerDctor = new NativeFunction(base.add(0xAC6DD0), "int", ["pointer"]);
const LogicDataGetValueAt = new NativeFunction(base.add(0x6D8D08), "pointer", ["pointer", "int"]);

var gadget = "dash";
var gadgetCooldown = 0;
var canCoolDownGadget = false;
var gadgetEnabled = false;
var gadgetUses = 0;

const gadgetAbilities = {
    dash: function(characterServer) { // PS: This dash logic is pretty bad, feel free to make it better
        var activeAngle = logicCharacterServerGetMoveAngle(characterServer)
        var X = logicGameObjectServerGetX(characterServer)
        var Y = logicGameObjectServerGetY(characterServer)
        var rotX = logicMathGetRotatedX(100, 100, activeAngle)
        var rotY = logicMathGetRotatedY(100, 100, activeAngle)
        logicCharacterServerTriggerPushback(characterServer, X, rotX, rotY, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0)
    },
    random_ulti: function(characterServer) {
        const skillContainer = characterServer.add(284).readPointer()
        const skillCount = skillContainer.add(8).readInt()
        const skillServer = skillContainer.add(4).readPointer()
        var currSkill = Util.readSkill(new NativeFunction(base.add(0x324A2C), "pointer", ["pointer"])(characterServer))
        var skillToSwapTo = Util.getRandomSkill(currSkill)
        var newSkill = malloc(48)
        logicSkillServerCtor(newSkill, skillToSwapTo, 1);
        if (!skillServer.isNull()) {
            skillContainer.add(8).writeInt(skillCount - 1);
            logicSkillServerDctor(skillServer);
            free(skillServer);
        }
        skillContainer.add(8).writeInt(skillCount + 1);
        skillContainer.add(4).writePointer(newSkill)
    }
}

const Util = {
    readSkill: function(data) { // By @smp_11
        return this.readStringObject(LogicDataGetValueAt(data, 0)).toString()
    },
    getRandomItemFromList: function(list) {
        var randIdx = Math.floor(Math.random() * list.length);
        return list[randIdx];
    },
    removeFunction: function(addr) {
        Memory.patchCode(addr, 4, function(code) {
            var w = new ArmWriter(code, {pc: addr})
            w.putNop()
            w.flush()
        })
    },
    stringPtr: function(txt) {
        return Memory.allocUtf8String(txt)
    },
    readStringObject: function(pointer) {
        var len = pointer.add(4).readInt()
        if (len >= 8) {
            return pointer.add(Process.pointerSize * 2).readPointer().readUtf8String(len)
        }
        return pointer.add(Process.pointerSize * 2).readUtf8String(len)
    },
    createStringObject: function(txt) {
        const sptr = this.stringPtr(txt);
        const ptr = malloc(200);
        stringCtor(ptr, sptr);
        return ptr;
    },
    getRandomSkill: function(skillToRemove) {
        var ultis = ["JesterUltiStunning", "JesterUltiHeal", "JesterUltiExploding", "JesterUltiPoisoning", "JesterUltiDamageArea"]
        ultis.filter(item => item !== skillToRemove);
        const newUlti = this.getRandomItemFromList(ultis)
        return LogicDataTablesGetSkillByName(this.createStringObject(newUlti), 0)
    },
    getGadgetType: function(a2) {
        const getType = new NativeFunction(base.add(0xAE06B0), "pointer", ["pointer"])
        if (!config.alwaysForceGadget) {
            return this.readStringObject(getType(a2))
        } else return config.gadgetToForce
    }
}

function updateGadgetCooldown() {
    var usesLeft = config.maxGadgetUses - gadgetUses
    Util.removeFunction(base.add(0x550F04))
    Util.removeFunction(base.add(0x550F00))
    Util.removeFunction(base.add(0x550EFC))
    if (gadgetCooldown >= 1 && canCoolDownGadget) {
        gadgetCooldown -= config.cooldownLengthMultiplier
    } else {
        if (canCoolDownGadget) gadgetCooldown = 0
    }
    if (config.infiniteGadgets) gadgetUses = 0
    if (config.disableGadgetCooldowns) gadgetCooldown = 0
    if (gadgetUses >= config.maxGadgetUses) gadgetCooldown = 100
    if (usesLeft > 7) usesLeft = 7
    if (usesLeft < 0) usesLeft = 0
    if (usesLeft <= 0) gadgetCooldown = 100
    if (!config.canUseGadget) gadgetCooldown = 100
    return usesLeft
}

function fixAccessory() {
    
    Interceptor.attach(base.add(0xBD0ADC), {
        onEnter(args) {
            gadget = Util.getGadgetType(args[1])
            console.log("[* LogicAccessory::LogicAccessory] Gadget created with type: " + gadget + ". Initializing variables")
            gadgetEnabled = false;
            canCoolDownGadget = false;
            gadgetCooldown = 0;
            gadgetUses = 0;
        }
    })
    Interceptor.replace(base.add(0x5A4F84), new NativeCallback(function(a1, a2, a3) {
        var usesLeft = updateGadgetCooldown();
        bitStreamWritePositiveInt(a2, 0, 1);
        bitStreamWritePositiveVInt(a2, gadgetCooldown, 3);
        bitStreamWritePositiveVInt(a2, Number(!gadgetCooldown == 0), 4); // State
        if (gadgetCooldown != 0) {
            bitStreamWritePositiveInt(a2, 0, 14);
            bitStreamWritePositiveInt(a2, 0, 9);
        }
        bitStreamWritePositiveInt(a2, usesLeft, 3);
    }, "void", ["pointer", "pointer", "int"]))
    Interceptor.attach(base.add(0x83B6E4), {
        onEnter(args) {
            console.log("[* LogicAccessory::triggerAccessory] Gadget triggered! Current cooldown: " + gadgetCooldown + ", can gadget be cooled down: " + canCoolDownGadget + ", gadget currently enabled: " + gadgetEnabled + ", gadget type: " + gadget)
            if (gadgetCooldown == 0) {
                gadgetCooldown = 100
                canCoolDownGadget = false;
                gadgetEnabled = true;
                gadgetUses += 1
                if (gadget == "dash") {
                    console.log("[* LogicAccessory::triggerAccessory] Dashing!")
                    gadgetAbilities.dash(args[1])
                    gadgetEnabled = false;
                    canCoolDownGadget = true;
                } else if (gadget == "random_ulti") {
                    console.log("[* LogicAccessory::triggerAccessory] Getting random ulti!")
                    gadgetAbilities.random_ulti(args[1])
                    gadgetEnabled = false;
                    canCoolDownGadget = true;
                }
                else {
                    console.log("[* LogicAccessory::triggerAccessory] Unknown gadget type: '" + gadget + "', triggering cooldown")
                    gadgetEnabled = false;
                    canCoolDownGadget = true;
                }
            }
        }
    })
    console.log("[* Candybrawl] Gadgets fixed!")
}

fixAccessory();

