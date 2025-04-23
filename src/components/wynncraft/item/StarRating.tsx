"use client";

import { getStarsFromRollPercentage } from '@/lib/itemUtils';
import React from 'react';

interface StarRatingProps {
  percentage: number;
}

const StarRating: React.FC<StarRatingProps> = ({ percentage }) => {
  return (
    <span className="inline-flex items-center">
      {Array.from({ length: getStarsFromRollPercentage(percentage) }).map((_, i) => (
        <span
          key={i}
          className="text-xs"
        >
          *
        </span>
      ))}
    </span>
  );
};

export { StarRating };