'use client'

import { notFound } from 'next/navigation'
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/playerType';

async function getPlayerData(playerName: string) {
    try {
        const res = await fetch(`https://api.wynncraft.com/v3/player/${playerName}?fullResult`)
        if (!res.ok) throw new Error('Failed to fetch player data')
        return res.json()
    } catch (error) {
        console.error('Error fetching player data:', error)
        return null
    }
}

export default async function PlayerStatsPage({ params }: { params: { playerName: string } }) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (id: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const playerData: Player = await getPlayerData((await params).playerName)
    if (!playerData) {
        notFound()
    }

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <span className='text-2xl'>this page is also incompleted dont blame me, join discord if u have idea :3</span>
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <img
                            src={`/api/player-icon/${playerData.username}`}
                            alt={playerData.username}
                            className="h-20 w-20"
                            style={{ imageRendering: 'pixelated' }}
                        />

                        <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                                <img
                                    src={`https://cdn.wynncraft.com/${playerData.rankBadge}`}
                                    alt={`${playerData.rank} badge`}
                                    className="h-16 w-16 object-contain"
                                />
                                <CardTitle className="text-2xl">{playerData.username}</CardTitle>
                            </div>
                            <CardDescription className="-mt-4">
                                Rank: {playerData.rank} | Total Level: {playerData.globalData.totalLevel} | Playtime: {Math.round(playerData.playtime)} hours
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard title="Wars" value={playerData.globalData.wars} />
                        <StatCard title="Mobs Killed" value={playerData.globalData.killedMobs} />
                        <StatCard title="Chests Found" value={playerData.globalData.chestsFound} />
                        <StatCard title="Dungeons Completed" value={playerData.globalData.dungeons.total} />
                        <StatCard title="Raids Completed" value={playerData.globalData.raids.total} />
                        <StatCard title="Quests Completed" value={playerData.globalData.completedQuests} />
                    </div>
                </CardContent>
            </Card>


            <div className="space-y-4">
                {Object.entries(playerData.characters).map(([id, char]) => {
                    const isOpen = openSections[id] ?? false;
                    return (
                        <div
                            key={id}
                            className={`border border-border rounded-md overflow-hidden transition-all ${isOpen ? 'shadow-lg' : 'shadow-sm'
                                }`}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between p-4 bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() => toggleSection(id)}
                            >
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {char.type} (Level {char.level})
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        XP: {char.xp.toLocaleString()} ({char.xpPercent}%)
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="p-2 rounded-md"
                                    aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                                >
                                    {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                                </Button>
                            </div>

                            {/* Foldable Content */}
                            <div
                                className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <CardContent className="p-4">
                                    <Progress value={char.xpPercent} className="mb-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <StatCard title="Playtime" value={`${Math.round(char.playtime)} hours`} />
                                        <StatCard title="Mobs Killed" value={char.mobsKilled} />
                                        <StatCard title="Chests Found" value={char.chestsFound} />
                                        <StatCard title="Deaths" value={char.deaths} />
                                        <StatCard title="Dungeons Completed" value={char.dungeons.total} />
                                        <StatCard title="Raids Completed" value={char.raids.total} />
                                    </div>
                                    <h3 className="font-semibold mt-4 mb-2">Professions</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {Object.entries(char.professions).map(([profession, data]) => (
                                            <Badge key={profession} variant="outline" className="text-xs">
                                                {profession}: {data.level}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

function StatCard({ title, value }: { title: string; value: number | string }) {
    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <CardDescription className="text-2xl font-bold">{value.toLocaleString()}</CardDescription>
            </CardHeader>
        </Card>
    )
}