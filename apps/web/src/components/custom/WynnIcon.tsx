
'use client';

import type { Item } from '@wynnpool/shared';
import React, { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BARRIER_ICON_SRC, getImageSrc } from '@/lib/wynn-item-icon';

interface IconProps {
  name: string; // Add more icon names as needed
  size?: number;
  color?: string;
  className?: string;
  alt?: string;
}

interface ItemTypeIconProps {
  type: string;
  size?: number;
}

const iconData: Record<string, string> = {
  bow: '0% 0%',
  spear: '9.09% 0%',
  wand: '18.18% 0%',
  dagger: '27.27% 0%',
  relik: '36.36% 0%',
  helmet: '45.45% 0%',
  chestplate: '54.55% 0%',
  leggings: '63.64% 0%',
  boots: '72.73% 0%',
  ring: '81.82% 0%',
  bracelet: '90.91% 0%',
  necklace: '100% 0%',

  tome: '0% 100%',
  charm: '9.09% 100%',
};


const ItemTypeIcon: React.FC<ItemTypeIconProps> = ({ type, size = 32 }) => {
  const iconPos = iconData[type];

  if (!iconPos) {
    console.warn(`Icon type "${type}" not found.`);
    return null;
  }

  return (
    <div
      className="icon"
      style={{
        width: size, // Set to the specific width of the icon
        height: size, // Set to the specific height of the icon
        backgroundImage: 'url(/icons/items/all.png)',
        backgroundPosition: `${iconPos}`,
        backgroundSize: '1200% 200%',
        backgroundRepeat: 'no-repeat', // Prevent repeating the sprite
        imageRendering: 'pixelated', // Preserve pixel art look
      }}
    />
  );
};


const ItemIcon: FC<{ item: Item, size?: number, className?: string }> = ({ item, size = 32, className }) => {
  const resolved = getImageSrc(item);
  const [src, setSrc] = useState(resolved);

  useEffect(() => {
    setSrc(resolved);
  }, [resolved]);

  return (
    <Image
      src={src}
      alt={item.internalName}
      width={size}
      height={size}
      unoptimized
      style={{
        imageRendering: 'pixelated',
      }}
      className={cn(className)}
      onError={() => {
        if (src !== BARRIER_ICON_SRC) setSrc(BARRIER_ICON_SRC);
      }}
    />
  );
};

const iconBackgroundPositions: { [key: string]: string } = {
  dungeon_key: '-320px -0px',
  corrupted_dungeon_key: '-352px -0px',
  nii_rune: '-224px -608px',
  uth_rune: '-192px -608px',
  tol_rune: '-128px -608px',
};

const MiscIcon: React.FC<{ id: string; size?: number }> = ({ id, size = 32 }) => {
  const backgroundPosition = iconBackgroundPositions[id];

  if (!backgroundPosition) {
    console.error(`Invalid icon ID: ${id}`);
    return null;
  }

  const [x, y] = backgroundPosition
    .split(' ')
    .map((pos) => parseInt(pos.replace('px', ''), 10));

  const scale = size / 32;

  return (
    <span
      className="sprite"
      style={{
        backgroundImage: 'url(/icons/items/WynnIconCSS.webp)',
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: 'middle',
        backgroundPosition: `${x * scale}px ${y * scale}px`,
        backgroundSize: `${640 * scale}px ${640 * scale}px`,
        imageRendering: 'pixelated',
        lineHeight: 0,
      }}
    ></span>
  );
};


export { ItemTypeIcon, ItemIcon, MiscIcon, getImageSrc }