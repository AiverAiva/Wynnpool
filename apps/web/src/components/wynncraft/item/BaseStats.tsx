"use client";

import { getFormattedIdNumber, getIdentificationInfo } from '@/lib/itemUtils';
import { cn } from '@/lib/utils';
import { colorMap, textMap } from '@/map/itemMap';
import type { IdentificationsObject, IdentificationValue } from '@wynnpool/shared';
import '@/assets/css/wynncraft.css'
import React from 'react'; 
 
const BaseStats: React.FC<IdentificationsObject> = (base) => {
  return (
    <ul className="list-disc list-inside text-sm">
      {Object.entries(base).map(([name, value]) => (
        <BaseStatsFormatter value={value} name={name} key={name} />
      ))}
    </ul>
  );
};

interface BaseStatsFormatterProps {
  name: string;
  value: number | IdentificationValue;
}

const BaseStatsFormatter: React.FC<BaseStatsFormatterProps> = ({ name, value }) => {
  const matchedKey = Object.keys(colorMap).find((key) => name.includes(key));
  const color = matchedKey ? colorMap[matchedKey] : '';
  const text = matchedKey ? <span className={color}>{textMap[matchedKey]}&ensp;</span> : null;
  // …
  const type = name.includes('Damage')
    ? 'Damage'
    : name.includes('Defence')
      ? 'Defence'
      : null;

  return (
    <div className="flex items-center h-5">
      <div>
        <span className={cn('font-common text-lg h-4 -mt-3', color)}>
          {getIdentificationInfo(name)?.symbol}
        </span>
        <span className={getIdentificationInfo(name)?.symbol && 'ml-2'}>
          {text}
          {type}
        </span>
      </div>
      <span className={cn("h-4", type && 'ml-1')}>
        {typeof value === 'number' ? (
          <>{getFormattedIdNumber(value)}</>
        ) : (
          <>{value.min}-{value.max}</>
        )}
      </span>
    </div>
  );
};

export default BaseStats;