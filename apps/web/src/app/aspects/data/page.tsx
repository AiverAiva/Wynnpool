"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, X } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AspectTooltip, type Aspect } from "@/components/wynncraft/aspect/AspectTooltip"
import api from "@/lib/api"

export default function AspectBrowser() {
    const [aspects, setAspects] = useState<Aspect[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedClass, setSelectedClass] = useState<string>("all")
    const [selectedRarity, setSelectedRarity] = useState<string>("all")
    const [openTooltip, setOpenTooltip] = useState<string | null>(null)

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
                            {aspects.map((aspect) => (
                                <AspectTooltip
                                    key={aspect.aspectId}
                                    aspect={aspect}
                                    open={openTooltip === aspect.aspectId}
                                    onOpenChange={(open) => setOpenTooltip(open ? aspect.aspectId : null)}
                                >
                                    <button
                                        onMouseEnter={() => setOpenTooltip(aspect.aspectId)}
                                        onMouseLeave={() => setOpenTooltip(null)}
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
                                </AspectTooltip>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
