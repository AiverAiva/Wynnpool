"use client";

import React from 'react';
import { ELEMENT_COLORS } from '@/utils/types';

interface PowderSlotsProps {
  total: number;
  powders: Array<{
    element: number;
    tier: number;
  }>;
}

const PowderSlots: React.FC<PowderSlotsProps> = ({ total, powders }) => {
  return (
    <div className="mt-3 text-purple-400">
      <div className="flex items-center">
        <span>[{powders.length}/{total}] Powder Slots</span>
        <span className="ml-2 flex">
          {powders.map((powder, index) => (
            <span
              key={index}
              className="mx-0.5 text-lg"
              style={{ color: ELEMENT_COLORS[powder.element] }}
            >
              ❖
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default PowderSlots;