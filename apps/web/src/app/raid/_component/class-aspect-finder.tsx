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

type Category = "aspect" | "tome" | "gear" | "misc"
type RegionAbbrev = "NOTG" | "NOL" | "TCC" | "TNA"
type RegionName = "Nest of the Grootslangs" | "Orphion's Nexus of Light" | "The Canyon Colossus" | "The Nameless Anomaly"
type ClassId = "Archer" | "Mage" | "Warrior" | "Assassin" | "Shaman"
type GroupBy = "rarity" | "region"

const REGION_ABBREV_ORDER: readonly RegionAbbrev[] = ["NOTG", "NOL", "TCC", "TNA"] as const

const REGION_LABELS: Record<RegionAbbrev, RegionName> = {
    NOTG: "Nest of the Grootslangs",
    NOL: "Orphion's Nexus of Light",
    TCC: "The Canyon Colossus",
    TNA: "The Nameless Anomaly",
} as const

const CLASSES = [
    { id: "Archer", label: "Archer", icon: <ItemTypeIcon type="bow" />, subtype: "ArcherAspect" },
    { id: "Mage", label: "Mage", icon: <ItemTypeIcon type="wand" />, subtype: "MageAspect" },
    { id: "Warrior", label: "Warrior", icon: <ItemTypeIcon type="spear" />, subtype: "WarriorAspect" },
    { id: "Assassin", label: "Assassin", icon: <ItemTypeIcon type="dagger" />, subtype: "AssassinAspect" },
    { id: "Shaman", label: "Shaman", icon: <ItemTypeIcon type="relik" />, subtype: "ShamanAspect" },
] as const

const RARITY_ORDER = ["Mythic", "Fabled", "Legendary", "Rare", "Set", "Unique", "Common"] as const


function getRegionAbbrev(region: string): RegionAbbrev {
    if (REGION_ABBREV_ORDER.includes(region as RegionAbbrev)) {
        return region as RegionAbbrev
    }
    return (Object.keys(REGION_LABELS) as RegionAbbrev[]).find(
        (abbrev) => REGION_LABELS[abbrev] === region
    ) ?? (region as RegionAbbrev)
}

function getRegionLabel(abbrev: RegionAbbrev): RegionName {
    return REGION_LABELS[abbrev]
}

function getRegionOrder(region: string): number {
    const abbrev = getRegionAbbrev(region)
    return REGION_ABBREV_ORDER.indexOf(abbrev)
}

function getRarityOrder(rarity: string): number {
    return RARITY_ORDER.indexOf(rarity as any)
}

export function ClassAspectFinder() {
    const { data } = useRaidpool()

    if (!data) {
        return null
    }

    const [selectedClass, setSelectedClass] = useState<ClassId>("Archer")
    const [groupBy, setGroupBy] = useState<GroupBy>("rarity")

    const classConfig = CLASSES.find((c) => c.id === selectedClass)!

    // Get all aspects for the selected class across all regions
    const getClassAspects = (): Record<RegionAbbrev, Item[]> => {
        const aspectsByRegion: Record<RegionAbbrev, Item[]> = {
            NOTG: [],
            NOL: [],
            TCC: [],
            TNA: [],
        }

        data.regions.forEach((region) => {
            const classAspects = region.items.filter(
                (item) => item.itemType === "AspectItem" && item.subtype === classConfig.subtype
            )

            if (classAspects.length > 0) {
                const abbrev = getRegionAbbrev(region.region)
                aspectsByRegion[abbrev] = classAspects.map((item) => ({ ...item, region: abbrev }))
            }
        })

        return aspectsByRegion
    }

    const aspectsByRegion = getClassAspects()

    // Group by rarity (across all regions)
    const getAspectsByRarity = (): Record<string, Item[]> => {
        const allAspects: Item[] = []
        Object.values(aspectsByRegion).forEach((items) => {
            allAspects.push(...items)
        })

        const grouped: Record<string, Item[]> = {}
        allAspects.forEach((item) => {
            const rarity = item.rarity || "Common"
            grouped[rarity] ??= []
            grouped[rarity].push(item)
        })

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
                    <p className="text-muted-foreground text-sm mt-1">
                        Find farmable aspects for your class across all regions
                    </p>
                </div>

                {/* Group By Toggle */}
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
                    <button
                        onClick={() => setGroupBy("rarity")}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            groupBy === "rarity"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
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
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        By Region
                    </button>
                </div>
            </div>

            {/* Class Selection */}
            <Tabs value={selectedClass} onValueChange={(v) => setSelectedClass(v as ClassId)} className="w-full">
                <TabsList
                    className="
            bg-muted/30
            p-1.5
            gap-1
            w-full
            grid
            grid-cols-1
            sm:grid-cols-5
            h-auto
            overflow-visible
          "
                >
                    {CLASSES.map((cls) => (
                        <TabsTrigger
                            key={cls.id}
                            value={cls.id}
                            className="
                  w-full
                  min-w-0
                  data-[state=active]:bg-background
                  data-[state=active]:shadow-sm
                  text-sm
                  font-medium
                  gap-3
                  flex
                  items-center
                  justify-center
                "
                        >
                            {cls.icon}
                            {cls.label}
                        </TabsTrigger>
                    ))}
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
                                {REGION_ABBREV_ORDER.map((abbrev) => {
                                    const items = aspectsByRegion[abbrev]
                                    if (!items || items.length === 0) return null

                                    // Group by rarity within each region
                                    const groupedByRarity: Record<string, Item[]> = {}
                                    items.forEach((item) => {
                                        const rarity = item.rarity || "Common"
                                        groupedByRarity[rarity] ??= []
                                        groupedByRarity[rarity].push(item)
                                    })
                                    const sortedRarities = Object.entries(groupedByRarity).sort(
                                        ([a], [b]) => getRarityOrder(a) - getRarityOrder(b)
                                    )

                                    return (
                                        <div key={abbrev}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Badge variant="outline" className="gap-1.5 text-primary border-primary/50">
                                                    <MapPin className="h-3 w-3" />
                                                    {getRegionLabel(abbrev)}
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
                                                                <AspectTooltipWrapper key={`${item.name}-${idx}`} name={item.name}>
                                                                    <LootItem item={item} />
                                                                </AspectTooltipWrapper>
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
