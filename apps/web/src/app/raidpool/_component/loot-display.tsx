import { Item, LootItem } from "./loot-item"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, AlertCircle, MapPin, Package, ChevronUp, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getRarityStyles } from "@/lib/colorUtils"
import { useEffect, useMemo, useState } from "react"
import { AspectTooltipWrapper } from "@/components/wrapper/AspectTooltipWrapper"
import { useRaidpool } from "@/components/context/RaidpoolContext"

interface Region {
    region: string
    timestamp: string
    type: string
    items: Item[]
}

export interface LootData {
    regions: Region[]
}

type Category = "aspect" | "tome" | "gear" | "misc"

// Constants
const CATEGORIES: readonly Category[] = ["aspect", "tome", "gear", "misc"] as const
const RARITY_ORDER = ["Mythic", "Fabled", "Legendary", "Rare", "Set", "Unique", "Normal", "Common"] as const
const REGION_ORDER = ["NOTG", "NOL", "TCC", "TNA"] as const

const RARITY_RANK = Object.fromEntries(
    RARITY_ORDER.map((r, i) => [r.toLowerCase(), i])
)

// Helper functions
function getCategoryType(item: Item): Category {
    switch (item.itemType) {
        case "AspectItem":
            return "aspect"
        case "TomeItem":
            return "tome"
        case "GearItem":
            return "gear"
        default:
            return "misc"
    }
}

function groupByRarity(items: Item[]): Record<string, Item[]> {
    return items.reduce((acc, item) => {
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

export const LootDisplay: React.FC = () => {
    const { data, loading, error } = useRaidpool()

    const sortedRegions = useMemo(() => {
        if (!data?.regions) return []
        return [...data.regions].sort((a, b) => {
            const indexA = REGION_ORDER.indexOf(a.region as any)
            const indexB = REGION_ORDER.indexOf(b.region as any)
            return indexA - indexB
        })
    }, [data?.regions])

    const [activeRegion, setActiveRegion] = useState<string>("")
    const [expandedCategories, setExpandedCategories] = useState<Record<Category, boolean>>({
        aspect: true,
        tome: false,
        gear: false,
        misc: false
    })

    useEffect(() => {
        if (!activeRegion && sortedRegions.length > 0) {
            // pick first available by REGION_ORDER (top)
            setActiveRegion(sortedRegions[0].region)
        }
    }, [sortedRegions, activeRegion])

    const availableRegions = useMemo(() =>
        new Set(sortedRegions.map(r => r.region)),
        [sortedRegions]
    )

    const currentRegion = useMemo(() =>
        sortedRegions.find(r => r.region === activeRegion),
        [sortedRegions, activeRegion]
    )

    const categorizedItems = useMemo(() => {
        if (!currentRegion) return null

        return currentRegion.items.reduce(
            (acc, item) => {
                acc[getCategoryType(item)].push(item)
                return acc
            },
            { aspect: [], tome: [], gear: [], misc: [] } as Record<Category, Item[]>
        )
    }, [currentRegion])

    const toggleCategory = (category: Category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    // Early returns for loading/error states
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm">Loading raid pool data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-destructive">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p className="text-sm">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">No data available for this week</p>
            </div>
        )
    }

    if (!data || sortedRegions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                {/* <Loader2 className="h-8 w-8 animate-spin mb-4" /> */}
                <p className="text-3xl">No data yet</p>
                <p className="text-sm">Data being collecting...</p>
            </div>
        )
    }

    return (
        <>
            <Tabs value={activeRegion} onValueChange={setActiveRegion} className="w-full">
                <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-between overflow-x-auto scrollbar-hide mb-6">
                    {REGION_ORDER.map((region) => {
                        const isAvailable = availableRegions.has(region)

                        return (
                            <TabsTrigger
                                key={region}
                                value={region}
                                disabled={!isAvailable}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-0 py-3 text-sm font-medium transition-all flex-1 text-center disabled:opacity-40 disabled:cursor-not-allowed relative"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {region}
                                    {!isAvailable && (
                                        <Badge variant="outline" className="ml-1 text-[8px] py-0 px-1 h-3.5 border-muted-foreground/30">
                                            Pending
                                        </Badge>
                                    )}
                                </div>
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                <TabsContent
                    value={activeRegion}
                    className="mt-0 space-y-4 animate-in fade-in duration-300"
                >
                    {categorizedItems && CATEGORIES.map((category) => {
                        const items = categorizedItems[category]
                        if (items.length === 0) return null

                        const grouped = groupByRarity(items)
                        const sortedRarities = sortRarityGroups(grouped)
                        const isExpanded = expandedCategories[category]

                        return (
                            <div key={category} className="border border-border rounded-lg">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="flex items-center justify-between w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium capitalize">
                                            {category === "misc" ? "Miscellaneous" : category}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                            {items.length}
                                        </Badge>
                                    </div>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>

                                <div className={isExpanded ? "block" : "hidden"}>
                                    <div className="p-4 space-y-6">
                                        {sortedRarities.map(([rarity, rarityItems]) => (
                                            <div key={rarity}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant="outline" className={`gap-1.5 ${getRarityStyles(rarity).badge}`}>
                                                        {rarity}
                                                    </Badge>
                                                    <div className="h-px flex-1 bg-border" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {rarityItems.map((item, idx) => (
                                                        item.itemType === "AspectItem" ? (
                                                            <AspectTooltipWrapper key={`${item.name}-${idx}`} name={item.name}>
                                                                <LootItem item={item} />
                                                            </AspectTooltipWrapper>
                                                        ) : (
                                                            <LootItem key={`${item.name}-${idx}`} item={item} />
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </TabsContent>
            </Tabs>

            {currentRegion && (
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-6 text-center">
                    Data from {new Date(currentRegion.timestamp).toLocaleDateString()}
                </p>
            )}
        </>
    )
}

export default LootDisplay
