"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Trophy, Medal, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface PlayerData {
  metaScore: number
  name: string
  uuid: string
  score: number
  previousRanking: number
  metadata: {
    completions?: number
    gambits?: number
    playtime?: number
  }
  rank: string
  rankBadge: string
  supportRank: string
  legacyRankColour: {
    sub: string
    main: string
  }
}

interface LeaderboardData {
  [key: string]: PlayerData
}

const getRankIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-500" />
    case 2:
      return <Trophy className="w-6 h-6 text-gray-400" />
    case 3:
      return <Medal className="w-6 h-6 text-amber-500" />
    default:
      return <span className="text-xl font-bold text-foreground">#{position}</span>
  }
}

const getRankingChange = (current: number, previous: number) => {
  const change = previous - current
  if (change > 0) {
    return <span className="text-green-500 text-sm font-semibold ml-2">+{change}</span>
  } else if (change < 0) {
    return <span className="text-red-500 text-sm font-semibold ml-2">{change}</span>
  }
  return null
}

const getPlayerAvatar = (uuid: string) => {
  return `https://mc-heads.net/avatar/${uuid}/64`
}

const formatNumber = (num: number) => {
  if (!num) return null
  // if (num >= 1000000) {
  //   return (num / 1000000).toFixed(1) + "M"
  // } else if (num >= 1000) {
  //   return (num / 1000).toFixed(1) + "K"
  // }
  return num.toLocaleString()
}

interface Props {
  data: Record<string, PlayerData>
  title?: string
}

export default function Component({ data, title }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [playersPerPage, setPlayersPerPage] = useState(10)
  
  // If `data` prop is provided, prefer it; otherwise use local mock `gameData`.
  if (!data) return null
  if (!title) title = "Player Leaderbord"

  const players = Object.entries(data).map(([position, data]) => ({
    position: Number.parseInt(position),
    ...data,
  }))

  // const topThree = players.slice(0, 3)
  const remainingPlayers = players
  // .slice(3)

  // Pagination logic
  const totalPages = Math.ceil(remainingPlayers.length / playersPerPage)
  const startIndex = (currentPage - 1) * playersPerPage
  const endIndex = startIndex + playersPerPage
  const currentPlayers = remainingPlayers.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="min-h-screen bg-background text-foreground max-w-screen-lg">
      <div className="mx-auto">
        {/* Header */}
        {/* <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-black text-foreground">ELITE LEADERBOARD</h1>
          </div>
          <p className="text-muted-foreground text-lg">Top performers in the game</p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
        </div> */}

        {/* Top 3 Podium */}
        {/* <div className="grid md:grid-cols-3 gap-8 mb-16">
          {topThree.map((player) => (
            <Card
              key={player.uuid}
              className={`relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:scale-[1.02] group ${player.position === 1
                ? "bg-yellow-50/50 dark:bg-yellow-950/20"
                : player.position === 2
                  ? "bg-gray-50/50 dark:bg-gray-950/20"
                  : "bg-amber-50/50 dark:bg-amber-950/20"
                }`}
            >
              <CardContent className="p-8 text-center relative z-10">
                <div className="absolute top-4 right-4 z-10">{getRankIcon(player.position)}</div>

                <div className="relative mb-6">
                  <div
                    className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-4 border-border shadow-md transition-all duration-300 hover:shadow-xl"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${player.legacyRankColour.main && player.legacyRankColour.main}`
                      e.currentTarget.style.boxShadow = `0 0 20px ${`${player.legacyRankColour.main && player.legacyRankColour.main}40`}`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)"
                      e.currentTarget.style.boxShadow = "var(--shadow)"
                    }}
                  >
                    <Image
                      src={getPlayerAvatar(player.uuid) || "/placeholder.svg"}
                      alt={`${player.name} avatar`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover pixelated"
                    />

                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-2">{player.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 capitalize">{player.supportRank}</p>

                <div className="mb-6">
                  <div className="text-3xl font-black text-primary mb-1">{formatNumber(player.metaScore)}</div>
                  <div className="text-muted-foreground text-sm">SCORE</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-muted-foreground text-xs font-semibold mb-1">COMPLETIONS</div>
                    <div className="text-foreground font-bold">{formatNumber(player.metadata.completions)}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-muted-foreground text-xs font-semibold mb-1">GAMBITS</div>
                    <div className="text-foreground font-bold">{formatNumber(player.metadata.gambits)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div> */}

        {/* Remaining Players */}
        <Card className="bg-card border border-border shadow-lg">
          <CardContent className="p-0">
            <div className="bg-muted/30 p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={playersPerPage}
                    onChange={(e) => {
                      setPlayersPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="bg-input text-foreground px-3 py-1 rounded-lg border border-border text-sm"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={15}>15 per page</option>
                    <option value={20}>20 per page</option>
                  </select>
                  <span className="text-muted-foreground text-sm">
                    Showing {startIndex + 1}-{Math.min(endIndex, remainingPlayers.length)} of {remainingPlayers.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {currentPlayers.map((player) => (
                <div key={player.uuid} className="p-6 hover:bg-muted/50 transition-all duration-200">
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="flex items-center min-w-0">
                      <div className="flex items-center flex-col justify-center">
                        {getRankIcon(player.position)}
                        {getRankingChange(player.position, player.previousRanking)}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border transition-all duration-300"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = player.legacyRankColour.main
                          e.currentTarget.style.boxShadow = `0 0 15px ${player.legacyRankColour.main}30`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <Image
                          src={getPlayerAvatar(player.uuid) || "/placeholder.svg"}
                          alt={`${player.name} avatar`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover pixelated"
                        />
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        {/* <Badge
                          className="text-xs px-2 py-1 capitalize border-0"
                          style={{
                            background: `linear-gradient(135deg, ${player.legacyRankColour.main}20, ${player.legacyRankColour.sub}20)`,
                            color: player.legacyRankColour.main,
                            }}
                            >
                            {player.supportRank}
                            </Badge> */}
                        {player.rankBadge &&
                          <img
                            src={`https://cdn.wynncraft.com/${player.rankBadge}`}
                            alt={`${player.rank} badge`}
                            className="h-4 object-contain"
                          />}
                        <h4 className="text-xl font-bold text-foreground truncate">{player.name}</h4>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-8">
                      {player.metadata.completions && (<div className="text-center">
                        <div className="text-muted-foreground text-xs mb-1">COMPLETIONS</div>
                        <div className="text-foreground font-semibold">{formatNumber(player.metadata.completions)}</div>
                      </div>)}
                      {player.metadata.gambits && (<div className="text-center">
                        <div className="text-muted-foreground text-xs mb-1">GAMBITS</div>
                        <div className="text-foreground font-semibold">{formatNumber(player.metadata.gambits)}</div>
                      </div>)}
                      {player.metadata.playtime && (<div className="text-center">
                        <div className="text-muted-foreground text-xs mb-1">PLAYTIME</div>
                        <div className="text-foreground font-semibold">{formatNumber(player.metadata.playtime)} Hours</div>
                      </div>)}
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary mb-1">{formatNumber(player.score)}</div>
                      {title.includes('Level') ? (
                        <div className="text-muted-foreground text-xs">LEVEL</div>
                      ) : (
                        <div className="text-muted-foreground text-xs">SCORE</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bg-muted/30 p-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-card border-border text-foreground hover:bg-muted"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className={
                              currentPage === pageNum
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "bg-card border-border text-foreground hover:bg-muted"
                            }
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-card border-border text-foreground hover:bg-muted"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Stats */}
        {/* <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total Players", value: players.length, icon: "👥" },
            { label: "Highest Score", value: formatNumber(players[0]?.metaScore || 0), icon: "🏆" },
            {
              label: "Total Completions",
              value: formatNumber(players.reduce((sum, p) => sum + p.metadata.completions, 0)),
              icon: "🎯",
            },
            {
              label: "Total Gambits",
              value: formatNumber(players.reduce((sum, p) => sum + p.metadata.gambits, 0)),
              icon: "⚡",
            },
          ].map((stat, index) => (
            <Card key={index} className="bg-card border border-border shadow-sm hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div> */}
      </div>
    </div>
  )
}
