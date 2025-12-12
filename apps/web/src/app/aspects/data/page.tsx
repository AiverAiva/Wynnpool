"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, X } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"

interface AspectTier {
    threshold: number
    description: string[]
}

interface Aspect {
    aspectId: string
    icon?: {
        value: {
            id: string
            name: string
            customModelData?: {
                rangeDispatch?: number[]
            }
        }
        format?: string
    }
    name: string
    rarity: string
    requiredClass: string
    tiers: {
        [key: string]: AspectTier
    }
}

export default function AspectBrowser() {
    const [aspects, setAspects] = useState<Aspect[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedClass, setSelectedClass] = useState<string>("all")
    const [selectedRarity, setSelectedRarity] = useState<string>("all")
    const [aspectTiers, setAspectTiers] = useState<{ [key: string]: number }>({})
    const [hoveredAspect, setHoveredAspect] = useState<string | null>(null)

    // Get current tier for an aspect (default to 1)
    const getCurrentTier = (aspectId: string, tiers: { [key: string]: AspectTier }) => {
        const tierKeys = Object.keys(tiers).sort((a, b) => Number(a) - Number(b))
        const currentIndex = aspectTiers[aspectId] ?? 0
        return tierKeys[currentIndex] || tierKeys[0]
    }

    // Cycle to next tier on click
    const cycleTier = (aspectId: string, tiers: { [key: string]: AspectTier }) => {
        const tierKeys = Object.keys(tiers)
        const currentIndex = aspectTiers[aspectId] ?? 0
        const nextIndex = (currentIndex + 1) % tierKeys.length
        setAspectTiers((prev) => ({ ...prev, [aspectId]: nextIndex }))
    }

    // Fetch aspects
    useEffect(() => {
        fetchAspects()
    }, [selectedClass, selectedRarity])

    const fetchAspects = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedClass !== "all") params.append("class", selectedClass)
            if (selectedRarity !== "all") params.append("rarity", selectedRarity)

            const response = await fetch(api(`/aspect/list?${params.toString()}`))
            const data = await response.json()
            setAspects(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error fetching aspects:", error)
            setAspects([])
        } finally {
            setLoading(false)
        }
    }

    // Search aspects
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchAspects()
            return
        }

        setLoading(true)
        try {
            const response = await fetch(api("/aspect/search"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ search: searchQuery }),
            })
            const data = await response.json()
            setAspects(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error searching aspects:", error)
            setAspects([])
        } finally {
            setLoading(false)
        }
    }

    const clearFilters = () => {
        setSelectedClass("all")
        setSelectedRarity("all")
        setSearchQuery("")
        fetchAspects()
    }

    const hasActiveFilters = selectedClass !== "all" || selectedRarity !== "all" || searchQuery

    return (
        <div className="min-h-screen max-w-screen-md mx-auto px-6 py-36">
            {/* min-h-screen bg-background */}
            {/* Header */}
            <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container">
                    {/* <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-balance">Aspect Codex</h1>
          </div> */}

                    {/* Search and Filters */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search aspects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="pl-9"
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="icon" onClick={clearFilters}>
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row md:justify-center gap-4">
                            <div>
                                <p className="text-sm font-medium mb-2 text-muted-foreground">Class</p>
                                <Tabs value={selectedClass} onValueChange={setSelectedClass}>
                                    <TabsList className="w-full grid grid-cols-6">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="mage">Mage</TabsTrigger>
                                        <TabsTrigger value="archer">Archer</TabsTrigger>
                                        <TabsTrigger value="shaman">Shaman</TabsTrigger>
                                        <TabsTrigger value="warrior">Warrior</TabsTrigger>
                                        <TabsTrigger value="assassin">Assassin</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2 text-muted-foreground">Rarity</p>
                                <Tabs value={selectedRarity} onValueChange={setSelectedRarity}>
                                    <TabsList className="w-full grid grid-cols-4">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="legendary">Legendary</TabsTrigger>
                                        <TabsTrigger value="fabled">Fabled</TabsTrigger>
                                        <TabsTrigger value="mythic">Mythic</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : aspects.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg">No aspects found. Try adjusting your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 text-sm text-muted-foreground">
                            Found {aspects.length} aspect{aspects.length !== 1 ? "s" : ""}
                        </div>

                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-3">
                            {aspects.map((aspect) => {
                                const tierKeys = Object.keys(aspect.tiers || {}).sort((a, b) => Number(a) - Number(b))
                                const currentTierKey = getCurrentTier(aspect.aspectId, aspect.tiers || {})
                                const currentTier = aspect.tiers?.[currentTierKey]
                                const currentTierIndex = tierKeys.indexOf(currentTierKey)

                                return (
                                    <div key={aspect.aspectId} className="relative group">
                                        <button
                                            onClick={() => aspect.tiers && cycleTier(aspect.aspectId, aspect.tiers)}
                                            onMouseEnter={() => setHoveredAspect(aspect.aspectId)}
                                            onMouseLeave={() => setHoveredAspect(null)}
                                            className={`w-full aspect-square rounded-lg border-2 bg-card hover:bg-accent transition-all hover:scale-110 hover:shadow-lg flex items-center justify-center p-1 border-${aspect.rarity}`}
                                        >
                                            <Image
                                                src={`/icons/aspects/${aspect.requiredClass.toLowerCase()}.png`}
                                                alt={aspect.requiredClass}
                                                width={16}
                                                height={16}
                                                unoptimized
                                                className="w-full h-full object-contain [image-rendering:pixelated]"
                                            />
                                        </button>

                                        {hoveredAspect === aspect.aspectId && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                                                <div className="bg-popover border border-border rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px]">
                                                    <p className="font-bold text-base mb-2">{aspect.name}</p>
                                                    {/* <div className="flex gap-1 mb-3">
                                                        <Badge variant="outline" className={`${getRarityColor(aspect.rarity)} capitalize text-xs`}>
                                                            {aspect.rarity}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getClassColor(aspect.requiredClass)} capitalize text-xs`}
                                                        >
                                                            {aspect.requiredClass}
                                                        </Badge>
                                                    </div> */}

                                                    {/* Display current tier only */}
                                                    {currentTier && (
                                                        <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2 text-xs">
                                                            <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                                <span>Tier {currentTierKey} of {tierKeys.length}</span>
                                                                <span className="text-[10px]">Threshold: {currentTier.threshold}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {currentTier.description.map((desc, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="leading-snug text-[12px]"
                                                                        dangerouslySetInnerHTML={{ __html: desc }}
                                                                    />
                                                                ))}
                                                            </div>
                                                            {tierKeys.length > 1 && (
                                                                <p className="text-[11px] text-muted-foreground mt-2 italic">Click to switch tier</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
