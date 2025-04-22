"use client";

import React from 'react';
import { ItemData } from '@/utils/types';
import { calculateIdentificationRoll } from '@/utils/utils';
import ItemHeader from './ItemHeader';
import AttackSpeed from '../wynncraft/item/AttackSpeed';
import DamageDisplay from './DamageDisplay';
import Requirements from './Requirements';
import BaseStats from './BaseStats';
import IdentificationStats from './IdentificationStats';
import MajorIds from '../wynncraft/item/MajorIds';
import PowderSlots from './PowderSlots';
import { Identification } from '@/types/itemType';
import { getRollPercentageString, processIdentification } from '@/lib/itemUtils';

interface ItemDisplayProps {
  data: ItemData;
}

export interface IdentificationStat {
  name: string;
  value: number;
  percentage: number;
  stars: number;
  displayValue: number;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ data }) => {
  const { original, input, weights } = data;
  const processedIdentifications = processIdentification(data)

  console.log(original)
  // Determine if the item has a "shiny" stat
  const shinyStat = input.shinyStat ? {
    displayName: input.shinyStat.displayName,
    value: input.shinyStat.value,
  } : undefined;

  function calculateOverallPercentage(ids: IdentificationStat[]): number {
    if (ids.length === 0) return 0;
    const total = ids.reduce((sum, id) => sum + id.percentage, 0);
    return total / ids.length;
  }

  return (
    <div className="max-w-md p-5 bg-gray-900 rounded-md shadow-lg font-mono text-sm">
      <ItemHeader
        name={original.id || input.itemName}
        rarity={original.rarity}
        shinyStat={shinyStat}
        overall={calculateOverallPercentage(processedIdentifications)}
      />

      {/* <AttackSpeed attackSpeed={original.attackSpeed} /> */}

      {/* <DamageDisplay 
        baseDamage={original.base.baseDamage}
        baseAirDamage={original.base.baseAirDamage}
        dps={original.averageDps}
        powders={input.powders || []}
      /> */}

      {/* <MajorIds majorIds={original.majorIds} /> */}

      {/* <Requirements 
        level={original.requirements.level}
        classRequirement={original.requirements.classRequirement}
        agility={original.requirements.agility}
      /> */}

      {/* <BaseStats 
        strength={original.identifications.rawStrength}
        dexterity={original.identifications.rawDexterity}
        agility={original.identifications.rawAgility}
      /> */}

      <IdentificationStats stats={processedIdentifications} />

      {/* <PowderSlots 
        total={original.powderSlots}
        powders={input.powders || []}
      /> */}
    </div>
  );
};

export default ItemDisplay;