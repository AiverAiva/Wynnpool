"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Leaderboard from "@/components/wynncraft/leaderboard/leaderboard"
import GuildLeaderboard from "@/components/wynncraft/leaderboard/guild-leaderboard"
import api from "@/lib/api"

const gameStats = {
  "Guild Stats": ["guildLevel", "guildTerritories", "guildWars", "guildAverageOnline"],
  "Global Levels": ["professionsGlobalLevel", "combatGlobalLevel", "totalGlobalLevel", "globalPlayerContent"],
  "Solo Levels": ["combatSoloLevel", "professionsSoloLevel", "totalSoloLevel", "playerContent"],
  Professions: [
    "woodcuttingLevel",
    "miningLevel",
    "fishingLevel",
    "farmingLevel",
    "alchemismLevel",
    "armouringLevel",
    "cookingLevel",
    "jewelingLevel",
    "scribingLevel",
    "tailoringLevel",
    "weaponsmithingLevel",
    "woodworkingLevel",
  ],
  "Boss Completions": [
    "grootslangCompletion",
    "colossusCompletion",
    "orphionCompletion",
    "namelessCompletion",
    "warsCompletion",
  ],
  "Game Modes": [
    "craftsmanContent",
    "huicContent",
    "ironmanContent",
    "ultimateIronmanContent",
    "hardcoreLegacyLevel",
    "hardcoreContent",
    "huichContent",
    "hicContent",
    "hichContent",
    "huntedContent",
  ],
  "Guild Season Rating": ["colossusSrGuilds", "namelessSrGuilds", "grootslangSrGuilds", "orphionSrGuilds"],
  "Player Season Rating": ["grootslangSrPlayers", "namelessSrPlayers", "colossusSrPlayers", "orphionSrPlayers"],
}

const formatStatName = (stat: string) => {
  return stat
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/Sr/g, "Season Rating")
    .replace(/Level$/, " Level")
    .replace(/Content$/, " Content")
    .replace(/Completion$/, " Completion")
    .replace(/Guilds$/, " (Guilds)")
    .replace(/Players$/, " (Players)")
}

export default function GameStatsMenu() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Guild Stats")
  const [selectedStat, setSelectedStat] = useState<string | null>(null)

  const currentStats = gameStats[selectedCategory as keyof typeof gameStats] || []

  const isGuildStat = selectedCategory === "Guild Stats" || selectedCategory === "Guild Season Rating"
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedStat) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

  // Fetch any selected leaderboard (guild or player)

    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setData(null)
      setError(null)
      try {
        const res = await fetch(api(`/leaderboard/${encodeURIComponent(selectedStat)}?resultLimit=100`), { signal: ac.signal })
        if (!res.ok) throw new Error(`Request failed ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        setError(e.message || 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    })()

    return () => ac.abort()
  }, [selectedStat, isGuildStat])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Gaming Leaderboards</h1>
          <p className="text-muted-foreground">Select a category and statistic to view the leaderboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Category Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Choose a leaderboard category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.keys(gameStats).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCategory(category)
                    setSelectedStat(null) // Reset selected stat when category changes
                  }}
                >
                  {category}
                  <Badge variant="secondary" className="ml-auto">
                    {gameStats[category as keyof typeof gameStats].length}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Stats Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedCategory}</CardTitle>
              <CardDescription>Select a specific leaderboard to display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentStats.map((stat) => (
                <Button
                  key={stat}
                  variant={selectedStat === stat ? "default" : "outline"}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedStat(stat)}
                >
                  {formatStatName(stat)}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* {selectedStat && (
          <div className="mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{formatStatName(selectedStat)}</h3>
                    <p className="text-sm text-muted-foreground">Leaderboard Key: {selectedStat}</p>
                  </div>
                  <Badge variant="default">{selectedCategory}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )} */}

        {selectedStat ? (
          isGuildStat ? (
            <GuildLeaderboard data={data} title={formatStatName(selectedStat)} />
          ) : loading ? (
            <Card>
              <CardContent className="p-8 text-center">Loading leaderboard…</CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center text-destructive">{error}</CardContent>
            </Card>
          ) : (
            <Leaderboard data={data} />
          )
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">Select a Leaderboard</h3>
                <p>Choose a category and statistic above to view the leaderboard</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
