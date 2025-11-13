

// Define the possible rarity levels for items
export type Rarity = 'common' | 'set' | 'unique' | 'rare' | 'legendary' | 'fabled' | 'mythic';

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
    format: "attribute" | "legacy" | "skin";
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

export interface ItemBase<TType extends string = string> {
    internalName: string //this is actually an id, not the ingame display name
    itemName?: string // this one is for some of my api endpoints that returns itemName instead of internalName 
    id?: string  // this one is for some of my api endpoints that returns itemName instead of internalName
    rarity?: Rarity;
    type: TType;
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
    changelog?: ItemChangelog[] // Added for tracking changes to the item over time
}

export interface WeaponItem extends ItemBase<'weapon'> {
    weaponType: string;
    attackSpeed: string;
    averageDps: number;
}

export interface AccessoryItem extends ItemBase<'accessory'> {
    accessoryType: string;
}

export interface ArmourItem extends ItemBase<'armour'> {
    armourMaterial: string;
    armourType: string;
}

export interface ToolItem extends ItemBase<'tool'> {
    identified: true;
    gatheringSpeed: number;
}

export interface IngredientItem extends ItemBase<'ingredient'> {
    tier: number;
    requirements: { level: number; skills: string[] };
    consumableOnlyIDs: { duration: number; charges: number };
    ingredientPositionModifiers: Record<
        'left' | 'right' | 'above' | 'under' | 'touching' | 'not_touching',
        number
    >;
    itemOnlyIDs: Record<
        | 'durabilityModifier'
        | 'strength_requirement'
        | 'dexterity_requirement'
        | 'intelligence_requirement'
        | 'defence_requirement'
        | 'agility_requirement',
        number
    >;
    droppedBy: DroppedByInfo[];
}

export interface MaterialItem extends ItemBase<'material'> {
    identified: true;
    tier: number;
    craftable: string[];
}

export interface Tome extends ItemBase<'tome'> { }
export interface Charm extends ItemBase<'charm'> { }

export type Item = WeaponItem | ArmourItem | AccessoryItem | ToolItem | IngredientItem | MaterialItem | Tome | Charm
export type CombatItem = WeaponItem | ArmourItem | AccessoryItem | Tome | Charm

export type ItemChangelog = Item & {
    itemName: string;
    status: 'add' | 'remove' | 'modify';
    timestamp: number;
    before?: Item;
    after?: Item;
}
