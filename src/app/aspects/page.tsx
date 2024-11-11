'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Navbar } from "@/components/ui/navbar"
import Image from 'next/image'

type LootCategory = 'Mythic' | 'Fabled' | 'Legendary'
type LootSection = 'TNA' | 'TCC' | 'NOL' | 'NOTG'

interface AspectTier {
  [key: string]: string
}

interface Aspect {
  name: string
  id: string
  rarity: string
  description: string
  tiers: AspectTier
}

interface AspectData {
  [className: string]: Aspect[]
}

interface LootData {
  Loot: Record<LootSection, Record<LootCategory, string[]>>
  Icon: Record<string, string>
  Timestamp: number
}

export default function GameLootPage() {
  const [lootData, setLootData] = useState<LootData | null>(null)
  const [aspectData, setAspectData] = useState<AspectData | null>(null)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    fetch('https://nori.fish/api/aspects')
      .then(response => response.json())
      .then(data => setLootData(data))

    fetch('/api/aspects-data')
      .then(response => response.json())
      .then(data => setAspectData(data))
      
  }, [])

  useEffect(() => {
    if (lootData) {
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        const timeLeft = lootData.Timestamp - now
        if (timeLeft <= 0) {
          setCountdown('Data update imminent!')
        } else {
          const days = Math.floor(timeLeft / 86400)
          const hours = Math.floor((timeLeft % 86400) / 3600)
          const minutes = Math.floor((timeLeft % 3600) / 60)
          const seconds = timeLeft % 60
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lootData])

  if (!lootData || !aspectData) return <div>Loading...</div>
  if (aspectData) console.log(aspectData)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">Game Loot</h1>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Next Update In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{countdown}</p>
          </CardContent>
        </Card>
        <Tabs defaultValue="TNA">
          <TabsList className="grid w-full grid-cols-4">
            {Object.keys(lootData.Loot).map((section) => (
              <TabsTrigger key={section} value={section}>{section}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(lootData.Loot).map(([section, categories]) => (
            <TabsContent key={section} value={section}>
              <Card>
                <CardHeader>
                  <CardTitle>{section} Loot</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(categories).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <h3 className="text-xl font-semibold mb-2">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <TooltipProvider>
                          {items.map((item) => {
                            const aspectInfo = Object.values(aspectData).flat().find(aspect => aspect.name === item)
                            return (
                              <Tooltip key={item}>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center space-x-2 cursor-pointer">
                                    <Image
                                      unoptimized
                                      src={`/icons/aspects/${lootData.Icon[item]}`}
                                      alt={item}
                                      width={32}
                                      height={32}
                                    />
                                    <span>{item}</span>
                                  </div>
                                </TooltipTrigger>
                                {aspectInfo && (
                                  <TooltipContent className="w-64">
                                    <h4 className="font-bold">{aspectInfo.name}</h4>
                                    <p className="text-sm">{aspectInfo.description}</p>
                                    <h5 className="font-semibold mt-2">Tiers:</h5>
                                    <ul className="text-sm">
                                      {Object.entries(aspectInfo.tiers).map(([tier, effect]) => (
                                        <li key={tier}>{tier}: {effect}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            )
                          })}
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}