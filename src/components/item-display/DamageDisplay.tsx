"use client";

import React from 'react';
import { ELEMENT_COLORS } from '@/utils/types';
import { formatNumber } from '@/utils/utils';

interface DamageDisplayProps {
  baseDamage: {
    min: number;
    max: number;
  };
  baseAirDamage: {
    min: number;
    max: number;
  };
  dps: number;
  powders: Array<{
    element: number;
    tier: number;
  }>;
}

const DamageDisplay: React.FC<DamageDisplayProps> = ({ 
  baseDamage, 
  baseAirDamage, 
  dps,
  powders
}) => {
  // Calculate total damage (simplified)
  const minDamage = baseDamage.min;
  const maxDamage = baseDamage.max;
  const airMinDamage = baseAirDamage.min;
  const airMaxDamage = baseAirDamage.max;
  
  const totalMin = minDamage + airMinDamage;
  const totalMax = maxDamage + airMaxDamage;
  
  // Check if there are thunder powders
  const hasThunderPowders = powders.some(p => p.element === 5);
  
  return (
    <div className="mb-3">
      <div className="flex items-center mb-1">
        <span className="text-gray-200 mr-2">⚔</span>
        {hasThunderPowders ? (
          <span className="text-white">
            Air Damage: {formatNumber(totalMin)}-{formatNumber(totalMax)}
          </span>
        ) : (
          <>
            <span className="text-gray-200">
              Damage: {formatNumber(minDamage)}-{formatNumber(maxDamage)}
            </span>
            <span className="mx-1">•</span>
            <span style={{ color: ELEMENT_COLORS[4] /* Air */ }}>
              Air: {formatNumber(airMinDamage)}-{formatNumber(airMaxDamage)}
            </span>
          </>
        )}
      </div>
      <div className="text-gray-300 text-sm">
        Average DPS: {formatNumber(dps)}
      </div>
    </div>
  );
};

export default DamageDisplay;