"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LootItem } from "./loot-item"
import {
    MapPin,
    Package,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Gem,
    Sword,
    BookOpen,
    Key,
    Loader2,
    AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getRarityStyles } from "@/lib/colorUtils"
import { AspectTooltipWrapper } from "@/components/wrapper/AspectTooltipWrapper"
import { useLootrun, type Item } from "@/components/context/LootrunContext"

type Category = "Gear" | "Tome" | "Key" | "Currency" | "Misc"

const CATEGORIES: readonly Category[] = ["Gear", "Tome", "Key", "Currency", "Misc"] as const
const RARITY_ORDER = ["Mythic", "Legendary", "Fabled", "Rare", "Unique", "Set", "Common"] as const

const RARITY_RANK = Object.fromEntries(
    RARITY_ORDER.map((r, i) => [r.toLowerCase(), i])
)

const REGION_ORDER = ["COTL", "Corkus", "Molten Heights", "Sky Islands", "Silent Expanse"] as const

const REGION_NAMES: Record<string, string> = {
    COTL: "Canyon of the Lost",
    "Corkus": "Corkus",
    "Molten Heights": "Molten Heights",
    "Sky Islands": "Sky Islands",
    "Silent Expanse": "Silent Expanse",
}

const REGION_RANK = Object.fromEntries(
    REGION_ORDER.map((id, i) => [id, i])
)

function getCategoryType(item: Item): Category {
    switch (item.itemType) {
        case "GearItem":
            return "Gear"
        case "TomeItem":
            return "Tome"
        case "DungeonKeyItem":
            return "Key"
        case "EmeraldItem":
        case "RuneItem":
        case "InsulatorItem":
            return "Currency"
        default:
            return "Misc"
    }
}

function getCategoryIcon(category: string) {
    switch (category) {
        case "Gear":
            return <Sword className="h-4 w-4" />
        case "Tome":
            return <BookOpen className="h-4 w-4" />
        case "Key":
            return <Key className="h-4 w-4" />
        case "Currency":
            return <Gem className="h-4 w-4" />
        default:
            return <Package className="h-4 w-4" />
    }
}

function groupByRarity(items: Item[]): Record<string, Item[]> {
    // Sort items: shiny first, then maintain original order
    const sorted = [...items].sort((a, b) => {
        if (a.shiny && !b.shiny) return -1
        if (!a.shiny && b.shiny) return 1
        return 0
    })

    return sorted.reduce((acc, item) => {
        if (!acc[item.rarity]) {
            acc[item.rarity] = []
        }
        acc[item.rarity].push(item)
        return acc
    }, {} as Record<string, Item[]>)
}

function sortRarityGroups(groupedByRarity: Record<string, Item[]>): [string, Item[]][] {
    return Object.entries(groupedByRarity).sort((a, b) => {
        const indexA = RARITY_RANK[a[0].toLowerCase()] ?? Infinity
        const indexB = RARITY_RANK[b[0].toLowerCase()] ?? Infinity
        return indexA - indexB
    })
}

export function LootRunDisplay() {
    const { data, loading, error } = useLootrun()
    const [activeRegion, setActiveRegion] = useState<string>("")

    // Calculate and sort regions
    const sortedRegions = useMemo(() => {
        if (!data?.regions) return []
        return [...data.regions].sort((a, b) => {
            const rankA = REGION_RANK[a.region] ?? Infinity
            const rankB = REGION_RANK[b.region] ?? Infinity
            return rankA - rankB
        })
    }, [data?.regions])

    // Set first region as default when data loads
    useEffect(() => {
        if (sortedRegions.length > 0 && !activeRegion) {
            setActiveRegion(sortedRegions[0].region)
        }
    }, [sortedRegions, activeRegion])

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        Gear: true,
        Tome: false,
        Key: false,
        Currency: false,
        Misc: false
    })

    const allItems = useMemo(() => sortedRegions.flatMap((r) => r.items) ?? [], [sortedRegions])
    const totalItems = allItems.length
    const shinyCount = allItems.filter((item) => item.shiny).length
    const mythicCount = allItems.filter((item) => item.rarity === "Mythic").length

    const currentRegions = useMemo(() => {
        return sortedRegions.filter(r => r.region === activeRegion)
    }, [sortedRegions, activeRegion])

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm">Loading loot run data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-destructive">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    if (!data || data.regions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-3xl">No data yet</p>
                <p className="text-sm">Data being collected...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}


            <Tabs value={activeRegion} onValueChange={setActiveRegion} className="w-full">
                <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full flex overflow-x-auto scrollbar-hide mb-6">
                    {sortedRegions.map((region) => (
                        <TabsTrigger
                            key={region.region}
                            value={region.region}
                            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-2 sm:px-4 py-3 text-sm font-medium transition-all whitespace-nowrap"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MapPin className="h-3.5 w-3.5" />
                                {REGION_NAMES[region.region] || region.region}
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeRegion} className="mt-0 space-y-8 animate-in fade-in duration-300">
                    {currentRegions.map((region) => {
                        // Group items for this specific region
                        const categorizedItems = region.items.reduce(
                            (acc, item) => {
                                acc[getCategoryType(item)].push(item)
                                return acc
                            },
                            { Gear: [], Tome: [], Key: [], Currency: [], Misc: [] } as Record<Category, Item[]>
                        )

                        return (
                            <div key={region.region} className="space-y-4">

                                <div className="space-y-4">
                                    {CATEGORIES.map((category) => {
                                        const items = categorizedItems[category]
                                        if (items.length === 0) return null

                                        const grouped = groupByRarity(items)
                                        const sortedRarities = sortRarityGroups(grouped)
                                        const isExpanded = expandedCategories[category]

                                        return (
                                            <div key={`${region.region}-${category}`} className="border border-border rounded-lg bg-zinc-950/20">
                                                <button
                                                    onClick={() => toggleCategory(category)}
                                                    className="flex items-center justify-between w-full px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors rounded-t-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-muted-foreground">
                                                            {getCategoryIcon(category)}
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {category}
                                                        </span>
                                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-zinc-900 border-zinc-800">
                                                            {items.length}
                                                        </Badge>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="p-4 space-y-6">
                                                        {sortedRarities.map(([rarity, rarityItems]) => (
                                                            <div key={rarity}>
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Badge variant="outline" className={cn("gap-1.5 whitespace-nowrap", getRarityStyles(rarity).badge)}>
                                                                        {rarity}
                                                                    </Badge>
                                                                    <div className="h-px flex-1 bg-border/50" />
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    {rarityItems.map((item, idx) => (
                                                                        item.itemType === "AspectItem" ? (
                                                                            <AspectTooltipWrapper key={`${item.name}-${idx}`} name={item.name}>
                                                                                <LootItem item={item} showShinyDetails />
                                                                            </AspectTooltipWrapper>
                                                                        ) : (
                                                                            <LootItem key={`${item.name}-${idx}`} item={item} showShinyDetails />
                                                                        )
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </TabsContent>
            </Tabs>

            {currentRegions[0] && (
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-6 text-center">
                    Data from {new Date(currentRegions[0].timestamp).toLocaleDateString()}
                </p>
            )}
        </div>
    )
}
