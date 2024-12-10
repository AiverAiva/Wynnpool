'use client'

import { notFound, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/playerType';
import { Spinner } from '@/components/ui/spinner';

export default function PlayerStatsPage() {
    const { playerName } = useParams();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const [playerData, setPlayerData] = useState<Player>();
    const [isLoading, setIsLoading] = useState(true);

    const toggleSection = (id: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    useEffect(() => {
        async function fetchPlayerData() {
            try {
                const res = await fetch(`/api/stats/player/${playerName}`)
                if (!res.ok) {
                    throw new Error('Failed to fetch player data')
                }

                const data = await res.json()
                setPlayerData(data)
            } catch (err) {
                console.error('An error occurred while fetching the player data.', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPlayerData()
    }, [playerName])

    if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
    if (!playerData) return <div className="items-center justify-center h-screen flex"><span className='font-mono text-2xl'>Player Not Found.   </span></div>

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <span className='text-2xl'>this page is also incompleted dont blame me, join discord if u have idea :3</span>
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <img
                            src={`https://vzge.me/bust/512/${playerData.uuid}`}
                            alt={playerData.username}
                            className="h-32 w-32"
                            // style={{ imageRendering: 'pixelated' }}
                        />

                        <div className="flex flex-col">

                            <div className="flex items-center space-x-2">
                                {(playerData.supportRank || playerData.rank != 'Player') && (
                                    <img
                                        src={`https://cdn.wynncraft.com/${playerData.rankBadge}`}
                                        alt={`${playerData.rank} badge`}
                                        className="h-5 object-contain"
                                    />
                                )}
                                <CardTitle className="text-2xl">{playerData.username}</CardTitle>

                            </div>
                            <CardDescription>
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
    if (!value) return
    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <CardDescription className="text-2xl font-bold">{value.toLocaleString()}</CardDescription>
            </CardHeader>
        </Card>
    )
}