"use client";

import { getRollPercentageColor, getRollPercentageString } from '@/lib/itemUtils';
import React from 'react';

interface ItemHeaderProps {
  name: string;
  rarity: string;
  shinyStat?: {
    displayName: string;
    value: number;
  };
  overall?: number;
}

const ItemHeader: React.FC<ItemHeaderProps> = ({ name, rarity, shinyStat, overall }) => {
  return (
    <div className="mb-2">
      <div className="flex items-center">
        {shinyStat && (
          <span className="text-yellow-300 mr-2">✦</span>
        )}
        <h2
          className={`text-${rarity} text-xl font-bold tracking-wide`}
        >
          {name}
        </h2>
        {overall && (
          <h2 className={`ml-1 text-lg font-bold tracking-wide ${getRollPercentageColor(overall)}`}>
            [{getRollPercentageString(overall)}]
          </h2>
        )}
      </div>
      {shinyStat && (
        <div className="text-yellow-300 text-sm mt-1">
          ✦ {shinyStat.displayName}: {shinyStat.value.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default ItemHeader;