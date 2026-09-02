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

/**
 * Wynntils PR #4265 (encoding v3) stores the actual identification value.
 * The rest of Wynnpool's scoring pipeline expects an internal roll (≈30–130),
 * where actual ≈ round(roll * raw / 100). Invert that relationship.
 */
export function actualValueToInternalRoll(actual: number, raw: number): number {
  if (raw === 0) return 100;
  return Math.round((Math.abs(actual) * 100) / Math.abs(raw));
}

export function calculateIdentificationRoll(
  key: string,
  original: { min: number; max: number; raw: number },
  inputValue: number
): {
  stars: number;
  percentage: number;
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
    stars,
    percentage: rollPercentage,
    displayValue
  };
}

export function isCost(key: string): Boolean {
  return key.toLowerCase().includes("cost");
}