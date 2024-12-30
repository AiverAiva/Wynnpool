
export type Rarity = 'common' | 'set' | 'unique' | 'rare' | 'legendary' | 'fabled' | 'mythic';

export type Identification = {
    value: string
    label: string
}

export interface IdentificationInfo {
    displayName: string;
    unit?: string;
    symbol?: string;
}

export interface DroppedByInfo {
    name: string;
    coords: [number, number, number, number?] | null;
}

const identificationMap: Record<string, IdentificationInfo> = {
    "baseHealth": { unit: "", displayName: "Health", symbol: "" },
    "baseEarthDefence": { unit: "%", displayName: "Earth Defence", symbol: ""  },
    "baseThunderDefence": { unit: "%", displayName: "Thunder Defence", symbol: "" },
    "dexterity": { unit: "", displayName: "Dexterity Min" },
    "intelligence": { unit: "", displayName: "Intelligence Min" },
    "rawIntelligence": { unit: "", displayName: "Intelligence" },
    "spellDamage": { unit: "%", displayName: "Spell Damage" },
    "thunderDamage": { unit: "%", displayName: "Thunder Damage" },
    "waterDamage": { unit: "%", displayName: "Water Damage" },
    "baseWaterDefence": { unit: "", displayName: "Water Defence", symbol: "" },
    "baseAirDefence": { unit: "", displayName: "Air Defence", symbol: "" },
    "agility": { unit: "", displayName: "Agility Min" },
    "mainAttackDamage": { unit: "%", displayName: "Main Attack Damage" },
    "rawMainAttackDamage": { unit: "", displayName: "Main Attack Damage" },
    "walkSpeed": { unit: "%", displayName: "Walk Speed" },
    "xpBonus": { unit: "%", displayName: "Xp Bonus" },
    "airDamage": { unit: "%", displayName: "Air Damage" },
    "waterDefence": { unit: "%", displayName: "Water Defence" },
    "airDefence": { unit: "%", displayName: "Air Defence" },
    "baseEarthDamage": { unit: "", displayName: "Earth Damage", symbol: "" },
    "baseFireDamage": { unit: "", displayName: "Fire Damage", symbol: "" },
    "strength": { unit: "", displayName: "Strength Min" },
    "defence": { unit: "", displayName: "Defence Min" },
    "manaRegen": { unit: "/5s", displayName: "Mana Regen" },
    "manaSteal": { unit: "/3s", displayName: "Mana Steal" },
    "earthDamage": { unit: "%", displayName: "Earth Damage" },
    "fireDamage": { unit: "%", displayName: "Fire Damage" },
    "rawHealth": { unit: "", displayName: "Health Bonus" },
    "exploding": { unit: "%", displayName: "Exploding" },
    "baseDamage": { unit: "", displayName: "Neutral Damage", symbol: "" },
    "baseThunderDamage": { unit: "", displayName: "Thunder Damage", symbol: "" },
    "lifeSteal": { unit: "/3s", displayName: "Life Steal" },
    "reflection": { unit: "%", displayName: "Reflection" },
    "lootBonus": { unit: "%", displayName: "Loot Bonus" },
    "poison": { unit: "", displayName: "Poison" },
    "elementalDamage": { unit: "%", displayName: "Elemental Damage" },
    "rawDefence": { unit: "", displayName: "Defence" },
    "rawAgility": { unit: "", displayName: "Agility" },
    "healthRegenRaw": { unit: "", displayName: "Health Regen Raw" },
    "rawAttackSpeed": { unit: "", displayName: "Attack Speed" },
    "rawStrength": { unit: "", displayName: "Strength" },
    "healthRegen": { unit: "%", displayName: "Health Regen" },
    "rawSpellDamage": { unit: "", displayName: "Spell Damage" },
    "thorns": { unit: "%", displayName: "Thorns" },
    "thunderDefence": { unit: "%", displayName: "Thunder Defence" },
    "baseFireDefence": { unit: "", displayName: "Fire Defence", symbol: "" },
    "rawDexterity": { unit: "", displayName: "Dexterity" },
    "baseAirDamage": { unit: "", displayName: "Air Damage", symbol: "" },
    "earthDefence": { unit: "%", displayName: "Earth Defence" },
    "fireDefence": { unit: "%", displayName: "Fire Defence" },
    "4thSpellCost": { unit: "%", displayName: "4th Spell Cost" },
    "rawFireDamage": { unit: "", displayName: "Fire Damage" },
    "raw1stSpellCost": { unit: "", displayName: "1st Spell Cost" },
    "healingEfficiency": { unit: "%", displayName: "Healing Efficiency" },
    "baseWaterDamage": { unit: "%", displayName: "Water Damage", symbol: "" },
    "elementalSpellDamage": { unit: "%", displayName: "Elemental Spell Damage" },
    "3rdSpellCost": { unit: "%", displayName: "3rd Spell Cost" },
    "1stSpellCost": { unit: "%", displayName: "1st Spell Cost" },
    "raw4thSpellCost": { unit: "", displayName: "4th Spell Cost" },
    "stealing": { unit: "%", displayName: "Stealing" },
    "2ndSpellCost": { unit: "%", displayName: "2nd Spell Cost" },
    "rawFireMainAttackDamage": { unit: "", displayName: "Fire Main Attack Damage" },
    "rawAirMainAttackDamage": { unit: "", displayName: "Air Main Attack Damage" },
    "elementalMainAttackDamage": { unit: "%", displayName: "Elemental Main Attack Damage" },
    "knockback": { unit: "%", displayName: "Knockback" },
    "raw2ndSpellCost": { unit: "", displayName: "2nd Spell Cost" },
    "raw3rdSpellCost": { unit: "", displayName: "3rd Spell Cost" },
    "thunderMainAttackDamage": { unit: "%", displayName: "Thunder Main Attack Damage" },
    "rawThunderMainAttackDamage": { unit: "", displayName: "Thunder Main Attack Damage" },
    "elementalDefence": { unit: "%", displayName: "Elemental Defence" },
    "jumpHeight": { unit: "", displayName: "Jump Height" },
    "neutralDamage": { unit: "%", displayName: "Neutral Damage" },
    "slowEnemy": { unit: "%", displayName: "Slow Enemy" },
    "rawEarthMainAttackDamage": { unit: "", displayName: "Earth Main Attack Damage" },
    "sprintRegen": { unit: "%", displayName: "Sprint Regen" },
    "rawThunderDamage": { unit: "", displayName: "Thunder Damage" },
    "rawWaterDamage": { unit: "", displayName: "Water Damage" },
    "sprint": { unit: "%", displayName: "Sprint" },
    "fireSpellDamage": { unit: "%", displayName: "Fire Spell Damage" },
    "airSpellDamage": { unit: "%", displayName: "Air Spell Damage" },
    "earthMainAttackDamage": { unit: "%", displayName: "Earth Main Attack Damage" },
    "weakenEnemy": { unit: "%", displayName: "Weaken Enemy" },
    "airMainAttackDamage": { unit: "%", displayName: "Air Main Attack Damage" },
    "waterSpellDamage": { unit: "%", displayName: "Water Spell Damage" },
    "rawThunderSpellDamage": { unit: "", displayName: "Thunder Spell Damage" },
    "rawElementalSpellDamage": { unit: "", displayName: "Elemental Spell Damage" },
    "rawAirSpellDamage": { unit: "", displayName: "Air Spell Damage" },
    "thunderSpellDamage": { unit: "%", displayName: "Thunder Spell Damage" },
    "earthSpellDamage": { unit: "%", displayName: "Earth Spell Damage" },
    "rawEarthDamage": { unit: "", displayName: "Earth Damage" },
    "rawNeutralSpellDamage": { unit: "", displayName: "Neutral Spell Damage" },
    "rawDamage": { unit: "", displayName: "Damage" },
    "rawFireSpellDamage": { unit: "", displayName: "Fire Spell Damage" },
    "neutralMainAttackDamage": { unit: "%", displayName: "Neutral Main Attack Damage" },
    "rawWaterSpellDamage": { unit: "", displayName: "Water Spell Damage" },
    "fireMainAttackDamage": { unit: "%", displayName: "Fire Main Attack Damage" },
    "rawElementalDamage": { unit: "", displayName: "Elemental Damage" },
    "rawNeutralDamage": { unit: "", displayName: "Neutral Damage" },
    "rawElementalMainAttackDamage": { unit: "", displayName: "Elemental Main Attack Damage" },
    "damage": { unit: "%", displayName: "Damage" },
    "rawAirDamage": { unit: "", displayName: "Air Damage" },
    "rawEarthSpellDamage": { unit: "", displayName: "Earth Spell Damage" },
    "rawNeutralMainAttackDamage": { unit: "", displayName: "Neutral Main Attack Damage" },
    "leveledXpBonus": { unit: "", displayName: "Leveled XP Bonus" },
    "damageFromMobs": { unit: "", displayName: "Damage From Mobs" },
    "leveledLootBonus": { unit: "", displayName: "Leveled Loot Bonus" },
    "gatherXpBonus": { unit: "%", displayName: "Gather XP Bonus" },
    "rawWaterMainAttackDamage": { unit: "", displayName: "Water Main Attack Damage" },
    "gatherSpeed": { unit: "%", displayName: "Gather Speed" },
    "lootQuality": { unit: "%", displayName: "Loot Quality" },
    "neutralSpellDamage": { unit: "%", displayName: "Neutral Spell Damage" },
    "mainAttackNeutraDamageBonus": { unit: "%", displayName: "Attack Neutral Damage Bonus" },
    "rawMaxMana": { unit: "", displayName: "Max Mana" },
    "level": { displayName: "Combat Level" },
    "classRequirement": { displayName: "Class Req" },
};

export function getIdentificationInfo(identification: string): IdentificationInfo | undefined {
    return identificationMap[identification];
}

export interface ItemBase {
    internalName: string
    type: string
    subType?: string
    icon: {
        value: { id: string; name: string; customModelData: string } | string
        format: string
    }
    identified?: boolean
    allow_craftsman?: boolean
    powderSlots?: number
    lore?: string
    dropRestriction?: string
    restrictions?: string //its plural somehow so
    raidReward?: boolean
    dropMeta?: {
        coordinates: [number, number, number]
        name: string
        type: string
        event: string
    }
    base?: {
        [key: string]: {
            min: number
            max: number
            raw: number
        }
    }
    requirements?: {
        level?: number
        levelRange?: {
            min: number
            max: number
        }
        strength?: number
        dexterity?: number
        intelligence?: number
        defence?: number
        agility?: number
        quest?: string
        class_requirement?: string
        skills?: string[]
    }
    identifications?: {
        [key: string]: number | {
            min: number
            max: number
            raw: number
        }
    }
    majorIds?: {
        [key: string]: string
    }
    droppedBy?: DroppedByInfo[]
}

export interface WeaponItem extends ItemBase {
    type: 'weapon'
    rarity: Rarity
    attackSpeed: string
    averageDPS: number
}

export interface AccessoryItem extends ItemBase {
    type: 'accessory'
    rarity: Rarity
    accessoryType: string
}

export interface ArmourItem extends ItemBase {
    type: 'armour'
    rarity: Rarity
    armourMaterial: string
    armourType: string
}

export interface ToolItem extends ItemBase {
    type: 'tool'
    gatheringSpeed: number
}

export interface IngredientItem extends ItemBase {
    type: 'ingredient'
    tier: string
    requirements: {
        level: number
        skills: string[]
    }
    consumableOnlyIDs?: {
        duration: number
        charges: number
    }
    ingredientPositionModifiers?: {
        left: number
        right: number
        above: number
        under: number
        touching: number
        not_touching: number
    }
    itemOnlyIDs?: {
        durability_modifier: number
        strength_requirement: number
        dexterity_requirement: number
        intelligence_requirement: number
        defence_requirement: number
        agility_requirement: number
    }
    droppedBy: DroppedByInfo[]
}

export interface MaterialItem extends ItemBase {
    type: 'material'
    tier: string
    craftable: string[]
}

export type Item = WeaponItem | ArmourItem | AccessoryItem | ToolItem | IngredientItem | MaterialItem 


