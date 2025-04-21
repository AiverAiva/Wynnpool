"use client";

import React from 'react';
import StarRating from './StarRating';
import { formatIdentificationName } from '@/utils/utils';

interface IdentificationStat {
  name: string;
  value: number;
  percentage: string;
  color: string;
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
          <span className="text-green-400">
            +{stat.displayValue}% {formatIdentificationName(stat.name)}
          </span>
          <span className="ml-1" style={{ color: stat.color }}>
            [{stat.percentage}]
          </span>
          <StarRating stars={stat.stars} color={stat.color} />
        </div>
      ))}
    </div>
  );
};

export default IdentificationStats;