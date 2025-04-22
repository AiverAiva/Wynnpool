"use client";

import React from 'react';
import StarRating from './StarRating';
import { getFormattedIdNumber, getIdentificationColor, getIdentificationInfo, getRollPercentageColor, getRollPercentageString } from '@/lib/itemUtils';

interface IdentificationStat {
  name: string;
  value: number;
  percentage: number;
  stars: number;
  displayValue: number;
}

interface IdentificationStatsProps {
  stats: IdentificationStat[];
}

const IdentificationStats: React.FC<IdentificationStatsProps> = ({ stats }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="mb-3">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center">
          <span className={getIdentificationColor(stat.displayValue)}>
            {getFormattedIdNumber(stat.displayValue)}{getIdentificationInfo(stat.name)?.unit}<StarRating stars={stat.stars} />
          </span>
          <span className="text-gray-400 ml-1">
            {getIdentificationInfo(stat.name)?.displayName}
          </span>
          <span className={`ml-1 ${getRollPercentageColor(stat.percentage)}`}>
            [{getRollPercentageString(stat.percentage)}]
          </span>
        </div>
      ))}
    </div>
  );
};

export default IdentificationStats;