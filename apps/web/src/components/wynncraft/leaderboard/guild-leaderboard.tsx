"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Crown, Users, MapPin, Swords, Calendar, UserStar } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { calculateGuildXPRequired } from "@/lib/guildUtils"
import { Progress } from "@/components/ui/progress"
import Banner from "@/components/custom/banner"
import { Guild } from "@/types/guildType"

interface GuildLeaderboardProps {
    data: any
    title?: string
}

const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toLocaleString()
}

const getBannerColor = (base: string): string => {
    const colorMap: Record<string, string> = {
        YELLOW: "bg-yellow-500",
        LIGHT_BLUE: "bg-blue-400",
        BLACK: "bg-gray-900",
        WHITE: "bg-gray-100",
        RED: "bg-red-500",
        GREEN: "bg-green-500",
        BLUE: "bg-blue-500",
        PURPLE: "bg-purple-500",
        ORANGE: "bg-orange-500",
        PINK: "bg-pink-500",
        LIME: "bg-lime-500",
        CYAN: "bg-cyan-500",
        GRAY: "bg-gray-500",
        SILVER: "bg-gray-300",
        BROWN: "bg-amber-700",
        MAGENTA: "bg-fuchsia-500",
    }
    return colorMap[base] || "bg-gray-400"
}

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Crown className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Crown className="w-5 h-5 text-amber-600" />
    return null
}

export default function GuildLeaderboard({ data, title = "Guild Leaderboard" }: GuildLeaderboardProps) {
    // Accept either an array of guilds or an object keyed by rank ("1", "2", ...)
    // If `data` is an array we render it in order. If it's an object we use
    // Object.entries so the raw input you posted can be used directly.
    if (!data) return (
        <Card className="h-[50vh] w-full flex items-center justify-center">
            <Spinner className="w-8 h-8 md:w-16 md:h-16" />
        </Card>
    )

    const entries: Array<[string, Guild]> = Array.isArray(data)
        ? data.map((g: any, i: number) => [String(g.rank ?? i + 1), g])
        : Object.entries(data) as Array<[string, Guild]>


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Swords className="w-5 h-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {entries.map(([rankKey, guild]) => (
                        <div
                            key={guild.uuid ?? rankKey}
                            className="rounded-lg border bg-card hover:bg-accent/50 transition-colors overflow-hidden"
                        >
                            <div className="flex items-center gap-4 p-4">
                                {/* Rank */}
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted font-bold text-lg">
                                    {getRankIcon(Number(rankKey)) || rankKey}
                                </div>

                                {/* Guild Banner/Avatar */}
                                {/* <Avatar className="w-12 h-12">
                <AvatarFallback className={`${getBannerColor(guild.banner?.base || "GRAY")} text-white font-bold`}>
                  {guild.prefix}
                </AvatarFallback>
              </Avatar> */} 
              <div>
                                {guild.banner && (<Banner className='rounded-sm' {...guild.banner} size={40}/>)}
              </div>
                                {/* Guild Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-lg truncate">{guild.name}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {guild.prefix}
                                        </Badge>
                                        {/* {guild.banner?.tier && (
                    <Badge variant="outline" className="text-xs">
                      Tier {guild.banner.tier}
                    </Badge>
                  )} */}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {guild.level && (
                                            <span className="flex items-center gap-1">
                                                <Crown className="w-3 h-3" />
                                                Level {guild.level}
                                            </span>
                                        )}
                                        {guild.members && (
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {guild.members} members
                                            </span>
                                        )}
                                        {guild.territories !== undefined && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {guild.territories} territories
                                            </span>
                                        )}
                                        {guild.wars && (
                                            <span className="flex items-center gap-1">
                                                <Swords className="w-3 h-3" />
                                                {formatNumber(guild.wars)} wars
                                            </span>
                                        )}
                                        {guild.averageOnline && (
                                            <span className="flex items-center gap-1">
                                                <UserStar className="w-3 h-3" />
                                                {formatNumber(guild.averageOnline)} Avg. Online
                                            </span>
                                        )}
                                        {/* {guild.leaveCount && (
                                            <span className="flex items-center gap-1">
                                                <UserStar className="w-3 h-3" />
                                                {formatNumber(guild.leaveCount)} Member Left
                                            </span>
                                        )} */}
                                    </div>

                                </div>

                                {/* Score/Stats */}
                                <div className="text-right">
                                    {guild.metaScore && (
                                        <div className="font-bold text-lg text-primary">{formatNumber(guild.metaScore)} SR  </div>
                                    )}
                                    {guild.metadata?.completions && (
                                        <div className="text-xs text-muted-foreground">
                                            {formatNumber(guild.metadata.completions)} completions
                                        </div>
                                    )}
                                    {guild.created && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            Est. {new Date(guild.created).getFullYear()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {guild.xpPercent &&
                                // <div className="text-sm text-muted-foreground">{guild.xp/calculateGuildXPRequired(guild.level)} XP</div>
                                <Progress value={guild.xpPercent} className='h-1 rounded-none w-full' />
                                // guild.xp / calculateGuildXPRequired(guild.level) * 100
                            }
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
