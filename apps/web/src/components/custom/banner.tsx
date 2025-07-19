import { getBannerColorHex } from '@/lib/colorUtils';
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
  if (!layers) return
  return (
    <div
      className={cn("relative", className)}
      style={{
        width: `${size}px`,
        height: `${size*2}px`,
        backgroundColor: getBannerColorHex(base), // Base color
      }}
    >
      {layers.map((layer, index) => (
        <div
          key={index}
          className={cn("absolute w-full h-full banner-layer", className)}
          style={{
            backgroundColor: getBannerColorHex(layer.colour),
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