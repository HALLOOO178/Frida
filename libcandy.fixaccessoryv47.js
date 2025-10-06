// Gadgets fix by @hallo178 for v47
/* What it fixes:
- Enabling gadgets
- Cooling gadgets down
- Getting gadget types
- Count and display gadget remaining uses
- Fix dashing gadgets
- Fix healing gadgets
- Fix jumping gadgets
- Fix random ulti gadgets
*/
// WARNING: This script doesn't fix gadget's logic on it's own!! It only fixes crashes and adds cooldown logic!
// https://dsc.gg/candybrawl

var config = {
    disableGadgetCooldowns: false, // Self explainatory, disables cooldowns but keeps the maximum amount of uses
    infiniteGadgets: false, // Keeps the cooldown but makes the uses infinite, just like the new gadgets
    gadgetForcing: {
        forceGadget: false, // Should gadgets always be a specific type
        gadgetToForce: "throw_opponent", // Gadget type to always use if forceGadget is true
    },
    canUseGadget: true, // Disables/Enables the button
    maxGadgetUses: 7, // Maximum amount of gadget uses, the maximum that can be displayed is 7 so anything over it will be shown as 7
    cooldownLengthMultipliers: { // 1 = Default, higher = faster, lower = slower
        dash: 1,
        random_ulti: 1,
        throw_opponent: 1,
        spawn: 1,
        item_area_trigger: 1,
        jump: 1,
        heal: 1,
        unknown: 1
    },
    throwOpponentRange: 500, // Range of the throw_opponent type gadgets
}

const base = Process.getModuleByName("libg.so").base;
const malloc = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('malloc'), 'pointer', ['uint']);
const free = new NativeFunction(Process.getModuleByName('libc.so').getExportByName('free'), 'void', ['pointer']);

const stringCtor = new NativeFunction(base.add(0xE1F254), "pointer", ["pointer", "pointer"]);
const logicCharacterServerGetClosestEnemy = new NativeFunction(base.add(0x306420), "pointer", ["pointer", "int", "int", "int", "int", "int", "int", "int", "int"]);

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
const logicMathGetAngle = new NativeFunction(base.add(0x2B7B20), "int", ["int", "int"]);

// Random ulti gadget logic functions
const LogicDataTablesGetSkillByName = new NativeFunction(base.add(0xB14918), "pointer", ["pointer", "int"]);
const logicSkillServerCtor = new NativeFunction(base.add(0x4C013C), "pointer", ["pointer", "pointer", "int"]);
const logicSkillServerDctor = new NativeFunction(base.add(0xAC6DD0), "int", ["pointer"]);
const LogicDataGetValueAt = new NativeFunction(base.add(0x6D8D08), "pointer", ["pointer", "int"]);
const logicCharacterServerGetUltiSkill = new NativeFunction(base.add(0x324A2C), "pointer", ["pointer"])

// Heal gadget logic function
const logicCharacterServerHeal = new NativeFunction(base.add(0xDA30F0), "pointer", ["pointer", "int", "int", "int", "int"]);

// Spawn gadget logic functions
const LogicDataTablesGetAreaEffectByName = new NativeFunction(base.add(0x44B4D0), "pointer", ["pointer", "int"]);
const logicGameObjectFactoryServerCreateGameObjectByData = new NativeFunction(base.add(0x29D22C), "pointer", ["pointer"]);
const logicGameObjectServerSetPosition = new NativeFunction(base.add(0xDA45A4), "pointer", ["pointer", "int", "int", "int"]);
const gameObjectManagerServerAddLogicGameObject = new NativeFunction(base.add(0x897C00), "pointer", ["int", "pointer"]);
const logicAreaEffectServerTrigger = new NativeFunction(base.add(0x270CD4), "pointer", ["pointer"]);
const logicGameObjectServerGetLogicBattleModeServer = new NativeFunction(base.add(0x38387C), "pointer", ["pointer"]);

// Reload gadget logic functions
const logicSkillServerAddCharge = new NativeFunction(base.add(0xB3F6C0), "pointer", ["pointer", "pointer", "int"]);

var gadget = "dash";
var gadgetCooldown = 0;
var canCoolDownGadget = false;
var gadgetEnabled = false;
var gadgetUses = 0;
var ActiveX = 0;
var ActiveY = 0;

const gadgetAbilities = {
    dash: function(characterServer, height=0, disableCollisions=0, isReversed=false) { // PS: This dash logic is pretty bad, feel free to make it better
        var activeAngle = logicCharacterServerGetMoveAngle(characterServer)
        var X = logicGameObjectServerGetX(characterServer)
        var rotX = logicMathGetRotatedX(100, 0, activeAngle)
        var rotY = logicMathGetRotatedY(100, 0, activeAngle)
        if (isReversed) {
            rotX = -rotX
            rotY = -rotY
        }
        logicCharacterServerTriggerPushback(characterServer, X, rotX, rotY, height, disableCollisions, 0, 1, 1, 0, 1, 0, 0, 0, 0)
    },
    random_ulti: function(characterServer) { // This logic is based off another script in this repo, @smp_11 helped me make it
        const skillContainer = characterServer.add(284).readPointer()
        const skillCount = skillContainer.add(8).readInt()
        const skillServer = skillContainer.add(4).readPointer()
        var currSkill = Util.readSkill(logicCharacterServerGetUltiSkill(characterServer))
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
    },
    heal: function(characterServer) {
        gameLogic.heal(characterServer, 1000)
    },
    spawn: function(characterServer) {
        const closestEnemy = gameLogic.getClosestEnemy(characterServer)
        const POS = [logicGameObjectServerGetX(closestEnemy), logicGameObjectServerGetY(closestEnemy)]
        gameLogic.spawnAOE(characterServer, "LuchadorMeteorSpawn", POS[0], POS[1]);
        setTimeout(function() {
            gameLogic.spawnAOE(characterServer, "LuchadorMeteorExplosion", POS[0], POS[1]);
        }, 2500)
    },
    jump: function(characterServer, usAOE=false) {
        this.dash(characterServer, 1000, 1);
        if (usAOE) gameLogic.spawnAOE(characterServer, "RocketJumpExplosion");
    },
    item_area_trigger: function(characterServer) {
        gameLogic.spawnAOE(characterServer, "WeaponThrowerPullArea");
    },
    throw_opponent: function(characterServer) { // This type is broken when used with el primo... 😭 I'll try to fix it edventually, I have other priorities right now
        const closestEnemy = gameLogic.getClosestEnemy(characterServer)
        const activeAngle = logicCharacterServerGetMoveAngle(characterServer) * -1
        var X = logicMathGetRotatedX(100, 0, activeAngle)
        var Y = logicMathGetRotatedY(100, 0, activeAngle)
        if (X * -1 <= config.throwOpponentRange && Y * -1 <= config.throwOpponentRange) logicCharacterServerTriggerPushback(closestEnemy, logicGameObjectServerGetX(closestEnemy), X, Y, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0)
    }
}

const gameLogic = {
    spawnAOE: function(characterServer, AOEType, X=-1, Y=-1) {
        if (X == -1) {
            X = logicGameObjectServerGetX(characterServer);
        }
        if (Y == -1) {
            Y = logicGameObjectServerGetY(characterServer);
        }
        var battleModeServer = logicGameObjectServerGetLogicBattleModeServer(characterServer).readU32();
        var aoeData = LogicDataTablesGetAreaEffectByName(Util.createStringObject(AOEType), 0);
        var aoe = logicGameObjectFactoryServerCreateGameObjectByData(aoeData);
        logicGameObjectServerSetPosition(aoe, X, Y, 0);
        gameObjectManagerServerAddLogicGameObject(battleModeServer, aoe);
        logicAreaEffectServerTrigger(aoe);
        return [X, Y];
    },
    heal: function(characterServer, amount) {
        logicCharacterServerHeal(characterServer, 0, amount, 1, 0);
    },
    getClosestEnemy: function(characterServer) {
        return logicCharacterServerGetClosestEnemy(characterServer, 35, 0, 0, 0, 0, 0, 0, 0)
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
        if (!config.gadgetForcing.forceGadget) {
            return this.readStringObject(getType(a2))
        } else return config.gadgetForcing.gadgetToForce
    }
}

const LogicAccessory = {
    activateAccessory: function(characterServer) {
        if (gadgetCooldown == 0) {
            gadgetCooldown = 100
            canCoolDownGadget = false;
            gadgetEnabled = true;
            gadgetUses += 1
            if (gadget == "dash") {
                console.log("[* LogicAccessory::triggerAccessory] Dashing!")
                gadgetAbilities.dash(characterServer)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            } else if (gadget == "random_ulti") {
                console.log("[* LogicAccessory::triggerAccessory] Getting random ulti!")
                gadgetAbilities.random_ulti(characterServer)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            } else if (gadget == "heal") {
                console.log("[* LogicAccessory::triggerAccessory] Healing!")
                gadgetAbilities.heal(characterServer)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            } else if (gadget == "jump") {
                console.log("[* LogicAccessory::triggerAccessory] Jumping!")
                gadgetAbilities.jump(characterServer, true)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            } else if (gadget == "spawn") {
                console.log("[* LogicAccessory::triggerAccessory] Spawning AOE!")
                gadgetAbilities.spawn(characterServer)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            } else if (gadget == "item_area_trigger") {
                console.log("[* LogicAccessory::triggerAccessory] Triggering AOE!")
                gadgetAbilities.item_area_trigger(characterServer)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            } else if (gadget == "throw_opponent") {
                console.log("[* LogicAccessory::triggerAccessory] Throwing closest opponent!")
                gadgetAbilities.throw_opponent(characterServer)
                gadgetEnabled = false;
                canCoolDownGadget = true;
            }
            else {
                console.log("[* LogicAccessory::triggerAccessory] Unknown gadget type: '" + gadget + "', triggering cooldown")
                gadgetEnabled = false;
                canCoolDownGadget = true;
            }
        }
    },
    updateAccessory: function() {
        var usesLeft = config.maxGadgetUses - gadgetUses
        Util.removeFunction(base.add(0x550F04))
        var cooldownMultipler = config.cooldownLengthMultipliers.unknown
        if (gadget in config.cooldownLengthMultipliers) cooldownMultipler = config.cooldownLengthMultipliers[gadget]
        if (gadgetCooldown >= 1 && canCoolDownGadget) {
            gadgetCooldown -= cooldownMultipler
        } else {
            if (canCoolDownGadget) gadgetCooldown = 0
        }
        if (config.infiniteGadgets) gadgetUses = 0
        if (config.disableGadgetCooldowns) gadgetCooldown = 0
        if (gadgetUses >= config.maxGadgetUses) gadgetCooldown = 100
        if (usesLeft > 7) usesLeft = 7
        if (usesLeft < 0) usesLeft = 0
        if (usesLeft <= 0) gadgetCooldown = 100
        var data = {
            uses: usesLeft,
            inUse: Number(!gadgetCooldown == 0),
            startUsingAgainTicks: (gadgetCooldown - cooldownMultipler) * 0.05,
            cooldown: gadgetCooldown
        }
        if (!config.canUseGadget) {
            gadgetCooldown = 0
            data.cooldown = 0
            data.inUse = 1
        }
        return data
    }
}

function fixAccessory() {
    Interceptor.attach(base.add(0xBD0ADC), { // LogicAccessory::LogicAccessory
        onEnter(args) {
            gadget = Util.getGadgetType(args[1])
            console.log("[* LogicAccessory::LogicAccessory] Gadget created with type: " + gadget + ". Initializing variables")
            gadgetEnabled = false;
            canCoolDownGadget = false;
            gadgetCooldown = 0;
            gadgetUses = 0;
        }
    })
    Interceptor.replace(base.add(0x5A4F84), new NativeCallback(function(a1, a2, a3) { // LogicAccessory::encode
        const data = LogicAccessory.updateAccessory();
        bitStreamWriteBoolean(a2, 0);
        bitStreamWritePositiveVInt(a2, data.cooldown, 3);
        bitStreamWritePositiveVInt(a2, data.inUse, 4); // State
        if (Boolean(data.inUse)) {
            bitStreamWritePositiveInt(a2, 0, 14);
            bitStreamWritePositiveInt(a2, 0, 9);
        }
        bitStreamWritePositiveInt(a2, data.uses, 3);
    }, "void", ["pointer", "pointer", "int"]))
    Interceptor.attach(base.add(0x83B6E4), { // LogicAccessory::triggerAccessory
        onEnter(args) {
            console.log("[* LogicAccessory::triggerAccessory] Gadget triggered! Current cooldown: " + gadgetCooldown + ", can gadget be cooled down: " + canCoolDownGadget + ", gadget currently enabled: " + gadgetEnabled + ", gadget type: " + gadget)
            LogicAccessory.activateAccessory(args[1])
        }
    })
    console.log("[* Candybrawl] Gadgets fixed!")
}

fixAccessory();
