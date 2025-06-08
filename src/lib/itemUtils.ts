import { IdentificationStat, ItemAnalyzeData } from "@/components/wynncraft/item/RolledItemDisplay";
import { IdentificationInfo } from "@/types/itemType";

const identificationMap: Record<string, IdentificationInfo> = {
  // Base stats
  "baseHealth": { unit: "", displayName: "Health", symbol: "", detailedName: "Base Health" },
  "baseDamage": { unit: "", displayName: "Neutral Damage", symbol: "", detailedName: "Base Damage" },
  "baseEarthDamage": { unit: "", displayName: "Earth Damage", symbol: "", detailedName: "Base Earth Damage" },
  "baseEarthDefence": { unit: "", displayName: "Earth Defence", symbol: "", detailedName: "Base Earth Defence" },
  "baseThunderDamage": { unit: "", displayName: "Thunder Damage", symbol: "", detailedName: "Base Thunder Damage" },
  "baseThunderDefence": { unit: "", displayName: "Thunder Defence", symbol: "", detailedName: "Base Thunder Defence" },
  "baseWaterDamage": { unit: "", displayName: "Water Damage", symbol: "", detailedName: "Base Water Damage" },
  "baseWaterDefence": { unit: "", displayName: "Water Defence", symbol: "", detailedName: "Base Water Defence" },
  "baseFireDamage": { unit: "", displayName: "Fire Damage", symbol: "", detailedName: "Base Fire Damage" },
  "baseFireDefence": { unit: "", displayName: "Fire Defence", symbol: "", detailedName: "Base Fire Defence" },
  "baseAirDamage": { unit: "", displayName: "Air Damage", symbol: "", detailedName: "Base Air Damage" },
  "baseAirDefence": { unit: "", displayName: "Air Defence", symbol: "", detailedName: "Base Air Defence" },

  // Required Stats
  "strength": { unit: "", displayName: "Strength Min", detailedName: "Required Strength" },
  "dexterity": { unit: "", displayName: "Dexterity Min", detailedName: "Required Dexterity" },
  "intelligence": { unit: "", displayName: "Intelligence Min", detailedName: "Required Intelligence" },
  "defence": { unit: "", displayName: "Defence Min", detailedName: "Required Defence" },
  "agility": { unit: "", displayName: "Agility Min", detailedName: "Required Agility" },
  "level": { displayName: "Combat Level", detailedName: "Required Combat Level" },
  "classRequirement": { displayName: "Class Req", detailedName: "Required Class" },
  "quest": { displayName: "Quest Req", detailedName: "Required Quest" },

  // Main Attack Stats
  "mainAttackDamage": { unit: "%", displayName: "Main Attack Damage", detailedName: "Main Attack Damage %" },
  "mainAttackElementalDamage": { unit: "%", displayName: "Main Attack Elemental Damage", detailedName: "Main Attack Elemental Damage %" },
  "mainAttackNeutraDamageBonus": { unit: "%", displayName: "Main Attack Neutral Damage Bonus", detailedName: "Main Attack Neutral Damage Bonus %" },
  
  "elementalMainAttackDamage": { unit: "%", displayName: "Elemental Main Attack Damage", detailedName: "Elemental Main Attack Damage %" },
  "neutralMainAttackDamage": { unit: "%", displayName: "Neutral Main Attack Damage", detailedName: "Neutral Main Attack Damage %" },
  "earthMainAttackDamage": { unit: "%", displayName: "Earth Main Attack Damage", detailedName: "Earth Main Attack Damage %" },
  "thunderMainAttackDamage": { unit: "%", displayName: "Thunder Main Attack Damage", detailedName: "Thunder Main Attack Damage %" },
  "waterMainAttackDamage": { unit: "%", displayName: "Water Main Attack Damage", detailedName: "Water Main Attack Damage %" },
  "fireMainAttackDamage": { unit: "%", displayName: "Fire Main Attack Damage", detailedName: "Fire Main Attack Damage %" },
  "airMainAttackDamage": { unit: "%", displayName: "Air Main Attack Damage", detailedName: "Air Main Attack Damage %" },

  //raw
  "rawMainAttackDamage": { unit: "", displayName: "Main Attack Damage", detailedName: "Raw Main Attack Damage" },
  "rawElementalMainAttackDamage": { unit: "", displayName: "Elemental Main Attack Damage", detailedName: "Raw Elemental Main Attack Damage" },
  "rawNeutralMainAttackDamage": { unit: "", displayName: "Neutral Main Attack Damage", detailedName: "Raw Neutral Main Attack Damage" },
  "rawEarthMainAttackDamage": { unit: "", displayName: "Earth Main Attack Damage", detailedName: "Raw Earth Main Attack Damage" },
  "rawThunderMainAttackDamage": { unit: "", displayName: "Thunder Main Attack Damage", detailedName: "Raw Thunder Main Attack Damage" },
  "rawWaterMainAttackDamage": { unit: "", displayName: "Water Main Attack Damage", detailedName: "Raw Water Main Attack Damage" },
  "rawFireMainAttackDamage": { unit: "", displayName: "Fire Main Attack Damage", detailedName: "Raw Fire Main Attack Damage" },
  "rawAirMainAttackDamage": { unit: "", displayName: "Air Main Attack Damage", detailedName: "Raw Air Main Attack Damage" },
  // Additional Stats
  
  
  "damage": { unit: "%", displayName: "Damage", detailedName: "Damage %" },
  "neutralDamage": { unit: "%", displayName: "Neutral Damage", detailedName: "Neutral Damage %" },
  "spellDamage": { unit: "%", displayName: "Spell Damage", detailedName: "Spell Damage %" },
  "elementalDamage": { unit: "%", displayName: "Elemental Damage", detailedName: "Elemental Damage %" },
  "criticalDamageBonus": { unit: "%", displayName: "Critical Damage Bonus", detailedName: "Critical Damage Bonus %" },
  
  "earthDamage": { unit: "%", displayName: "Earth Damage", detailedName: "Earth Damage %" },
  "thunderDamage": { unit: "%", displayName: "Thunder Damage", detailedName: "Thunder Damage %" },
  "waterDamage": { unit: "%", displayName: "Water Damage", detailedName: "Water Damage %" },
  "fireDamage": { unit: "%", displayName: "Fire Damage", detailedName: "Fire Damage %" },
  "airDamage": { unit: "%", displayName: "Air Damage", detailedName: "Air Damage %" },
  
  "rawDamage": { unit: "", displayName: "Damage" },
  "rawNeutralDamage": { unit: "", displayName: "Neutral Damage" },
  "rawSpellDamage": { unit: "", displayName: "Spell Damage", detailedName: "Raw Spell Damage" },
  "rawElementalDamage": { unit: "", displayName: "Elemental Damage" },
  "rawEarthDamage": { unit: "", displayName: "Earth Damage" },
  "rawThunderDamage": { unit: "", displayName: "Thunder Damage" },
  "rawWaterDamage": { unit: "", displayName: "Water Damage" },
  "rawFireDamage": { unit: "", displayName: "Fire Damage" },
  "rawAirDamage": { unit: "", displayName: "Air Damage" },
  
  "elementalSpellDamage": { unit: "%", displayName: "Elemental Spell Damage", detailedName: "Elemental Spell Damage %" },
  "neutralSpellDamage": { unit: "%", displayName: "Neutral Spell Damage", detailedName: "Neutral Spell Damage %" },
  "earthSpellDamage": { unit: "%", displayName: "Earth Spell Damage", detailedName: "Earth Spell Damage %" },
  "thunderSpellDamage": { unit: "%", displayName: "Thunder Spell Damage", detailedName: "Thunder Spell Damage %" },
  "waterSpellDamage": { unit: "%", displayName: "Water Spell Damage", detailedName: "Water Spell Damage %" },
  "fireSpellDamage": { unit: "%", displayName: "Fire Spell Damage", detailedName: "Fire Spell Damage %" },
  "airSpellDamage": { unit: "%", displayName: "Air Spell Damage", detailedName: "Air Spell Damage %" },
  
  
  "rawElementalSpellDamage": { unit: "", displayName: "Elemental Spell Damage", detailedName: "Raw Elemental Spell Damage" },
  "rawEarthSpellDamage": { unit: "", displayName: "Earth Spell Damage", detailedName: "Raw Earth Spell Damage" },
  "rawNeutralSpellDamage": { unit: "", displayName: "Neutral Spell Damage", detailedName: "Raw Neutral Spell Damage" },
  "rawThunderSpellDamage": { unit: "", displayName: "Thunder Spell Damage", detailedName: "Raw Thunder Spell Damage" },
  "rawWaterSpellDamage": { unit: "", displayName: "Water Spell Damage", detailedName: "Raw Water Spell Damage" },
  "rawFireSpellDamage": { unit: "", displayName: "Fire Spell Damage", detailedName: "Raw Fire Spell Damage" },
  "rawAirSpellDamage": { unit: "", displayName: "Air Spell Damage", detailedName: "Raw Air Spell Damage" },
  
  
  //survivability
  "rawHealth": { unit: "", displayName: "Health Bonus" },
  "healthRegenRaw": { unit: "", displayName: "Health Regen Raw" },
  "healthRegen": { unit: "%", displayName: "Health Regen" }, //, detailedName: "Health Regeneration Rate"
  "thorns": { unit: "%", displayName: "Thorns" }, //, detailedName: "Thorns Damage Reflection"
  
  "elementalDefence": { unit: "%", displayName: "Elemental Defence", detailedName: "Elemental Defence %" },
  "earthDefence": { unit: "%", displayName: "Earth Defence", detailedName: "Earth Defence %" },
  "thunderDefence": { unit: "%", displayName: "Thunder Defence", detailedName: "Thunder Defence %" },
  "waterDefence": { unit: "%", displayName: "Water Defence", detailedName: "Water Defence %" },
  "fireDefence": { unit: "%", displayName: "Fire Defence", detailedName: "Fire Defence %" },
  "airDefence": { unit: "%", displayName: "Air Defence", detailedName: "Air Defence %" },
  
  //skill points
  "rawStrength": { unit: "", displayName: "Strength" },
  "rawDexterity": { unit: "", displayName: "Dexterity" },
  "rawIntelligence": { unit: "", displayName: "Intelligence" },
  "rawDefence": { unit: "", displayName: "Defence" },
  "rawAgility": { unit: "", displayName: "Agility" },

  //utility
  "manaRegen": { unit: "/5s", displayName: "Mana Regen" },
  "manaSteal": { unit: "/3s", displayName: "Mana Steal" },
  "walkSpeed": { unit: "%", displayName: "Walk Speed" }, //, detailedName: "Movement Speed %"
  "xpBonus": { unit: "%", displayName: "Xp Bonus" },
  "exploding": { unit: "%", displayName: "Exploding" }, //, detailedName: "Explosion Chance on Kill"
  "lifeSteal": { unit: "/3s", displayName: "Life Steal" }, //, detailedName: "Life Steal Per Hit"
  "reflection": { unit: "%", displayName: "Reflection" },
  "lootBonus": { unit: "%", displayName: "Loot Bonus" },
  "poison": { unit: "/3s", displayName: "Poison" }, //, detailedName: "Poison Damage Over Time"
  "healingEfficiency": { unit: "%", displayName: "Healing Efficiency" },
  "stealing": { unit: "%", displayName: "Stealing" }, //, detailedName: "Chance to Steal Emeralds"
  "jumpHeight": { unit: "", displayName: "Jump Height" }, //, detailedName: "Additional Jump Height"
  "knockback": { unit: "%", displayName: "Knockback" },
  "slowEnemy": { unit: "%", displayName: "Slow Enemy" },
  "weakenEnemy": { unit: "%", displayName: "Weaken Enemy" },
  "leveledXpBonus": { unit: "", displayName: "Leveled XP Bonus" },
  "damageFromMobs": { unit: "", displayName: "Damage From Mobs" },
  "leveledLootBonus": { unit: "", displayName: "Leveled Loot Bonus" },
  "gatherXpBonus": { unit: "%", displayName: "Gather XP Bonus" },
  "gatherSpeed": { unit: "%", displayName: "Gather Speed" },
  "lootQuality": { unit: "%", displayName: "Loot Quality" },
  "rawMaxMana": { unit: "", displayName: "Max Mana" }, //, detailedName: "Additional Max Mana"

  "sprintRegen": { unit: "%", displayName: "Sprint Regen" },
  "sprint": { unit: "%", displayName: "Sprint" }, //, detailedName: "Sprint Speed Increase"


  "mainAttackRange": { unit: "%", displayName: "Main Attack Range" },
  "rawAttackSpeed": { unit: "", displayName: "Attack Speed" },


  //spellcost
  "1stSpellCost": { unit: "%", displayName: "1st Spell Cost", detailedName: "1st Spell Cost %" },
  "2ndSpellCost": { unit: "%", displayName: "2nd Spell Cost", detailedName: "2nd Spell Cost %" },
  "3rdSpellCost": { unit: "%", displayName: "3rd Spell Cost", detailedName: "3rd Spell Cost %" },
  "4thSpellCost": { unit: "%", displayName: "4th Spell Cost", detailedName: "4th Spell Cost %" },
  "raw1stSpellCost": { unit: "", displayName: "1st Spell Cost", detailedName: "Raw 1st Spell Cost" },
  "raw2ndSpellCost": { unit: "", displayName: "2nd Spell Cost", detailedName: "Raw 2nd Spell Cost" },
  "raw3rdSpellCost": { unit: "", displayName: "3rd Spell Cost", detailedName: "Raw 3rd Spell Cost" },
  "raw4thSpellCost": { unit: "", displayName: "4th Spell Cost", detailedName: "Raw 4th spell cost" },

  // Ingredient effectiveness
  "left": { unit: "%", displayName: "To ingredients to the left of this one" },
  "right": { unit: "%", displayName: "To ingredients to the right of this one" },
  "above": { unit: "%", displayName: "To ingredients above this one" },
  "under": { unit: "%", displayName: "To ingredients under this one" },
  "touching": { unit: "%", displayName: "To ingredients touching this one" },
  "notTouching": { unit: "%", displayName: "To ingredients not touching this one" },
};

export function getIdentificationInfo(identification: string): IdentificationInfo | undefined {
  return identificationMap[identification];
}

export function getIdentificationCost(rarity: string, level: number): number {
  switch (rarity) {
    case 'mythic':
      return Math.floor(90 + level * 18);
    case 'fabled':
      return Math.floor(16 + level * 8);
    case 'legendary':
      return Math.floor(12 + level * 4.5);
    case 'rare':
      return Math.floor(8 + level * 1.2);
    case 'unique':
      return Math.floor(3 + level * 0.5);
    case 'set':
      return Math.floor(8 + level * 1.5);
    default:
      return 0;
  }
}

export function formattedAttackSpeed(attackSpeed: string) {
  return `${attackSpeed
    .replace("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")} Attack Speed`
}

// Get color based on roll percentage
// export const getRollPercentageColor = (percentage: number, inverted = false) => {
//   if (inverted) percentage = 100 - percentage
//   if (percentage >= 95) return "text-cyan-500"
//   if (percentage >= 80) return "text-green-500"
//   if (percentage >= 60) return "text-yellow-300"
//   if (percentage >= 40) return "text-amber-400"
//   if (percentage >= 20) return "text-orange-500"
//   return "text-red-500"
// }
// ^wynntils color^ //
export const getRollPercentageColor = (percentage: number, inverted = false) => {
  if (inverted) percentage = 100 - percentage
  if (percentage >= 95) return "text-cyan-500"
  if (percentage >= 80) return "text-green-500"
  if (percentage >= 30) return "text-yellow-300"
  return "text-red-500"
}
// ^legacy color^ //

export const getRollPercentageString = (percentage: number) => {
  const truncated = Math.trunc(percentage * 100) / 100;
  return `${truncated.toFixed(2)}%`;
};

export function getIdentificationColor(number: number, key?: string) {
  if (key?.toLowerCase().includes('cost')) number = -number
  if (number > 0) return 'text-green-500'
  if (number < 0) return 'text-red-500'
}

export function getFormattedIdNumber(number: number) {
  if (number > 0) return '+' + number
  if (number < 0) return number
}

export function getStarsFromRollValue(value: number, negative: boolean): number {
  if (negative) {
    if (value <= 70) return 3;
    if (value <= 73) return 2;
    if (value <= 88) return 1;
  } else {
    if (value >= 130) return 3;
    if (value >= 125) return 2;
    if (value >= 101) return 1;
  }
  return 0;
}

export function calculateIdentificationRoll(
  key: string,
  original: { min: number; max: number; raw: number },
  inputValue: number
): {
  roll: number;
  stars: number;
  formattedPercentage: number;
  displayValue: number;
} {
  let { min, max, raw } = original;
  const isCost = key.toLowerCase().includes("cost")
  // Invert values if key includes "cost"
  if (isCost) {
    min = -min;
    max = -max;
    raw = -raw;
  }

  let actualValue: number;
  let displayValue: number;
  let rollPercentage: number;

  //breeze emotional support because
  //they spent all time coming up with it
  let breeze: number;
  breeze = 0.000001
  breeze += breeze

  if (raw >= 0) {
    // Normal (positive) ID
    if (isCost) {
      actualValue = -1 * Math.round(-1 * (inputValue * raw) / 100);
    } else {
      actualValue = Math.round((inputValue * raw) / 100);
    }
    // actualValue = (inputValue * raw) / 100
    rollPercentage = ((actualValue - min) / raw) * 100;

  } else {
    // Negative ID

    if (isCost) {
      // round magnitude, then re-apply negative sign
      const absRaw = Math.abs(raw);
      const magnitude = Math.round((inputValue * absRaw) / 100);
      actualValue = -magnitude;
    } else {
      actualValue = Math.round((inputValue * raw) / 100)
    }
    // actualValue = (inputValue * raw) / 100
    rollPercentage = (1 - (max - actualValue) / (max - min)) * 100;
  }

  if (isCost) {
    actualValue = -actualValue
  }

  displayValue = actualValue

  const stars = getStarsFromRollValue(inputValue, raw <= 0);
  return {
    roll: rollPercentage,
    stars,
    formattedPercentage: rollPercentage,
    displayValue
  };
}

export function processIdentification(data: ItemAnalyzeData) {
  const { original, input, weights } = data;

  if (!original?.identifications || !input?.identifications) return [];

  return Object.entries(input.identifications)
    .filter(([key]) => original.identifications && key in original.identifications)
    .map(([key, value]) => {
      const originalStat = original.identifications?.[key];
      if (!originalStat || typeof originalStat !== 'object') return null;

      const { roll, stars, formattedPercentage, displayValue } = calculateIdentificationRoll(
        key,
        originalStat,
        value
      );

      return {
        name: key,
        value,
        stars,
        percentage: formattedPercentage,
        displayValue
      };
    })
    .filter((item): item is IdentificationStat => item !== null);
}

export function isCost(key: string): Boolean {
  return key.toLowerCase().includes("cost");
}