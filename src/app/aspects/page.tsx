'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import Image from 'next/image'
import Countdown from '@/components/custom/countdown'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AspectData } from '@/types/aspectType'

type LootCategory = 'Mythic' | 'Fabled' | 'Legendary'
type LootSection = 'TNA' | 'TCC' | 'NOL' | 'NOTG'

interface LootData {
  Loot: Record<LootSection, Record<LootCategory, string[]>>
  Icon: Record<string, string>
  Timestamp: number
}

export default function AspectPool() {
  const [lootData, setLootData] = useState<LootData | null>(null)
  const [aspectData, setAspectData] = useState<AspectData | null>({})
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>('Archer')
  const [sortBy, setSortBy] = useState<'rarity' | 'raid'>('rarity')
  const [openTooltips, setOpenTooltips] = useState<{ [key: string]: boolean }>({});

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
      const nextUpdate = lootData.Timestamp + 7 * 86400; // 7 days in seconds
      setCountdown(nextUpdate);
    }
  }, [lootData]);

  const aspectToClassName = Object.entries(aspectData!).reduce((acc, [className, aspects]) => {
    aspects.forEach((aspect) => {
      acc[aspect.name] = className;
    });
    return acc;
  }, {} as { [aspectName: string]: string });

  if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
  if (!lootData || !aspectData) return <div>Error loading data. Please try again later.</div>

  const rarityOrder: LootCategory[] = ['Mythic', 'Fabled', 'Legendary']
  const raidOrder: LootSection[] = ['TNA', 'TCC', 'NOL', 'NOTG']

  const availableAspects = Object.entries(lootData.Loot).reduce((acc, [section, categories]) => {
    const aspectNamesSet = new Set(acc.map(aspect => aspect.name)); // Create a Set from existing aspect names

    Object.entries(categories).forEach(([rarity, aspects]) => {
      aspects.forEach((aspect) => {
        const className = aspectToClassName[aspect];
        const matchedAspect = aspectData[selectedClass]?.find((a) => a.name === aspect);
        if (matchedAspect && !aspectNamesSet.has(aspect)) { // Check if the aspect is already added
          aspectNamesSet.add(aspect); // Mark the aspect as added
          acc.push({
            name: aspect,
            section: section as LootSection,
            rarity: rarity as LootCategory,
            description: matchedAspect.description,
            className: className,
          });
        }
      });
    });

    return acc;
  }, [] as { name: string; section: LootSection; rarity: LootCategory; description?: string; className: string }[]);

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
      <main className="container mx-auto p-6 max-w-screen-lg duration-150">
        {lootData && aspectData && (
          <>
            <h1 className="text-4xl font-bold mb-4">Aspect Pool</h1>
            <Card className="mb-4 relative">
              <CardHeader className="flex justify-center items-center">
                <CardTitle>Next Update In</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center">
                <Countdown targetTimestamp={countdown} endText="Data outdated, waiting for update..." />
              </CardContent>
              <Link href="/aspects/history" legacyBehavior passHref>
                <Button className="absolute top-4 right-4 rounded-full">
                  History
                </Button>
              </Link>
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
                            <TooltipProvider delayDuration={50}>
                              {items.map((item) => {
                                const aspectInfo = Object.values(aspectData!).flat().find(aspect => aspect.name === item);
                                const className = aspectToClassName[item];

                                return (
                                  <Tooltip key={item} open={openTooltips[item]} onOpenChange={(isOpen) => setOpenTooltips({ ...openTooltips, [item]: isOpen })}>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {
                                        setOpenTooltips((prevState) => ({
                                          ...prevState,
                                          [item]: !prevState[item]
                                        }));
                                      }}>
                                        <Image
                                          unoptimized
                                          src={`/icons/aspects/aspect_${className.toLowerCase()}.${aspectInfo?.rarity === 'Mythic' ? 'gif' : 'png'}`}
                                          alt={item}
                                          width={32}
                                          height={32}
                                        />
                                        <span>{item}</span>
                                      </div>
                                    </TooltipTrigger>
                                    {aspectInfo && (
                                      <TooltipContent className="w-fit p-4">
                                        <h4 className="font-bold">{aspectInfo.name}</h4>
                                        <p className="text-sm">{aspectInfo.description}</p>
                                        <ul className="text-sm">
                                          {Object.entries(aspectInfo.tiers).map(([tier, effect]) => (
                                            <li key={tier} className='mt-1'><Badge>{tier}</Badge> {effect}</li>
                                          ))}
                                        </ul>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                );
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
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <th className='hidden md:block'></th>
                  <th className="py-2">
                    <Tabs value={selectedClass} onValueChange={setSelectedClass}>
                      <TabsList>
                        {Object.keys(aspectData!).map((className) => (
                          <TabsTrigger key={className} value={className}>
                            {className}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </th>
                  <th className="px-4 py-2">Raid</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {availableAspects.map(({ name, section, rarity, description, className }) => (
                  <tr key={`${name}-${section}`}>
                    <td className="px-4 py-2 hidden md:block">
                      <Image
                        unoptimized
                        src={`/icons/aspects/aspect_${className.toLowerCase()}.${rarity === 'Mythic' ? 'gif' : 'png'}`}
                        alt={name}
                        width={50}
                        height={50}
                      />
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