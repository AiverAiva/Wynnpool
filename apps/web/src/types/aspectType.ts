export interface Aspect {
  aspectId: string
  name: string
  rarity: string
  requiredClass: string
  tiers: Record<string, AspectTier>
  description?: string
}

interface AspectTier {
  threshold: number
  description: string[]
}

export interface AspectData {
  [className: string]: Aspect[]
}