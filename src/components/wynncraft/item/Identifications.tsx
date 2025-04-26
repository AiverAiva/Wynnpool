"use client";

import React from 'react';
import { StarRating } from './StarRating';
import { getFormattedIdNumber, getIdentificationColor, getIdentificationInfo, getRollPercentageColor, getRollPercentageString } from '@/lib/itemUtils';
import { cn } from '@/lib/utils';
import { IdentificationsObject, IdentificationValue } from '@/types/itemType';


interface RolledIdentification {
  name: string;
  value: number;
  stars: number;
  percentage: number;
  displayValue: number;
}

interface RolledIdentificationsProps {
  stats: RolledIdentification[];
}

// interface IdentificationsProps {
//   identifications: IdentificationsObject;
// }

const Identifications: React.FC<IdentificationsObject> = (identifications) => {
  return (
    <div className="list-disc list-inside">
      {Object.entries(identifications).map(([key, value]) => (
        <Identification key={key} id={key} value={value} />
      ))}
    </div>
  );
};


interface IdentificationProps {
  id: string
  value: number | IdentificationValue
}

const Identification: React.FC<IdentificationProps> = ({ id, value }) => {
  const displayName = getIdentificationInfo(id)?.displayName ?? id
  const displayUnit = getIdentificationInfo(id)?.unit ?? ''

  return (
    <div className="flex items-center justify-between text-sm">
      {typeof value === 'number' ? (
        <>
          <span style={{ flex: '1', textAlign: 'left' }}></span>
          <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
          <span className={`${getIdentificationColor(value, id)}`} style={{ flex: '1', textAlign: 'right' }}>{value}{displayUnit}</span>
        </>
      ) : (
        <>
          <span className={getIdentificationColor(value.min, id)} style={{ flex: '1', textAlign: 'left' }}>{value.min}{displayUnit}</span>
          <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
          <span className={getIdentificationColor(value.max, id)} style={{ flex: '1', textAlign: 'right' }}>{value.max}{displayUnit}</span>
        </>
      )}
    </div>
  );
}

const RolledIdentifications: React.FC<RolledIdentificationsProps> = ({ stats }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="list-disc list-inside text-sm">
      {stats.map((stat, index) => {
        const colorClass = getRollPercentageColor(stat.percentage);

        return (
          <div key={index} className="flex items-center">
            <span className={getIdentificationColor(stat.displayValue, stat.name)}>
              {getFormattedIdNumber(stat.displayValue)}{getIdentificationInfo(stat.name)?.unit}<StarRating starAmount={stat.stars} />
            </span>
            <span className="text-gray-400 ml-1">
              {getIdentificationInfo(stat.name)?.displayName}
            </span>
            <span className={`ml-1 ${colorClass}`}>
              [{getRollPercentageString(stat.percentage)}]
            </span>
          </div>
        );
      })}
    </div>
  );
};

export { Identifications, RolledIdentifications }