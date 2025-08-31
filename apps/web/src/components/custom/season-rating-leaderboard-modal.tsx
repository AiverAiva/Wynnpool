"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Crown, Trophy, Medal, Award, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { ScrollArea } from "../ui/scroll-area"
import Link from "next/link"

interface GuildRanking {
    rank: number
    guild_uuid: string
    guild_name: string
    rating: number
}

interface LeaderboardData {
    season: number
    ranking: GuildRanking[]
}

interface SeasonRatingLeaderboardModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SeasonRatingLeaderboardModal({ open, onOpenChange }: SeasonRatingLeaderboardModalProps) {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentSeason, setCurrentSeason] = useState<number>(26) // Default fallback
    const [selectedSeason, setSelectedSeason] = useState<number | "current">("current")
    const [jumpToSeason, setJumpToSeason] = useState<string>("")

    const fetchCurrentSeason = async () => {
        try {
            const response = await fetch(api("/guild/current-season"))
            if (response.ok) {
                const data = await response.json()
                setCurrentSeason(data.currentSeason)
            }
        } catch (err) {
            console.error("Failed to fetch current season:", err)
        }
    }

    const fetchLeaderboard = async (season: string | number) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(api(`/leaderboard/season-rating/${season}`))
            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
            }
            const data = await response.json()
            setLeaderboardData(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch leaderboard")
            console.error("Leaderboard fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchCurrentSeason()
            fetchLeaderboard("current")
        }
    }, [open])

    const handleSeasonChange = (season: number | "current") => {
        setSelectedSeason(season)
        fetchLeaderboard(season)
    }

    const handlePreviousSeason = () => {
        if (selectedSeason === "current") {
            handleSeasonChange(currentSeason - 1)
        } else if (typeof selectedSeason === "number" && selectedSeason > 0) {
            handleSeasonChange(selectedSeason - 1)
        }
    }

    const handleNextSeason = () => {
        if (typeof selectedSeason === "number") {
            if (selectedSeason < currentSeason - 1) {
                handleSeasonChange(selectedSeason + 1)
            } else if (selectedSeason === currentSeason - 1) {
                handleSeasonChange("current")
            }
        }
    }

    const canGoPrevious = () => {
        if (selectedSeason === "current") return true
        return typeof selectedSeason === "number" && selectedSeason > 0
    }

    const canGoNext = () => {
        if (selectedSeason === "current") return false
        return typeof selectedSeason === "number" && selectedSeason < currentSeason
    }

    const getDisplaySeason = () => {
        if (selectedSeason === "current") return `Season ${currentSeason} (Current)`
        return `Season ${selectedSeason}`
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-5 h-5 text-yellow-500" />
            case 2:
                return <Trophy className="w-5 h-5 text-gray-400" />
            case 3:
                return <Medal className="w-5 h-5 text-amber-600" />
            default:
                return <Award className="w-5 h-5 text-muted-foreground" />
        }
    }

    const formatRating = (rating: number) => {
        return rating.toLocaleString()
    }

    const getRatingDifference = (currentRank: number, currentRating: number) => {
        if (!leaderboardData || currentRank === 1) return null

        const previousGuild = leaderboardData.ranking.find((guild) => guild.rank === currentRank - 1)
        if (!previousGuild) return null

        const difference = currentRating - previousGuild.rating
        return difference
    }

    const handleJumpToSeason = () => {
        const seasonNum = Number.parseInt(jumpToSeason)
        if (!isNaN(seasonNum) && seasonNum >= 0 && seasonNum < currentSeason) {
            handleSeasonChange(seasonNum)
            setJumpToSeason("")
        }
    }

    const handleJumpKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleJumpToSeason()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-primary" />
                        Season Rating Leaderboard
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousSeason}
                            disabled={!canGoPrevious() || loading}
                            className="flex items-center gap-1 bg-transparent"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>

                        <div className="text-center">
                            <p className="font-semibold text-lg">{getDisplaySeason()}</p>
                            <p className="text-xs text-muted-foreground">Navigate between seasons 1-{currentSeason}</p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextSeason}
                            disabled={!canGoNext() || loading}
                            className="flex items-center gap-1 bg-transparent"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 justify-center bg-muted/30 rounded-lg p-3">
                        <Button
                            variant={selectedSeason === "current" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSeasonChange("current")}
                            disabled={loading}
                        >
                            Current
                        </Button>
                        <div className="flex items-center gap-2">
                            {/* <span className="text-sm text-muted-foreground">Jump to:</span> */}
                            <Input
                                type="number"
                                placeholder="Jump to"
                                value={jumpToSeason}
                                onChange={(e) => setJumpToSeason(e.target.value)}
                                onKeyPress={handleJumpKeyPress}
                                className="w-24 h-8 text-center"
                                min="0"
                                max={currentSeason - 1}
                                disabled={loading}
                            />
                            <Button
                                size="sm"
                                onClick={handleJumpToSeason}
                                disabled={
                                    loading ||
                                    !jumpToSeason ||
                                    Number.parseInt(jumpToSeason) < 0 ||
                                    Number.parseInt(jumpToSeason) >= currentSeason
                                }
                            >
                                Go
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-[500px]">
                        {loading && (
                            <div className="flex-1 overflow-auto space-y-2">
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <Card key={index} className="p-4 border-border/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                                                    <div className="w-8 h-6 bg-muted rounded animate-pulse" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                                                    <div className="w-24 h-3 bg-muted/70 rounded animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <div className="w-16 h-6 bg-muted rounded animate-pulse ml-auto" />
                                                <div className="w-12 h-3 bg-muted/70 rounded animate-pulse ml-auto" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {error && (
                            <Card className="p-4 border-destructive/20 bg-destructive/5">
                                <p className="text-destructive text-sm">{error}</p>
                            </Card>
                        )}

                        {leaderboardData && !loading && (
                            <div className="flex-1 overflow-auto space-y-2">
                                {leaderboardData.ranking.map((guild) => (
                                    <Card
                                        key={guild.guild_uuid}
                                        className={`p-4 transition-all duration-200 group hover:shadow-md ${guild.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border/50 hover:border-primary/20"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(guild.rank)}
                                                    <span className="font-bold text-lg">#{guild.rank}</span>
                                                </div>
                                                <div className="cursor-pointer group-hover:scale-105 transition-all duration-300">
                                                    <Link href={`/stats/guild/${guild.guild_name}`} prefetch={false} className="flex items-center">
                                                        <h3 className="font-semibold text-foreground">{guild.guild_name}</h3>
                                                        <ExternalLink className='ml-2 hidden opacity-0 group-hover:inline-block group-hover:opacity-100 h-4 w-4 text-muted-foreground transition-all duration-500' />
                                                    </Link>
                                                    {/* <p className="text-xs text-muted-foreground">{guild.guild_uuid}</p> */}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-primary">{formatRating(guild.rating)}</p>
                                                {getRatingDifference(guild.rank, guild.rating) !== null && (
                                                    <p className="text-xs text-red-500 font-medium">
                                                        {getRatingDifference(guild.rank, guild.rating)! > 0 ? "+" : ""}
                                                        {getRatingDifference(guild.rank, guild.rating)?.toLocaleString()} from #{guild.rank - 1}
                                                    </p>
                                                )}
                                                {guild.rank === 1 && <p className="text-xs text-muted-foreground">Top Guild</p>}
                                                {guild.rank !== 1 && getRatingDifference(guild.rank, guild.rating) === null && (
                                                    <p className="text-xs text-muted-foreground">Rating</p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
