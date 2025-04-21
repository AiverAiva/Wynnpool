"use client";

import React from 'react';
import { getRarityColor } from '@/utils/utils';

interface MajorIdsProps {
  majorIds: {
    [key: string]: string;
  };
}

const MajorIds: React.FC<MajorIdsProps> = ({ majorIds }) => {
  if (!majorIds || Object.keys(majorIds).length === 0) return null;
  
  // For now, we'll just display the first majorId
  // In a real app, you might want to map through all of them
  const majorIdName = Object.keys(majorIds)[0];
  const majorIdContent = Object.values(majorIds)[0];
  
  // Extract description from HTML-like string (simplified)
  const description = majorIdContent.replace(/<[^>]*>/g, '').split(': ')[1];
  
  return (
    <div className="mb-3 text-cyan-400 mt-3">
      <div>+{majorIdName}:</div>
      <div className="text-cyan-600">
        {description}
      </div>
    </div>
  );
};

export default MajorIds;