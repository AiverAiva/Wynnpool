export interface AspectTier {
  [key: string]: string
}

export interface Aspect {
  name: string
  id: string
  rarity: string
  description: string
  tiers: AspectTier
}

export interface AspectData {
  [className: string]: Aspect[]
}