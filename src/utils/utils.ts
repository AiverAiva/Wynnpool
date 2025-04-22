export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatAttackSpeed(speed: string): string {
  return speed.split('_').map(capitalize).join(' ');
}

export function getStarsFromRollPercentage(percentage: number): number {
  if (percentage >= 100) return 3;
  if (percentage >= 94) return 2;
  if (percentage >= 71) return 1;
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
    actualValue = Math.round(((inputValue - 70) / 100) * raw + max);
    rollPercentage = (1 - (max - actualValue) / (max - min)) * 100;
  }

  if (key.toLowerCase().includes("cost")) {
    actualValue = -actualValue
  }

  displayValue=actualValue

  const stars = getStarsFromRollPercentage(rollPercentage);

  return {
    roll: rollPercentage,
    stars,
    formattedPercentage: rollPercentage,
    displayValue
  };
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
