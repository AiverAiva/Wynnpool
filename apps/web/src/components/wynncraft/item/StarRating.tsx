"use client";

import React from 'react';

interface StarRatingProps {
  starAmount: number;
}

const StarRating: React.FC<StarRatingProps> = ({ starAmount }) => {
  return (
    <span className="inline-flex items-center">
      {Array.from({ length: starAmount }).map((_, i) => (
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