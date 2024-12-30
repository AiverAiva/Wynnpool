
import { Item } from '@/types/itemType';
import React, { FC } from 'react';
import Image from 'next/image';

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


const getImageSrc = (item: Item): string => {
  if (item.icon) {
    if (item.icon.format === 'attribute' || item.icon.format === 'legacy') {
      const iconValue =
        typeof item.icon.value === 'object'
          ? item.icon.value.name
          : item.icon.value.replace(':', '_');
      return `https://cdn.wynncraft.com/nextgen/itemguide/3.3/${iconValue}.webp`;
    }
    if (item.icon.format === 'skin') {
      return `https://mc-heads.net/head/${item.icon.value}`;
    }
  } else if (item.type === 'armour') {
    return `https://cdn.wynncraft.com/nextgen/itemguide/3.3/${item.armourMaterial}_${item.armourType}.webp`;
  }
  return `/icons/items/barrier.webp`;
};

const ItemIcon: FC<{ item: Item, size?: number }> = ({ item, size = 32 }) => {
  const src = getImageSrc(item);

  return (
    <Image
      src={src}
      alt={item.internalName}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated', // Preserve pixel art look
      }}
    />
  );
};

export { ItemTypeIcon, ItemIcon, getImageSrc }
// export const WynnIcon: React.FC<IconProps> = ({ name, size = 32, className, alt = '' }) => {
//     const src = `/icons/${name}`; // Build the path to the icon in /public/icons
  
//     return (
//       <img
//         src={src}
//         alt={alt || name} // Fallback to the icon name if alt is not provided
//         width={size}
//         height={size}
//         className={className}
//       />
//     );
//   };
