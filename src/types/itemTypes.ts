
export type Rarity = 'common' | 'set' | 'unique' | 'rare' | 'legendary' | 'fabled' | 'mythic';
export interface ItemBase {
    internalName: string
    type: string
    rarity: Rarity
    attackSpeed?: string // for weapons
    subType?: string
    accessoryType?: string
    icon: {
        value: { id: string; name: string; customModelData: string } | string
        format: string
    }
    identified?: boolean
    allow_craftsman?: boolean
    powderSlots?: number
    lore?: string
    dropRestriction?: string
    restriction?: string
    raidReward?: boolean
    dropMeta?: {
        coordinates: [number, number, number]
        name: string
        type: string
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
}

export interface WeaponItem extends ItemBase {
    attackSpeed: string
    averageDPS: number
}

export interface ArmourItem extends ItemBase {
    armourMaterial: string
}

export interface ToolItem extends ItemBase {
    gatheringSpeed: number
}

export interface IngredientItem extends ItemBase {
    tier: string
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
}

export interface MaterialItem extends ItemBase {
    tier: string
    craftable: string[]
}

export type Item = WeaponItem | ArmourItem | ToolItem | IngredientItem | MaterialItem

export interface ItemDisplayProps {
    item: Item
}