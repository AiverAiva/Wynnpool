"use client";

import React from 'react';

interface BaseStatsProps {
  strength?: number;
  dexterity?: number;
  agility?: number;
}

const BaseStats: React.FC<BaseStatsProps> = ({ 
  strength, 
  dexterity, 
  agility 
}) => {
  return (
    <div className="mb-3">
      {strength !== undefined && (
        <div className="text-green-400">+{strength} Strength</div>
      )}
      {dexterity !== undefined && (
        <div className="text-green-400">+{dexterity} Dexterity</div>
      )}
      {agility !== undefined && (
        <div className="text-green-400">+{agility} Agility</div>
      )}
    </div>
  );
};

export default BaseStats;