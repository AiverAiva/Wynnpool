"use client"

import { useState } from "react"
import { LootItem, type Item } from "./loot-item"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { MapPin } from "lucide-react"
import { ItemTypeIcon } from "@/components/custom/WynnIcon"
import { getRarityStyles } from "@/lib/colorUtils"
import { AspectTooltipWrapper } from "@/components/wrapper/AspectTooltipWrapper"
import { useRaidpool } from "@/components/context/RaidpoolContext"

interface Region {
  region: string
  timestamp: string
  type: string
  items: Item[]
}

interface LootData {
  regions: Region[]
}

const REGION_ORDER = ["NOTG", "NOL", "TCC", "TNA"] as const

const CLASSES = [
  { id: "Archer", label: "Archer", icon: <ItemTypeIcon type="bow" />, subtype: "ArcherAspect" },
  { id: "Mage", label: "Mage", icon: <ItemTypeIcon type="wand" />, subtype: "MageAspect" },
  { id: "Warrior", label: "Warrior", icon: <ItemTypeIcon type="spear" />, subtype: "WarriorAspect" },
  { id: "Assassin", label: "Assassin", icon: <ItemTypeIcon type="dagger" />, subtype: "AssassinAspect" },
  { id: "Shaman", label: "Shaman", icon: <ItemTypeIcon type="relik" />, subtype: "ShamanAspect" },
] as const

type ClassId = (typeof CLASSES)[number]["id"]
type GroupBy = "rarity" | "region"

const getRarityOrder = (rarity: string) => {
  const order: Record<string, number> = {
    Mythic: 0,
    Fabled: 1,
    Legendary: 2,
    Rare: 3,
    Unique: 4,
    Common: 5,
  }
  return order[rarity] ?? 99
}

const getRegionOrder = (region: string) => {
  const index = REGION_ORDER.indexOf(region as any)
  return index === -1 ? 99 : index
}

export function ClassAspectFinder() {
  const { data, loading, error } = useRaidpool()
  const [selectedClass, setSelectedClass] = useState<ClassId>("Archer")
  const [groupBy, setGroupBy] = useState<GroupBy>("rarity")

  const classConfig = CLASSES.find((c) => c.id === selectedClass)!

  if (!data) return

  // Get all aspects for the selected class across all regions
  const getClassAspects = () => {
    const aspectsByRegion: Record<string, Item[]> = {}

    data.regions.forEach((region) => {
      const classAspects = region.items
        .filter(
          (item) =>
            item.itemType === "AspectItem" &&
            item.subtype === classConfig.subtype,
        )
        .map((item) => ({
          ...item,
          region: region.region,
        }))

      if (classAspects.length > 0) {
        aspectsByRegion[region.region] = classAspects
      }
    })

    return aspectsByRegion
  }

  const aspectsByRegion = getClassAspects()

  // Group by rarity (across all regions)
  const getAspectsByRarity = () => {
    const allAspects: Item[] = []
    Object.values(aspectsByRegion).forEach((items) => {
      allAspects.push(...items)
    })

    const grouped: Record<string, Item[]> = {}
    allAspects.forEach((item) => {
      const rarity = item.rarity || "Common"
      if (!grouped[rarity]) grouped[rarity] = []
      grouped[rarity].push(item)
    })

    // Sort by rarity order
    const sorted = Object.entries(grouped).sort(([a], [b]) => getRarityOrder(a) - getRarityOrder(b))
    return Object.fromEntries(sorted)
  }

  const totalAspects = Object.values(aspectsByRegion).flat().length

  return (
    <div className="space-y-6 border-t border-border pt-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-foreground">Class Aspect Finder</h2>
          <p className="text-muted-foreground text-sm mt-1">Find farmable aspects for your class across all regions</p>
        </div>

        {/* Group By Toggle */}
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
          <button
            onClick={() => setGroupBy("rarity")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              groupBy === "rarity"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            By Rarity
          </button>
          <button
            onClick={() => setGroupBy("region")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              groupBy === "region"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            By Region
          </button>
        </div>
      </div>

      {/* Class Selection */}
      <Tabs value={selectedClass} onValueChange={(v) => setSelectedClass(v as ClassId)} className="w-full">
        <TabsList className="bg-muted/30 h-auto p-1.5 gap-1 w-full flex-1 justify-between">
          {CLASSES.map((cls) => {
            return (
              <TabsTrigger
                key={cls.id}
                value={cls.id}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex-grow text-sm font-medium gap-3"
              >
                {cls.icon}
                {cls.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {CLASSES.map((cls) => (
          <TabsContent key={cls.id} value={cls.id} className="mt-6 animate-in fade-in duration-300">
            {/* Stats Bar */}
            <div className="flex items-center gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Aspects:</span>
                <Badge variant="secondary" className="bg-muted/50">
                  {totalAspects}
                </Badge>
              </div>
            </div>

            {totalAspects === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No aspects found for {cls.label} in the current loot pool.</p>
              </div>
            ) : groupBy === "rarity" ? (
              // Group by Rarity View
              <div className="space-y-8">
                {Object.entries(getAspectsByRarity()).map(([rarity, items]) => (
                  <div key={rarity}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={`gap-1.5 ${getRarityStyles(rarity).badge}`}>
                        {/* {getRarityIcon(rarity)} */}
                        {rarity}
                      </Badge>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item, idx) => (
                        <AspectTooltipWrapper key={`${item.name}-${idx}`} name={item.name}>
                          <LootItem item={item} />
                        </AspectTooltipWrapper>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Group by Region View
              <div className="space-y-8">
                {Object.entries(aspectsByRegion)
                  .sort(([a], [b]) => getRegionOrder(a) - getRegionOrder(b))
                  .map(([region, items]) => {
                    // Further group by rarity within each region
                    const groupedByRarity: Record<string, Item[]> = {}
                    items.forEach((item) => {
                      const rarity = item.rarity || "Common"
                      if (!groupedByRarity[rarity]) groupedByRarity[rarity] = []
                      groupedByRarity[rarity].push(item)
                    })
                    const sortedRarities = Object.entries(groupedByRarity).sort(
                      ([a], [b]) => getRarityOrder(a) - getRarityOrder(b),
                    )

                    return (
                      <div key={region}>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className="gap-1.5 text-primary border-primary/50">
                            <MapPin className="h-3 w-3" />
                            {region}
                          </Badge>
                          <Badge variant="secondary" className="bg-muted/50 text-[10px]">
                            {items.length} aspects
                          </Badge>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="space-y-6 pl-4 border-l border-border/50">
                          {sortedRarities.map(([rarity, rarityItems]) => (
                            <div key={rarity}>
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className={`gap-1.5 text-[11px] ${getRarityStyles(rarity).badge}`}>
                                  {rarity}
                                </Badge>
                                <div className="h-px flex-1 bg-border/50" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {rarityItems.map((item, idx) => (
                                  <LootItem key={`${item.name}-${idx}`} item={item} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
