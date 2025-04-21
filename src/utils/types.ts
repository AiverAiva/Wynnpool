export interface ItemBase {
  min: number;
  raw: number;
  max: number;
}

export interface ItemRequirements {
  level: number;
  classRequirement: string;
  agility: number;
}

export interface ItemIcon {
  format: string;
  value: {
    id: string;
    customModelData?: string;
    name: string;
  };
}

export interface ItemIdentifications {
  rawStrength?: number;
  rawDexterity?: number;
  rawAgility?: number;
  mainAttackDamage?: ItemBase;
  healthRegen?: ItemBase;
  walkSpeed?: ItemBase;
  [key: string]: any;
}

export interface ItemBase {
  min: number;
  raw: number;
  max: number;
}

export interface ItemDamageBase {
  baseDamage: ItemBase;
  baseAirDamage: ItemBase;
}

export interface Original {
  id: string;
  internalName: string;
  type: string;
  weaponType: string;
  attackSpeed: string;
  averageDps: number;
  dropRestriction: string;
  requirements: ItemRequirements;
  majorIds: {
    [key: string]: string;
  };
  powderSlots: number;
  lore: string;
  icon: ItemIcon;
  identifications: ItemIdentifications;
  base: ItemDamageBase;
  rarity: string;
  changelog?: any;
}

export interface Powder {
  element: number;
  tier: number;
}

export interface ShinyStatType {
  key: string;
  displayName: string;
  value: number;
}

export interface Input {
  itemName: string;
  identifications: {
    [key: string]: number;
  };
  powderSlots: number;
  powders: Powder[];
  shinyStat?: ShinyStatType;
}

export interface Weight {
  _id: string;
  item_name: string;
  item_id: string;
  weight_name: string;
  weight_id: string;
  type: string;
  author: string;
  timestamp: number;
  identifications: {
    [key: string]: number;
  };
  userId: string;
  description: string;
}

export interface ItemData {
  original: Original;
  input: Input;
  weights: Weight[];
}

export const ELEMENT_COLORS = {
  1: "#F82423", // Fire (red)
  2: "#00A0FF", // Water (blue)
  3: "#B2FF00", // Earth (green)
  4: "#FFFF00", // Air (yellow)
  5: "#FFFFFF", // Thunder (white)
  6: "#8B00FF", // Darkness (purple)
  7: "#FFA500", // Light (orange/gold)
};

export const RARITY_COLORS = {
  normal: "#FFFFFF",
  unique: "#FFFF55",
  rare: "#55FFFF",
  legendary: "#AA00AA",
  fabled: "#FF55FF",
  mythic: "#AA00FF",
  set: "#55FF55",
  crafted: "#A0A0A0",
};

export const ATTACK_SPEED_NAMES: { [key: string]: string } = {
  super_slow: "Super Slow Attack Speed",
  very_slow: "Very Slow Attack Speed",
  slow: "Slow Attack Speed",
  normal: "Normal Attack Speed",
  fast: "Fast Attack Speed",
  very_fast: "Very Fast Attack Speed",
  super_fast: "Super Fast Attack Speed",
};