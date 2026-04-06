

// Define tier enum for items (replaces numeric tiers for ingredients/materials)
export type TierEnum = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';

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
    // removed: levelRange - was removed from API
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
    tier: Rarity;  // Changed from rarity - unified for item rarity (was rarity on combat items, tier on ingredients/materials)
    type: TType;
    subType?: string  // unified from weaponType/armourType/accessoryType etc
    icon: ItemIconObject
    identified?: boolean
    allow_craftsman?: boolean
    powderSlots?: number
    lore?: string
    dropRestriction?: string
    restriction?: string  // New field from API
    restrictions?: string //its plural somehow so
    // removed: raid_reward - use subType for item classification instead
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
    majorIds?: {  // Made optional as it may not exist in new API format
        [key: string]: string
    }
    droppedBy?: DroppedByInfo[]
    changelog?: ItemChangelog[] // Added for tracking changes to the item over time
    // New fields from API
    emblem?: string  // Changed to string - Equal to the emblem type used in game (e.g. "diamond_6")
    elements?: string[]  // Array of the elements the item affects
}

export interface WeaponItem extends ItemBase<'weapon'> {
    // subType is now used from ItemBase (was weaponType)
    attackSpeed: string;
    averageDps: number;
}

export interface AccessoryItem extends ItemBase<'accessory'> {
    // subType is now used from ItemBase (was accessoryType)
}

export interface ArmourItem extends ItemBase<'armour'> {
    armourMaterial: string;
    // subType is now used from ItemBase (was armourType)
}

export interface ToolItem extends ItemBase<'tool'> {
    identified: true;
    gatheringSpeed: number;
}

export interface IngredientItem extends Omit<ItemBase<'ingredient'>, 'tier'> {
    tier: TierEnum;  // Ingredient tier (TIER_0, TIER_1, TIER_2, TIER_3) - different from combat item tier
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

export interface MaterialItem extends Omit<ItemBase<'material'>, 'tier'> {
    identified: true;
    tier: TierEnum;  // Material tier (TIER_0, TIER_1, TIER_2, TIER_3) - different from combat item tier
    // removed: craftable - use chances field instead
    chances: {  // Added: dict containing each material tier and the % of drop chance
        TIER_0?: number;
        TIER_1?: number;
        TIER_2?: number;
        TIER_3?: number;
    };
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
