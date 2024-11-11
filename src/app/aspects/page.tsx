'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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

export default function AspectPool() {
  const [lootData, setLootData] = useState<LootData | null>(null)
  const [aspectData, setAspectData] = useState<AspectData | null>(null)
  const [countdown, setCountdown] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>('Archer')
  const [sortBy, setSortBy] = useState<'rarity' | 'raid'>('rarity')

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetch('/api/aspects-pool').then(response => response.json()),
      fetch('/api/aspects-data').then(response => response.json())
    ])
      .then(([lootData, aspectData]) => {
        setLootData(lootData)
        setAspectData(aspectData)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (lootData) {
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const nextUpdate = lootData.Timestamp + 7 * 86400; // 7 days in seconds
        const timeLeft = nextUpdate - now;

        if (timeLeft <= 0) {
          setCountdown('Data update imminent!');
        } else {
          const days = Math.floor(timeLeft / 86400);
          const hours = Math.floor((timeLeft % 86400) / 3600);
          const minutes = Math.floor((timeLeft % 3600) / 60);
          const seconds = timeLeft % 60;
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lootData]);

  if (isLoading) return <div>Loading...</div>
  if (!lootData || !aspectData) return <div>Error loading data. Please try again later.</div>

  const rarityOrder: LootCategory[] = ['Mythic', 'Fabled', 'Legendary']
  const raidOrder: LootSection[] = ['TNA', 'TCC', 'NOL', 'NOTG']

  const availableAspects = Object.entries(lootData.Loot).reduce((acc, [section, categories]) => {
    Object.entries(categories).forEach(([rarity, aspects]) => {
      aspects.forEach((aspect) => {
        const matchedAspect = aspectData[selectedClass]?.find((a) => a.name === aspect)
        if (matchedAspect) {
          acc.push({
            name: aspect,
            section: section as LootSection,
            rarity: rarity as LootCategory,
            icon: lootData.Icon[aspect],
            description: matchedAspect.description,
          })
        }
      })
    })
    return acc
  }, [] as { name: string; section: LootSection; rarity: LootCategory; icon: string; description?: string }[])

  // Sort the list based on the selected sort criteria
  availableAspects.sort((a, b) => {
    if (sortBy === 'rarity') {
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    } else {
      return raidOrder.indexOf(a.section) - raidOrder.indexOf(b.section)
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-4">
        {lootData && aspectData && (
          <>
            <h1 className="text-4xl font-bold mb-4">Aspect Pool</h1>
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
                            <TooltipProvider delayDuration={100}>
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
          </>
        )}
        <div>
          <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'rarity' | 'raid')} className="mt-4">
            <TabsList>
              <TabsTrigger value="rarity">Sort by Rarity</TabsTrigger>
              <TabsTrigger value="raid">Sort by Raid</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th></th>
                  <th className="px-4 py-2">
                    <Tabs value={selectedClass} onValueChange={setSelectedClass}>
                      <TabsList>
                        {Object.keys(aspectData).map((className) => (
                          <TabsTrigger key={className} value={className}>
                            {className}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    
                    {/* <select
                      id="class-select"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="p-2 border rounded w-full font-thin text-center"
                    >
                      {Object.keys(aspectData).map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select> */}
                  </th>
                  <th className="px-4 py-2">Raid</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableAspects.map(({ name, section, rarity, icon, description }) => (
                  <tr key={`${name}-${section}`}>
                    <td className="px-4 py-2">
                      <Image unoptimized src={`/icons/aspects/${icon}`} alt={name} width={50} height={50} />
                    </td>
                    <td className="px-4 py-1">
                      <Badge
                        className={`ml-2  mt-2 ${rarity === 'Fabled' ? 'bg-rose-500' :
                            rarity === 'Legendary' ? 'bg-cyan-400' :
                              'bg-fuchsia-700'
                          } text-white text-sm font-thin`}
                      >
                        {name}
                      </Badge>
                      <br />
                      <p className="px-4 py-1 text-sm">{description}</p>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {section}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}