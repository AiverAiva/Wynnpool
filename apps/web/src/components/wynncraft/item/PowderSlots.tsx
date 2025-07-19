"use client";

import { colorMap, POWDER_ELEMENTS } from '@/map/itemMap';
import React from 'react';

interface PowderSlotsProps {
  powderSlots?: number;
  powders?: Array<{
    element: number;
    tier: number;
  }>;
}




const PowderSlots: React.FC<PowderSlotsProps> = ({ powderSlots, powders }) => {
  if (!powderSlots) return
  return (
    <p className="text-sm">
      {/* [{powders?.length || 0}/{powderSlots}]  */}
      Powder Slots&ensp;
      <span className="text-primary/50">
        [
        {powders ? (
          <>
            {powders.map((powder, index) => (
              <span
                key={index}
                className={`mx-0.5 ${colorMap[POWDER_ELEMENTS[powder.element]]}`}
              >
                {String(powder.tier)}
              </span>
            ))}
            <span className="font-five">{Array.from({ length: powderSlots - powders.length }, () => 'O').join('')}</span>
          </>
        ) : (
          <span className="font-five">{Array.from({ length: powderSlots }, () => 'O').join('')}</span>
        )}
        ]
      </span>
    </p>
    // <div className="mt-3 text-purple-400">F
    //   <div className="flex items-center">
    //     <span>[{powders.length}/{total}] Powder Slots</span>
    //     <span className="ml-2 flex">
    //       {powders.map((powder, index) => (
    //         <span
    //           key={index}
    //           className="mx-0.5 text-lg"
    //           // style={{ color: ELEMENT_COLORS[powder.element] }}
    //         >
    //           ❖
    //         </span>
    //       ))}
    //     </span>F
    //   </div>
    // </div>
  );
};

export default PowderSlots;