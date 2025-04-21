"use client";

import React from 'react';
import { getRarityColor } from '@/utils/utils';

interface ItemHeaderProps {
  name: string;
  rarity: string;
  shinyStat?: {
    displayName: string;
    value: number;
  };
}

const ItemHeader: React.FC<ItemHeaderProps> = ({ name, rarity, shinyStat }) => {
  const rarityColor = getRarityColor(rarity);
  
  return (
    <div className="mb-2">
      <div className="flex items-center">
        {shinyStat && (
          <span className="text-yellow-300 mr-2">✦</span>
        )}
        <h2 
          className="text-xl font-bold tracking-wide"
          style={{ color: rarityColor }}
        >
          {name} {rarity === "mythic" && "[5]"}
        </h2>
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