"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, MapPin, Calendar, Target, Info, Clock, AlertCircle } from 'lucide-react'
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/utils/api"

interface PoolEntry {
    type: "normal" | "shiny"
    region: string
    tracker?: string
}

interface ItemPoolHistoryData {
    itemName: string
    icon: string
    dates: {
        [timestamp: string]: PoolEntry
    }
}

interface ItemPoolHistoryModalProps {
    itemName: string
    trigger?: React.ReactNode
}

export function ItemPoolHistoryModal({
    itemName,
    trigger,
}: ItemPoolHistoryModalProps) {
    const [open, setOpen] = useState(false)
    const [data, setData] = useState<ItemPoolHistoryData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch data when modal is opened
    useEffect(() => {
        if (open && !data && !loading) {
            fetchItemPoolHistory()
        }
    }, [open])

    const fetchItemPoolHistory = async () => {
        setLoading(true)
        setError(null)

        try {
            const encodedItemName = encodeURIComponent(itemName)
            const response = await fetch(api(`/lootrun-pool/history/${encodedItemName}`))

            if (!response.ok) {
                throw new Error(`Failed to fetch pool history: ${response.status}`)
            }

            const responseData = await response.json()
            setData(responseData)
        } catch (err) {
            console.error("Error fetching item pool history:", err)
            setError(err instanceof Error ? err.message : "Failed to fetch item pool history")
        } finally {
            setLoading(false)
        }
    }

    // Reset data when modal is closed
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Optional: uncomment to clear data when modal closes
            // setData(null)
        }
    }

    // Format timestamp to readable date range
    const formatDateRange = (timestamp: number) => {
        const startDate = new Date(timestamp * 1000)
        const endDate = new Date((timestamp + 7 * 24 * 60 * 60) * 1000)

        return {
            start: startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            }),
            end: endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            })
        }
    }

    // Get relative time string (e.g., "2 weeks ago", "3 months ago")
    const getRelativeTimeString = (timestamp: number) => {
        const now = Date.now() / 1000
        const endTimestamp = timestamp + 7 * 24 * 60 * 60

        // If pool is currently active
        if (now >= timestamp && now <= endTimestamp) {
            return "Currently active"
        }

        // All pools are in the past
        const diffSeconds = now - endTimestamp
        const diffDays = Math.floor(diffSeconds / (24 * 60 * 60))

        if (diffDays === 0) {
            return "Ended today"
        } else if (diffDays === 1) {
            return "Ended yesterday"
        } else if (diffDays < 7) {
            return `${diffDays} days ago`
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7)
            return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30)
            return `${months} ${months === 1 ? "month" : "months"} ago`
        } else {
            const years = Math.floor(diffDays / 365)
            return `${years} ${years === 1 ? "year" : "years"} ago`
        }
    }

    // Get pool status class
    const getPoolStatusClass = (timestamp: number) => {
        const now = Date.now() / 1000
        const endTimestamp = timestamp + 7 * 24 * 60 * 60

        if (now >= timestamp && now <= endTimestamp) {
            return "text-green-600 dark:text-green-400"
        } else {
            return "text-muted-foreground"
        }
    }

    // Get region color
    const getRegionColor = (region: string) => {
        const regionColors: Record<string, string> = {
            "Corkus": "bg-amber-500",
            "Sky": "bg-blue-400",
            "Molten": "bg-red-500",
            "Canyon": "bg-orange-500",
            "SE": "bg-emerald-500",
            "Gavel": "bg-purple-500",
            "Wynn": "bg-green-500",
            "Silent": "bg-slate-500",
            "Light": "bg-yellow-400",
            "Void": "bg-violet-600"
        }

        return regionColors[region] || "bg-gray-500"
    }

    // Check if a date is current
    const isCurrentPool = (timestamp: number) => {
        const now = Date.now() / 1000
        const endTimestamp = timestamp + 7 * 24 * 60 * 60
        return now >= timestamp && now <= endTimestamp
    }

    // Get sorted timestamps
    const getSortedTimestamps = () => {
        if (!data || !data.dates) return []

        return Object.keys(data.dates)
            .map(Number)
            .sort((a, b) => b - a)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Info className="h-4 w-4 mr-2" />
                        View Pool History
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center gap-3 pb-2 border-b">
                    {loading ? (
                        <>
                            <Skeleton className="w-12 h-12 rounded" />
                            <Skeleton className="h-6 w-40" />
                        </>
                    ) : data ? (
                        <>
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                    src={data.icon.startsWith("http") ? data.icon : `/icons/items/${data.icon}`}
                                    alt={data.itemName}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            </div>
                            <DialogTitle className="text-xl">{data.itemName}</DialogTitle>
                        </>
                    ) : (
                        <DialogTitle className="text-xl">{itemName}</DialogTitle>
                    )}
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* Loading State */}
                    {loading && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-20" />
                            </div>

                            {[1, 2, 3].map((i) => (
                                <div key={i} className="relative pl-10">
                                    <Skeleton className="absolute left-0 top-1.5 w-8 h-8 rounded-full" />
                                    <div className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-lg font-medium mb-2">Failed to load pool history</h3>
                            <p className="text-sm text-muted-foreground mb-4">{error}</p>
                            <Button onClick={fetchItemPoolHistory}>Try Again</Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && data && Object.keys(data.dates).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Info className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No pool history found</h3>
                            <p className="text-sm text-muted-foreground">This item has not appeared in any pools yet.</p>
                        </div>
                    )}

                    {/* Data State */}
                    {!loading && !error && data && Object.keys(data.dates).length > 0 && (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Pool History</h3>
                                <Badge variant="outline" className="font-mono">
                                    {getSortedTimestamps().length} {getSortedTimestamps().length === 1 ? "entry" : "entries"}
                                </Badge>
                            </div>

                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-muted-foreground/20" />

                                <div className="space-y-4">
                                    {getSortedTimestamps().map((timestamp) => {
                                        const entry = data.dates[timestamp]
                                        const dateRange = formatDateRange(timestamp)
                                        const isShiny = entry.type === "shiny"
                                        const isCurrent = isCurrentPool(timestamp)
                                        const relativeTime = getRelativeTimeString(timestamp)
                                        const statusClass = getPoolStatusClass(timestamp)

                                        return (
                                            <div key={timestamp} className="relative pl-10">
                                                {/* Timeline dot */}
                                                <div
                                                    className={cn(
                                                        "absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-2",
                                                        isShiny
                                                            ? "bg-amber-100 border-amber-300 dark:bg-amber-950 dark:border-amber-700"
                                                            : "bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600",
                                                        isCurrent && "ring-2 ring-offset-2 ring-green-500 dark:ring-offset-slate-950",
                                                    )}
                                                >
                                                    {isShiny ? (
                                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-slate-500" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div
                                                    className={cn(
                                                        "rounded-lg border p-4",
                                                        isShiny
                                                            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30"
                                                            : "bg-card",
                                                        isCurrent && "border-green-200 dark:border-green-800/30",
                                                    )}
                                                >
                                                    {/* Header with type badge */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Badge
                                                            variant={isShiny ? "default" : "secondary"}
                                                            className={isShiny ? "bg-amber-500" : ""}
                                                        >
                                                            {isShiny && <Sparkles className="h-3 w-3 mr-1" />}
                                                            {isShiny ? "Shiny" : "Normal"}
                                                        </Badge>

                                                        {isCurrent && (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30"
                                                            >
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Relative time */}
                                                    <div className="flex items-center text-sm mb-2">
                                                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                        <span className={statusClass}>{relativeTime}</span>
                                                    </div>

                                                    {/* Date range */}
                                                    <div className="flex items-center text-sm mb-2">
                                                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                        <span>
                                                            {dateRange.start} - {dateRange.end}
                                                        </span>
                                                    </div>

                                                    {/* Region */}
                                                    <div className="flex items-center text-sm mb-2">
                                                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                        <div className="flex items-center gap-2">
                                                            <span>Region:</span>
                                                            <div className="flex items-center">
                                                                <span className={cn("w-3 h-3 rounded-full mr-1.5", getRegionColor(entry.region))} />
                                                                <span>{entry.region}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tracker (only for shiny) */}
                                                    {isShiny && entry.tracker && (
                                                        <div className="flex items-center text-sm">
                                                            <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                                                            <div className="flex items-center gap-2">
                                                                <span>Tracker:</span>
                                                                <span className="font-medium">{entry.tracker}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
