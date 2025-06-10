
export type Rarity = 'common' | 'set' | 'unique' | 'rare' | 'legendary' | 'fabled' | 'mythic';

export type Identification = {
    value: string
    label: string
}

export interface IdentificationInfo {
    displayName: string;
    detailedName?: string;
    unit?: string;
    symbol?: string;
}

export interface DroppedByInfo {
    name: string;
    coords: number[] | number[][]
}

export interface IdentificationValue {
    min: number;
    raw: number;
    max: number;
}

export interface IdentificationsObject {
    [key: string]: number | IdentificationValue
}

export interface ItemIconObject {
    format: string;
    value: {
        id: string;
        customModelData: string;
        name: string;
    } | string;
}

export interface ItemRequirement {
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

export interface ItemBase {
    internalName: string //this is actually an id, not the ingame display name
    itemName?: string // this one is for some of my api endpoints that returns itemName instead of internalName 
    type: string
    subType?: string
    icon: ItemIconObject
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
        [key: string]: IdentificationValue
    }
    requirements?: ItemRequirement
    identifications?: IdentificationsObject
    majorIds: {
        [key: string]: string
    }
    droppedBy?: DroppedByInfo[]
    changelog?: ItemChangelog[]
}

export interface WeaponItem extends ItemBase {
    type: 'weapon'
    weaponType: string
    rarity: Rarity
    attackSpeed: string
    averageDps: number
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
    identified: true
    gatheringSpeed: number
}

export interface IngredientItem extends ItemBase {
    type: 'ingredient'
    tier: number
    requirements: {
        level: number
        skills: string[]
    }
    consumableOnlyIDs: {
        duration: number
        charges: number
    }
    ingredientPositionModifiers: {
        left: number
        right: number
        above: number
        under: number
        touching: number
        not_touching: number
    }
    itemOnlyIDs: {
        durabilityModifier: number
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
    identified: true
    tier: number
    craftable: string[]
}


export interface Tome extends ItemBase {
    type: 'tome'
    // type: 'guild_tome' | 'weapon_tome' | 'mysticism_tome' | 'lootrun_tome' | 'expertise_tome' | 'marathon_tome' | 'armour_tome'
    rarity: Rarity
}

export interface Charm extends ItemBase {
    type: 'charm'
    rarity: Rarity
}

export type Item = WeaponItem | ArmourItem | AccessoryItem | ToolItem | IngredientItem | MaterialItem | Tome | Charm
export type CombatItem = WeaponItem | ArmourItem | AccessoryItem | Tome | Charm

export type ItemChangelog = Item & {
    itemName: string;
    status: 'add' | 'remove' | 'modify';
    timestamp: number;
    before?: Item;
    after?: Item;
}

export interface Powder {
    element: number;
    tier: number;
}