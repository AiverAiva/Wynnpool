"use client";

import React from 'react';

interface AttackSpeedProps {
  attackSpeed: string;
}

const AttackSpeed: React.FC<AttackSpeedProps> = ({ attackSpeed }) => {
  return (
    <div className="flex justify-center items-center text-xs">
      {`${attackSpeed.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Attack Speed`}
    </div>
  );
};

export default AttackSpeed;