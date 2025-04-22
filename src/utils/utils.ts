import { RARITY_COLORS } from "./types";

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatAttackSpeed(speed: string): string {
  return speed.split('_').map(capitalize).join(' ');
}

export function calculateRollPercentage(value: number, min: number, max: number, raw: number): number {
  // First calculate the actual value from the input percentage
  const actualValue = Math.ceil((value / 100) * raw);
  
  // Then calculate the roll percentage based on min value and raw value
  return ((actualValue - min) / raw) * 100;
}

export function getStarsFromRollPercentage(percentage: number): number {
  if (percentage >= 100) return 3;
  if (percentage >= 94) return 2;
  if (percentage >= 71) return 1;
  return 0;
}

export function getColorFromRollPercentage(percentage: number): string {
  if (percentage >= 100) return '#00FF00'; // 3 stars - bright green
  if (percentage >= 94) return '#AAFF00';  // 2 stars - yellow-green
  if (percentage >= 71) return '#FFFF00';  // 1 star - yellow
  if (percentage >= 50) return '#FFAA00';  // orange
  return '#FF5555';                        // red
}

export function calculateIdentificationRoll(
  key: string,
  original: { min: number; max: number; raw: number },
  inputValue: number
): {
  roll: number;
  stars: number;
  color: string;
  formattedPercentage: string;
  displayValue: number;
} {
  let { min, max, raw } = original;

  // Invert values if key includes "cost"
  if (key.toLowerCase().includes("cost")) {
    min = -min;
    max = -max;
    raw = -raw;
  }

  let actualValue: number;
  let displayValue: number;
  let rollPercentage: number;

  if (raw >= 0) {
    // Normal (positive) ID
    actualValue = Math.round((inputValue / 100) * raw);
    rollPercentage = ((actualValue - min) / raw) * 100;
  } else {
    // Negative ID
    actualValue = Math.floor(((inputValue - 70) / 100) * raw + max);
    rollPercentage = (1 - (max - actualValue) / (max - min)) * 100;
  }

  if (key.toLowerCase().includes("cost")) {
    actualValue = -actualValue
  }

  displayValue=actualValue

  const stars = getStarsFromRollPercentage(rollPercentage);
  const color = getColorFromRollPercentage(rollPercentage);

  return {
    roll: rollPercentage,
    stars,
    color,
    formattedPercentage: `${rollPercentage.toFixed(5)}%`,
    displayValue
  };
}

export function getRarityColor(rarity: keyof typeof RARITY_COLORS): string {
  return RARITY_COLORS[rarity] || RARITY_COLORS.normal;
}

export function calculateDamageRange(baseDamage: { min: number; max: number }, powders: any[]): {
  min: number;
  max: number;
} {
  let minDamage = baseDamage.min;
  let maxDamage = baseDamage.max;
  
  if (powders && powders.length > 0) {
    const powderBonus = powders.length * 5;
    minDamage = Math.floor(minDamage * (1 + powderBonus / 100));
    maxDamage = Math.floor(maxDamage * (1 + powderBonus / 100));
  }
  
  return { min: minDamage, max: maxDamage };
}

export function formatIdentificationName(key: string): string {
  const nameMap: { [key: string]: string } = {
    walkSpeed: "Walk Speed",
    mainAttackDamage: "Main Attack Damage",
    healthRegen: "Health Regen",
    rawStrength: "Strength",
    rawDexterity: "Dexterity",
    rawAgility: "Agility",
  };
  
  return nameMap[key] || key.replace(/([A-Z])/g, ' $1').trim();
}