'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from 'next/image'
import { Skeleton } from "@/components/ui/skeleton"

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
    const [countdown, setCountdown] = useState('')

    useEffect(() => {
        fetch('/api/lootrun-pool')
            .then(response => response.json())
            .then(data => setLootData(data))
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
    }, [lootData])

    if (!lootData) return <div className="flex justify-center items-center h-screen"><Skeleton className="w-[300px] h-[20px]" /></div>

    return (
        <div>
            <div className="container mx-auto p-4 max-w-screen-lg">
                <h1 className="text-4xl font-bold mb-4">Loot Run Pool</h1>
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Next Update In</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{countdown}</p>
                    </CardContent>
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
                                                        <Tooltip key={item}>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center space-x-2">
                                                                    <Image
                                                                        unoptimized
                                                                        src={lootData.Icon[item].startsWith('http')
                                                                            ? lootData.Icon[item]
                                                                            : `https://nori.fish/resources/${lootData.Icon[item]}`}
                                                                        alt={item}
                                                                        width={32}
                                                                        height={32}
                                                                    />
                                                                    <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{item}</Badge>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{item}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )) : (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center space-x-2">
                                                                    <Image
                                                                        unoptimized
                                                                        src={lootData.Icon[items.Item].startsWith('http')
                                                                            ? lootData.Icon[items.Item]
                                                                            : `https://nori.fish/resources/${lootData.Icon[items.Item]}`}
                                                                        alt={items.Item}
                                                                        width={32}
                                                                        height={32}
                                                                    />
                                                                    <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{items.Item}</Badge>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{items.Item}</p>
                                                                <p>Tracker: {items.Tracker}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
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
            </div>
        </div>
    )
}