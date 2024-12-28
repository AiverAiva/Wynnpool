import { cn } from '@/lib/utils';
import React from 'react';

interface Layer {
  colour: string; // Color name (e.g., "CYAN", "WHITE")
  pattern: string; // Pattern name (e.g., "MOJANG", "CREEPER")
}

interface BannerProps {
  base: string; // Base color
  tier: number; // Tier number
  structure: string; // Tier structure (e.g., "tier6")
  layers: Layer[]; // Layers array
  className?: string; // Optional className for custom styling
  size?: number;
}

const Banner: React.FC<BannerProps> = ({ base, tier, structure, layers, className, size=150 }) => {
  // Convert color names to hex values
  const getColorHex = (color: string) => {
    const colorMap: Record<string, string> = {
      WHITE: '#FFFFFF',
      ORANGE: '#D87F33',
      MAGENTA: '#B24CD8',
      LIGHT_BLUE: '#6699D8',
      YELLOW: '#E5E533',
      LIME: '#7FCC19',
      PINK: '#F27FA5',
      GRAY: '#4C4C4C',
      LIGHT_GRAY: '#999999',
      CYAN: '#4C7F99',
      PURPLE: '#7F3FB2',
      BLUE: '#334CB2',
      BROWN: '#664C33',
      GREEN: '#667F33',
      RED: '#993333',
      BLACK: '#191919',
    };
    return colorMap[color.toUpperCase()] 
  };
  
  if (!layers) return
  return (
    <div
      className={cn("relative", className)}
      style={{
        width: `${size}px`,
        height: `${size*2}px`,
        backgroundColor: getColorHex(base), // Base color
      }}
    >
      {layers.map((layer, index) => (
        <div
          key={index}
          className={cn("absolute w-full h-full banner-layer", className)}
          style={{
            backgroundColor: getColorHex(layer.colour),
            WebkitMask: `url(/banners/${layer.pattern}.svg) no-repeat center`,
            mask: `url(/banners/${layer.pattern}.svg) no-repeat center`,
            WebkitMaskSize: 'cover',
            maskSize: 'cover',
          }}
        />
      ))}
    </div>
  );
};

export default Banner;