"use client";

import React from 'react';

interface ItemHeaderProps {
  name: string;
  rarity: string;
  shinyStat?: {
    displayName: string;
    value: number;
  };
}

const ItemHeader: React.FC<ItemHeaderProps> = ({ name, rarity, shinyStat }) => {
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