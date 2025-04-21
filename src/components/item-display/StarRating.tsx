"use client";

import React from 'react';

interface StarRatingProps {
  stars: number;
  color: string;
}

const StarRating: React.FC<StarRatingProps> = ({ stars, color }) => {
  return (
    <span className="inline-flex items-center ml-1">
      {Array.from({ length: stars }).map((_, i) => (
        <span 
          key={i} 
          className="text-xs"
          style={{ color }}
        >
          ★
        </span>
      ))}
    </span>
  );
};

export default StarRating;