"use client";

import React from 'react';

interface MajorIdsProps {
  majorIds: {
    [key: string]: string;
  };
}

const MajorIds: React.FC<MajorIdsProps> = ({ majorIds }) => {
  if (!majorIds || Object.keys(majorIds).length === 0) return null;

  return (
    <div className="list-disc list-inside">
      {Object.entries(majorIds).map(([key, value]) => (
        <div className="text-sm" key={key} dangerouslySetInnerHTML={{ __html: value }} />
      ))}
    </div>
  );
};

export default MajorIds;