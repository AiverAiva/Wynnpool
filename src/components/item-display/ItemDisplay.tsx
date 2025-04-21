"use client";

import React from 'react';
import { ItemData } from '@/utils/types';
import { calculateIdentificationRoll } from '@/utils/utils';
import ItemHeader from './ItemHeader';
import AttackSpeed from './AttackSpeed';
import DamageDisplay from './DamageDisplay';
import Requirements from './Requirements';
import BaseStats from './BaseStats';
import IdentificationStats from './IdentificationStats';
import MajorIds from './MajorIds';
import PowderSlots from './PowderSlots';

interface ItemDisplayProps {
  data: ItemData;
}

export interface IdentificationStat {
  name: string;
  value: number;
  percentage: string;
  color: string;
  stars: number;
  displayValue: number;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ data }) => {
  const { original, input, weights } = data;
  
  // Process identifications
  const processedIdentifications = Object.entries(input.identifications)
    .filter(([key]) => original.identifications[key])
    .map(([key, value]) => {
      const originalStat = original.identifications[key];
      
      if (!originalStat || typeof originalStat !== 'object') return null;
      
      const { roll, stars, color, formattedPercentage, displayValue } = calculateIdentificationRoll(
        originalStat,
        value
      );
      
      return {
        name: key,
        value,
        percentage: formattedPercentage,
        color,
        stars,
        displayValue
      };
    })
    .filter((item): item is IdentificationStat => item !== null);
  
  // Determine if the item has a "shiny" stat
  const shinyStat = input.shinyStat ? {
    displayName: input.shinyStat.displayName,
    value: input.shinyStat.value,
  } : undefined;
  
  return (
    <div className="max-w-md p-5 bg-gray-900 border-2 border-gray-800 rounded-md shadow-lg font-mono text-sm">
      <ItemHeader 
        name={original.id || input.itemName} 
        rarity={original.rarity}
        shinyStat={shinyStat}
      />
      
      <AttackSpeed speed={original.attackSpeed} />
      
      <DamageDisplay 
        baseDamage={original.base.baseDamage}
        baseAirDamage={original.base.baseAirDamage}
        dps={original.averageDps}
        powders={input.powders || []}
      />
      
      <MajorIds majorIds={original.majorIds} />
      
      <Requirements 
        level={original.requirements.level}
        classRequirement={original.requirements.classRequirement}
        agility={original.requirements.agility}
      />
      
      <BaseStats 
        strength={original.identifications.rawStrength}
        dexterity={original.identifications.rawDexterity}
        agility={original.identifications.rawAgility}
      />
      
      <IdentificationStats stats={processedIdentifications} />
      
      <PowderSlots 
        total={original.powderSlots}
        powders={input.powders || []}
      />
    </div>
  );
};

export default ItemDisplay;