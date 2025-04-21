"use client";

import React from 'react';

interface RequirementsProps {
  level: number;
  classRequirement: string;
  agility: number;
}

const Requirements: React.FC<RequirementsProps> = ({ 
  level, 
  classRequirement, 
  agility 
}) => {
  return (
    <div className="mb-3 text-red-400">
      <div>❌ Class Req: {classRequirement.charAt(0).toUpperCase() + classRequirement.slice(1)}</div>
      <div>❌ Combat Lv. Min: {level}</div>
      <div>❌ Agility Min: {agility}</div>
    </div>
  );
};

export default Requirements;