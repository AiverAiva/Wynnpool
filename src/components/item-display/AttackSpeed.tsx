"use client";

import React from 'react';
import { ATTACK_SPEED_NAMES } from '@/utils/types';

interface AttackSpeedProps {
  speed: string;
}

const AttackSpeed: React.FC<AttackSpeedProps> = ({ speed }) => {
  const displayName = ATTACK_SPEED_NAMES[speed] || speed;
  
  return (
    <div className="text-gray-300 text-sm mb-2">
      {displayName}
    </div>
  );
};

export default AttackSpeed;