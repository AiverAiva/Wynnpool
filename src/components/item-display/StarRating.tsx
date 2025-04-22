"use client";

import React from 'react';

interface StarRatingProps {
  stars: number;
}

const StarRating: React.FC<StarRatingProps> = ({ stars }) => {
  return (
    <span className="inline-flex items-center">
      {Array.from({ length: stars }).map((_, i) => (
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

export default StarRating;