"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Clock, Plus, Minus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Item, ItemChangelog } from "@/types/itemType"
import { ItemDisplay } from "../item-display"
import ModifiedItemDisplay from "../ModifiedItemDisplay"

interface ItemHistoryProps {
    changelog: ItemChangelog[]
    maxEntries?: number
}

export default function ItemHistory({ changelog, maxEntries = 5 }: ItemHistoryProps) {
    const [showAll, setShowAll] = useState(false)

    // Sort changelog by timestamp (newest first)
    const sortedChangelog = [...changelog].sort((a, b) => b.timestamp - a.timestamp)

    // Limit entries if not showing all
    const displayedChangelog = showAll ? sortedChangelog : sortedChangelog.slice(0, maxEntries)

    // Format timestamp to readable date
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    // Format timestamp to relative time (e.g., "2 days ago")
    const getRelativeTime = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp * 1000

        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const months = Math.floor(days / 30)
        const years = Math.floor(days / 365)

        if (years > 0) return `${years} ${years === 1 ? "year" : "years"} ago`
        if (months > 0) return `${months} ${months === 1 ? "month" : "months"} ago`
        if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`
        if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
        if (minutes > 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
        return `${seconds} ${seconds === 1 ? "second" : "seconds"} ago`
    }

    // Get status icon and color
    const getStatusInfo = (status: string) => {
        switch (status) {
            case "add":
                return { icon: <Plus className="h-4 w-4" />, color: "bg-green-500", text: "Added" }
            case "remove":
                return { icon: <Minus className="h-4 w-4" />, color: "bg-red-500", text: "Removed" }
            case "modify":
                return { icon: <RefreshCw className="h-4 w-4" />, color: "bg-amber-500", text: "Modified" }
            default:
                return { icon: <Clock className="h-4 w-4" />, color: "bg-blue-500", text: status }
        }
    }

    // const item = changelog[0]
    // const isCombatItem = item.type == 'weapon' || item.type === 'armour' || item.type === 'accessory' || item.type === 'tome' || item.type === 'charm'

    // if (!isCombatItem) return
    return (
        <div className="flex w-full justify-end">
            <Card className="w-full max-w-[650px]">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Item History</span>
                        <Badge variant="outline" className="font-normal">
                            {sortedChangelog.length} {sortedChangelog.length === 1 ? "change" : "changes"}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {displayedChangelog.length > 0 ? (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-border" />

                            {/* Changelog entries */}
                            <div className="space-y-4">
                                {displayedChangelog.map((entry, index) => {
                                    const { icon, color, text } = getStatusInfo(entry.status)

                                    return (
                                        <div key={index} className="relative pl-10">
                                            {/* Timeline dot */}
                                            <div
                                                className={cn(
                                                    "absolute left-0 top-1.5 h-7 w-7 rounded-full flex items-center justify-center",
                                                    color,
                                                )}
                                            >
                                                {icon}
                                            </div>

                                            <div className="flex flex-col">
                                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-3">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span title={formatDate(entry.timestamp)}>{getRelativeTime(entry.timestamp)}</span>
                                                </div>
                                                {entry.status === "modify" && (
                                                    // <Link
                                                    //   href={`/changelog/${entry.timestamp}/item/${entry._id}`}
                                                    //   className="text-sm text-primary hover:underline inline-block mt-1"
                                                    // >

                                                    // @ts-ignore
                                                    <ModifiedItemDisplay modifiedItem={entry} />
                                                    // </Link>
                                                )}
                                                {entry.status === "add" || entry.status === "remove" && (
                                                    // <Link
                                                    //   href={`/changelog/${entry.timestamp}/item/${entry._id}`}
                                                    //   className="text-sm text-primary hover:underline inline-block mt-1"
                                                    // >

                                                    // @ts-ignore
                                                    <ItemDisplay item={entry} />
                                                    // </Link>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">No history available for this item</div>
                    )}

                    {/* Show more/less button */}
                    {sortedChangelog.length > maxEntries && (
                        <div className="pt-2">
                            <Separator className="my-2" />
                            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowAll(!showAll)}>
                                {showAll ? (
                                    <span className="flex items-center">
                                        Show less <ChevronUp className="ml-1 h-4 w-4" />
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Show all {sortedChangelog.length} changes <ChevronDown className="ml-1 h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

