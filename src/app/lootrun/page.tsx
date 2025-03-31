'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from 'next/image'
import { Skeleton } from "@/components/ui/skeleton"
import Countdown from '@/components/custom/countdown'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import api from '@/utils/api'
import { ArrowUpDown, CalendarSearch, CheckCircle2, Info, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ItemPoolHistoryModal } from '@/components/custom/ItemPoolHistoryModal'

interface LootItem {
    Item: string
    Tracker: string
}

interface LootData {
    Loot: {
        [key: string]: {
            Shiny: LootItem
            Mythic: string[]
            Fabled: string[]
            Legendary: string[]
            Rare: string[]
            Unique: string[]
        }
    }
    Icon: {
        [key: string]: string
    }
    Timestamp: number
}

interface ItemAvailability {
    normal: number | null
    shiny: number | null
    icon: string | null
}

interface LastSeenData {
    [key: string]: ItemAvailability
}

const rarityColors = {
    Shiny: 'bg-pink-500 text-white',
    Mythic: 'bg-fuchsia-800 text-white',
    Fabled: 'bg-rose-600 text-white',
    Legendary: 'bg-cyan-400 text-cyan-950',
    Rare: 'bg-fuchsia-400 text-fuchsia-950',
    Unique: 'bg-amber-300 text-amber-950'
}

export default function LootRunPool() {
    const [lootData, setLootData] = useState<LootData | null>(null)
    const [lastSeenData, setlastSeenData] = useState<LastSeenData>({})
    const [countdown, setCountdown] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "normalDate" | "shinyDate">("name")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [filterBy, setFilterBy] = useState<"all" | "inPool">("all")

    useEffect(() => {
        Promise.all([
            fetch(api('/lootrun-pool')).then(response => response.json()),
            fetch(api('/lootrun-pool/lastseen')).then(response => response.json())
        ])
            .then(([lootData, lastSeenData]) => {
                setLootData(lootData)
                setlastSeenData(lastSeenData)
            })
            .catch(error => {
                console.error('Error fetching data:', error)
            })
    }, [])

    useEffect(() => {
        if (lootData) {
            const nextUpdate = lootData.Timestamp + 7 * 86400; // 7 days in seconds
            setCountdown(nextUpdate);
        }
    }, [lootData])

    // Format timestamp to readable date
    const formatDate = (timestamp: number | null) => {
        if (!timestamp) return "Not Available"

        // Add 7 days to the timestamp (7 days * 24 hours * 60 minutes * 60 seconds)
        const endTimestamp = timestamp + 7 * 24 * 60 * 60
        const date = new Date(timestamp * 1000)
        const endDate = new Date(endTimestamp * 1000)

        return endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    // Check if item is currently in pool
    const isInPool = (timestamp: number | null) => {
        if (!timestamp) return false

        const now = Date.now() / 1000
        const endTimestamp = timestamp + 7 * 24 * 60 * 60

        return now >= timestamp && now <= endTimestamp
    }

    // Get relative time (e.g., "2 days ago" or "in 3 days")
    const getRelativeTime = (timestamp: number | null) => {
        if (!timestamp) return ""

        const now = Date.now() / 1000
        const endTimestamp = timestamp + 7 * 24 * 60 * 60

        // If currently in pool
        if (now >= timestamp && now <= endTimestamp) {
            const remainingSeconds = endTimestamp - now
            const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60))
            return `In pool for ${remainingDays} more ${remainingDays === 1 ? "day" : "days"}`
        }

        // If pool has ended
        const passedSeconds = now - endTimestamp
        const passedDays = Math.ceil(passedSeconds / (24 * 60 * 60))
        return `${passedDays} ${passedDays === 1 ? "day" : "days"} ago`
    }

    // Filter and sort items
    const getFilteredAndSortedItems = () => {
        const now = Date.now() / 1000

        // Filter items
        const filteredItems = Object.entries(lastSeenData).filter(([name, item]) => {
            // Apply search filter
            if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Apply availability filter
            switch (filterBy) {
                case "inPool":
                    return isInPool(item.normal) || isInPool(item.shiny)
                default:
                    return true
            }
        })

        // Sort items
        filteredItems.sort((a, b) => {
            const [nameA, itemA] = a
            const [nameB, itemB] = b

            let comparison = 0

            switch (sortBy) {
                case "name":
                    comparison = nameA.localeCompare(nameB)
                    break
                case "normalDate":
                    // Handle null values
                    if (itemA.normal === null && itemB.normal === null) comparison = 0
                    else if (itemA.normal === null) comparison = 1
                    else if (itemB.normal === null) comparison = -1
                    else comparison = itemA.normal - itemB.normal
                    break
                case "shinyDate":
                    // Handle null values
                    if (itemA.shiny === null && itemB.shiny === null) comparison = 0
                    else if (itemA.shiny === null) comparison = 1
                    else if (itemB.shiny === null) comparison = -1
                    else comparison = itemA.shiny - itemB.shiny
                    break
            }

            return sortDirection === "asc" ? comparison : -comparison
        })

        return filteredItems
    }

    const filteredAndSortedItems = getFilteredAndSortedItems()

    // Toggle sort direction
    const toggleSortDirection = () => {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    }

    if (!lootData) return <div className="flex justify-center items-center h-screen"><Spinner size="large" /></div>

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <h1 className="text-4xl font-bold mb-4">Lootrun Pool</h1>
            <Card className="mb-4 relative">
                <CardHeader className="flex justify-center items-center">
                    <CardTitle>Next Update In</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center">
                    <Countdown targetTimestamp={countdown} endText="Data outdated, waiting for update..." />
                </CardContent>
                <Link href="/lootrun/history" legacyBehavior passHref>
                    <Button className="absolute top-4 right-4 rounded-full">
                        History
                    </Button>
                </Link>
            </Card>
            <Tabs defaultValue={Object.keys(lootData.Loot)[0]}>
                <TabsList className="grid w-full grid-cols-5">
                    {Object.keys(lootData.Loot).map((area) => (
                        <TabsTrigger key={area} value={area}>{area}</TabsTrigger>
                    ))}
                </TabsList>
                {Object.entries(lootData.Loot).map(([area, categories]) => (
                    <TabsContent key={area} value={area}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{area} Loot</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TooltipProvider>
                                    {Object.entries(categories).map(([rarity, items]) => (
                                        <div key={rarity} className="mb-4">
                                            <h3 className="text-xl font-semibold mb-2">{rarity}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Array.isArray(items) ? items.map((item) => (
                                                    <div className="flex items-center space-x-2" key={item}>
                                                        <Image
                                                            unoptimized
                                                            src={lootData.Icon[item] && lootData.Icon[item].startsWith('http')
                                                                ? lootData.Icon[item]
                                                                : (lootData.Icon[item] ? `/icons/items/${lootData.Icon[item]}` : '/icons/items/barrier.webp')}
                                                            alt={item}
                                                            width={32}
                                                            height={32}
                                                        />
                                                        <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{item}</Badge>
                                                    </div>
                                                )) : (
                                                    <div className="flex items-center space-x-2">
                                                        <Image
                                                            unoptimized
                                                            src={lootData.Icon[items.Item].startsWith('http')
                                                                ? lootData.Icon[items.Item]
                                                                : `/icons/items/${lootData.Icon[items.Item]}`}
                                                            alt={items.Item}
                                                            width={32}
                                                            height={32}
                                                        />
                                                        <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{items.Item}<span className='font-mono text-xs font-thin'>&ensp;{items.Tracker}</span></Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </TooltipProvider>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
            <div className="container py-8">
                <h1 className="text-3xl font-bold mb-6">Item Availability</h1>

                {/* Filters and controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="normalDate">Normal Date</SelectItem>
                                <SelectItem value="shinyDate">Shiny Date</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                            <ArrowUpDown className={`h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        </Button>
                    </div>

                    <Select value={filterBy} onValueChange={(value) => setFilterBy(value as any)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="inPool">Currently In Pool</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {!lastSeenData ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <Tabs defaultValue="grid">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm text-muted-foreground">{filteredAndSortedItems.length} items found</div>
                            <TabsList>
                                <TabsTrigger value="grid">Grid</TabsTrigger>
                                <TabsTrigger value="table">Table</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="grid" className="mt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredAndSortedItems.map(([name, item]) => {
                                    const normalInPool = isInPool(item.normal)
                                    const shinyInPool = isInPool(item.shiny)
                                    const anyInPool = normalInPool || shinyInPool

                                    return (
                                        <Card
                                            key={name}
                                            className={cn(
                                                "overflow-hidden transition-all duration-200",
                                                anyInPool && "border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.6)]",
                                            )}
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className={`${name.length > 14 ? 'text-sm' : 'text-lg'} flex items-center gap-2 justify-between`}>
                                                    <div className='flex items-center gap-2'>
                                                        {item.icon ? (
                                                            <div className="relative w-8 h-8 flex-shrink-0">
                                                                <Image
                                                                    src={item.icon.startsWith("http") ? item.icon : `/icons/items/${item.icon}`}
                                                                    alt={name}
                                                                    width={32}
                                                                    height={32}
                                                                    className="object-contain"
                                                                    onError={(e) => {
                                                                        // Fallback for missing icons
                                                                        ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 bg-muted rounded-md flex-shrink-0"></div>
                                                        )}
                                                        <span className='truncate'>{name}</span>
                                                    </div>
                                                    <ItemPoolHistoryModal
                                                        itemName={name}
                                                        trigger={
                                                            // disabled={!searchTerm}
                                                            <Button variant={'ghost'} className='h-8 w-8'>
                                                                <CalendarSearch />
                                                                {/* <Info className="h-4 w-4" /> */}
                                                            </Button>
                                                        }
                                                    />
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Normal:</span>
                                                        <div className="flex flex-col items-end">
                                                            <span>{formatDate(item.normal)}</span>
                                                            {item.normal && (
                                                                <span
                                                                    className={cn(
                                                                        "text-xs",
                                                                        normalInPool ? "text-green-500 font-medium" : "text-muted-foreground",
                                                                    )}
                                                                >
                                                                    {normalInPool ? (
                                                                        <span className="flex items-center">
                                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                            In Pool
                                                                        </span>
                                                                    ) : (
                                                                        getRelativeTime(item.normal)
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Sparkles className="h-3.5 w-3.5" /> Shiny:
                                                        </span>
                                                        <div className="flex flex-col items-end">
                                                            <span>{formatDate(item.shiny)}</span>
                                                            {item.shiny && (
                                                                <span
                                                                    className={cn(
                                                                        "text-xs",
                                                                        shinyInPool ? "text-green-500 font-medium" : "text-muted-foreground",
                                                                    )}
                                                                >
                                                                    {shinyInPool ? (
                                                                        <span className="flex items-center">
                                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                            In Pool
                                                                        </span>
                                                                    ) : (
                                                                        getRelativeTime(item.shiny)
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status badges */}
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {normalInPool && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                            Normal Available
                                                        </Badge>
                                                    )}
                                                    {shinyInPool && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                            <Sparkles className="h-3 w-3 mr-1" /> Shiny Available
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        <TabsContent value="table" className="mt-0">
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="py-3 px-4 text-left font-medium">Item</th>
                                            <th className="py-3 px-4 text-left font-medium">Normal Version</th>
                                            <th className="py-3 px-4 text-left font-medium">Shiny Version</th>
                                            <th className="py-3 px-4 text-left font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedItems.map(([name, item]) => {
                                            const normalInPool = isInPool(item.normal)
                                            const shinyInPool = isInPool(item.shiny)
                                            const anyInPool = normalInPool || shinyInPool

                                            return (
                                                <tr key={name} className={cn("border-b", anyInPool && "bg-green-50 dark:bg-green-950/20")}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {item.icon ? (
                                                                <div className="relative w-6 h-6 flex-shrink-0">
                                                                    <Image
                                                                        src={item.icon.startsWith("http") ? item.icon : `/icons/items/${item.icon}`}
                                                                        alt={name}
                                                                        width={24}
                                                                        height={24}
                                                                        className="object-contain"
                                                                        onError={(e) => {
                                                                            // Fallback for missing icons
                                                                            ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=24&width=24"
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-6 bg-muted rounded-md flex-shrink-0"></div>
                                                            )}
                                                            <span>{name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span>{formatDate(item.normal)}</span>
                                                            {item.normal && (
                                                                <span
                                                                    className={cn(
                                                                        "text-xs",
                                                                        normalInPool ? "text-green-500 font-medium" : "text-muted-foreground",
                                                                    )}
                                                                >
                                                                    {normalInPool ? (
                                                                        <span className="flex items-center">
                                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                            In Pool
                                                                        </span>
                                                                    ) : (
                                                                        getRelativeTime(item.normal)
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1">
                                                                {item.shiny && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                                                                <span>{formatDate(item.shiny)}</span>
                                                            </div>
                                                            {item.shiny && (
                                                                <span
                                                                    className={cn(
                                                                        "text-xs",
                                                                        shinyInPool ? "text-green-500 font-medium" : "text-muted-foreground",
                                                                    )}
                                                                >
                                                                    {shinyInPool ? (
                                                                        <span className="flex items-center">
                                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                            In Pool
                                                                        </span>
                                                                    ) : (
                                                                        getRelativeTime(item.shiny)
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {normalInPool && (
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                                    Normal
                                                                </Badge>
                                                            )}
                                                            {shinyInPool && (
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                                    <Sparkles className="h-3 w-3 mr-1" /> Shiny
                                                                </Badge>
                                                            )}
                                                            {!normalInPool && !shinyInPool && (
                                                                <span className="text-xs text-muted-foreground">Not in pool</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    )
}