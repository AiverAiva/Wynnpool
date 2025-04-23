"use client";

import { getIdentificationInfo } from '@/lib/itemUtils';
import { getClassInfo } from '@/types/classType';
import { ItemRequirement } from '@/types/itemType';
import React from 'react';

const Requirements: React.FC<ItemRequirement> = (requirements) => {
  return (
    <div className="list-disc list-inside text-sm">
      {Object.entries(requirements).map(([key, value]) => {
        let displayValue;
        if (typeof value === 'string' || typeof value === 'number') {
          displayValue = value;
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          displayValue = `${value.min} - ${value.max}`;
        } else {
          displayValue = 'Unknown value';
        }

        return (
          <div key={key}>
            {getIdentificationInfo(key) ? (
              key == 'classRequirement' ? (
                <>{getIdentificationInfo(key)?.displayName}: {getClassInfo(value as string)!.displayName}</>
              ) : (
                <>{getIdentificationInfo(key)?.displayName}: {displayValue}</>
              )
            ) : (
              <>{key}: {displayValue}</>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Requirements;