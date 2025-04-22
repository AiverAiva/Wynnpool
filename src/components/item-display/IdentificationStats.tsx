"use client";

import React from 'react';
import StarRating from './StarRating';
import { formatIdentificationName } from '@/utils/utils';
import { getIdentificationInfo } from '@/lib/itemUtils';

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
            +{stat.displayValue}{getIdentificationInfo(stat.name)?.unit}<StarRating stars={stat.stars} /> {getIdentificationInfo(stat.name)?.displayName}
          </span>
          <span className="ml-1" style={{ color: stat.color }}>
            [{stat.percentage}]
          </span>

        </div>
      ))}
    </div>
  );
};

export default IdentificationStats;