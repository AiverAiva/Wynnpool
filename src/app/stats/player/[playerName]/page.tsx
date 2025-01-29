'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getPlayerDisplayName, Player, QuestList } from '@/types/playerType';
import { Spinner } from '@/components/ui/spinner';
import GuildEventDisplay from '@/components/custom/guild-event-display';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image';
import { MiscIcon } from '@/components/custom/WynnIcon';
import api from '@/utils/api';

interface PlayerGuild {
    guild_uuid: string;
    guild_name: string;
    guild_prefix: string;
    player_uuid: string;
    player_rank: string;
}

function formatDateWithSuffix(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    // Determine suffix for the day
    const suffix =
        day === 1 || day === 21 || day === 31 ? 'st'
            : day === 2 || day === 22 ? 'nd'
                : day === 3 || day === 23 ? 'rd'
                    : 'th';

    return `${month} ${day}${suffix} ${year}`;
}

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const pastDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

    const seconds = diffInSeconds;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

export default function PlayerStatsPage() {
    const { playerName } = useParams();
    const [playerData, setPlayerData] = useState<Player>();
    const [playerGuildData, setPlayerGuildData] = useState<PlayerGuild>();
    const [isLoading, setIsLoading] = useState(true);
    const [isPlayerGuildLoading, setIsPlayerGuildLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'createDate' | 'combatLevel' | 'totalLevel'>('combatLevel');

    const sortedCharacters = useMemo(() => {
        if (!playerData) return [];
        return Object.entries(playerData.characters).sort((a, b) => {
            switch (sortBy) {
                case 'createDate':
                    return a[1].playtime - b[1].playtime;
                case 'combatLevel':
                    return b[1].level - a[1].level;
                case 'totalLevel':
                    return b[1].totalLevel - a[1].totalLevel;
                default:
                    return 0;
            }
        });
    }, [playerData, sortBy]);

    useEffect(() => {
        async function fetchPlayerData() {
            try {
                const res = await fetch(api(`/player/${playerName}`))
                if (!res.ok) {
                    throw new Error('Failed to fetch player data')
                }

                const data = await res.json()

                setPlayerData(data)

                setIsLoading(false)
                const resGuild = await fetch(api(`/player/guild/${data.uuid}`))
                if (!resGuild.ok) {
                    throw new Error('Failed to fetch player guild data')
                }
                const dataGuild = await resGuild.json()
                setPlayerGuildData(dataGuild)
                setIsPlayerGuildLoading(false)
            } catch (err) {
                console.error('An error occurred while fetching the player data.', err)
            } finally {
                setIsLoading(false)
                setIsPlayerGuildLoading(false)
            }
        }
        fetchPlayerData()


    }, [playerName])

    if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
    if (!playerData) return <div className="items-center justify-center h-screen flex"><span className='font-mono text-2xl'>Player Not Found.</span></div>

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <Card className={`mb-8 ${playerData.online ? " outline outline-green-500" : "outline-none"}`}>
                {/* https://ui.shadcn.com/docs/components/dialog add a share button for sharing profiles here*/}
                <CardHeader>
                    <div className="flex items-center space-x-4 ">
                        <img
                            src={`https://vzge.me/bust/512/${playerData.uuid}`}
                            alt={playerData.username}
                            className="h-32 w-32"
                        // style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="flex flex-col w-full sm:relative">
                            <div className={`sm:absolute top-0 w-fit mb-2 right-0 px-4 py-1 text-md font-mono text-white rounded-full ${playerData.online ? "bg-green-500" : "bg-accent"}`}>
                                {playerData.online ? (
                                    <span><span className='font-bold'>Online</span> on <span className='font-bold'>{playerData.server}</span></span>
                                ) : (
                                    <span className='font-bold'>Offline</span>
                                )}
                            </div>
                            <span className="italic text-sm text-gray-500">
                                Joined {formatDateWithSuffix(playerData.firstJoin)}
                            </span>
                            {!playerData.online && playerData.lastJoin && (
                                <span className="italic text-sm text-gray-500">
                                    Last seen {formatTimeAgo(playerData.lastJoin)}
                                </span>
                            )}
                            <div className="flex items-center space-x-2">
                                {(playerData.supportRank || playerData.rank != 'Player') && (
                                    <img
                                        src={`https://cdn.wynncraft.com/${playerData.rankBadge}`}
                                        alt={`${playerData.rank} badge`}
                                        className="h-5 object-contain"
                                    />
                                )}
                                <CardTitle className="text-2xl">{getPlayerDisplayName(playerData.username)}</CardTitle>
                            </div>
                            <CardDescription className="flex flex-col">
                                {!isPlayerGuildLoading ? (
                                    playerGuildData ? (
                                        <span className='text-md font-mono'><span className='font-bold capitalize'>{playerGuildData.player_rank}</span> of <Link href={`/stats/guild/${playerGuildData.guild_name}`} className='font-bold cursor-pointer hover:underline'>{playerGuildData.guild_name} [{playerGuildData.guild_prefix}]</Link></span>
                                    ) : (
                                        <span>No guild</span>
                                    )
                                ) : (
                                    <Skeleton className='h-5 w-48' />
                                )}
                                Total Level: {playerData.globalData.totalLevel} | Playtime: {Math.round(playerData.playtime)} hours
                            </CardDescription>
                        </div>

                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard title="Wars" value={playerData.globalData.wars} />
                        <StatCard title="Mobs Killed" value={playerData.globalData.killedMobs} />
                        <StatCard title="Chests Found" value={playerData.globalData.chestsFound} />
                        <StatCard title="Raids Completed" value={playerData.globalData.raids.total} />
                        <StatCard title="Dungeons Completed" value={playerData.globalData.dungeons.total} />
                        <StatCard title="Quests Completed" value={playerData.globalData.completedQuests} />
                    </div>
                    <GuildEventDisplay query={{ uuid: playerData.uuid }} />
                </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Characters</h2>
                <Select onValueChange={(value) => setSortBy(value as any)} defaultValue={sortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="combatLevel">Combat Level</SelectItem>
                        <SelectItem value="createDate">Create Date</SelectItem>
                        <SelectItem value="totalLevel">Total Level</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCharacters.map(([id, char]) => (
                    <Dialog key={id}>
                        <DialogTrigger asChild>
                            <Card className={`relative overflow-hidden p-4 cursor-pointer hover:scale-105 transition-all duration-200 hover:bg-accent ${id == playerData.activeCharacter && playerData.online ? 'outline outline-green-500' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className='w-full'>
                                        <h2 className="text-lg font-bold tracking-tight flex items-center justify-between flex">
                                            <span className="text-primary">{char.type}</span>
                                            <span className="text-muted-foreground font-medium">
                                                Level {char.level}
                                            </span>
                                        </h2>
                                        <div className='flex justify-between items-center'>
                                            <p className="text-sm text-muted-foreground">
                                                Total Level: {char.totalLevel}
                                            </p>
                                            <div className='flex items-center space-x-2'>
                                                <TooltipProvider delayDuration={50}>
                                                    {char.gamemode.sort().map((mode, index) => {
                                                        if (mode == 'ironman' && char.gamemode.includes('ultimate_ironman')) return
                                                        const formattedMode = mode
                                                            .split('_')
                                                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                            .join(' ');

                                                        return (
                                                            <Tooltip key={index}>
                                                                <TooltipTrigger>
                                                                    {/* <div className='hover:bg-background transition-colors transition-duration-200 rounded-md p-1.5'> */}
                                                                    <img
                                                                        src={`/icons/gamemode/${mode == 'hardcore' && char.deaths > 0 ? 'defeated_' : ''}${mode}.svg`}
                                                                        alt={formattedMode}
                                                                        className={'h-4'}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="bottom">
                                                                    <p>{`${mode == 'hardcore' && char.deaths > 0 ? 'Defeated ' : ''}${formattedMode}`}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                        {char.nickname && (
                                            <span className='text-sm font-medium italic text-muted-foreground/80'>
                                                "{char.nickname}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Progress className="absolute bottom-0 left-0 w-full rounded-none h-1" value={char.xpPercent} />
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-w-screen-lg">
                            <DialogHeader>
                                <DialogTitle>{char.type} Details</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className='h-[70vh]'>
                                <div className="mt-4 space-y-6">
                                    <section>
                                        <h3 className="font-semibold mb-2">Character Stats</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <StatCard title="Combat Level" value={char.level} />
                                            <StatCard title="Total Level" value={char.totalLevel} />
                                            <StatCard title="Playtime" value={`${Math.round(char.playtime)} hours`} />
                                            <StatCard title="Mobs Killed" value={char.mobsKilled} />
                                            <StatCard title="Chests Found" value={char.chestsFound} />
                                            <StatCard title="Deaths" value={char.deaths} />
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-semibold mb-2">Professions</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {Object.entries(char.professions).map(([profession, data]) => (
                                                <Card key={profession} className="bg-background transition-colors overflow-hidden">
                                                    <CardContent className="p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={`/icons/profession/${profession}.webp`}
                                                                alt={profession}
                                                                className="h-6 w-6"
                                                            // style={{ imageRendering: 'pixelated' }}
                                                            />
                                                            <span className="capitalize text-sm">{profession}</span>
                                                        </div>
                                                        <Badge variant="outline" className="ml-2">
                                                            {data.level}
                                                        </Badge>
                                                    </CardContent>
                                                    <Progress value={data.xpPercent} className='h-1 rounded-none w-full' />
                                                </Card>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-semibold mb-2">Dungeons</h3>
                                        <div className="text-sm mb-4">
                                            Total Dungeons Completed: {char.dungeons.total}
                                        </div>
                                        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                                            {Object.entries(
                                                Object.entries(char.dungeons.list).reduce<{
                                                    [key: string]: { normal: number; corrupted: number };
                                                }>((acc, [name, count]) => {
                                                    const isCorrupted = name.startsWith("Corrupted ");
                                                    const baseName = isCorrupted ? name.replace("Corrupted ", "") : name;

                                                    if (!acc[baseName]) {
                                                        acc[baseName] = { normal: 0, corrupted: 0 };
                                                    }

                                                    if (isCorrupted) {
                                                        acc[baseName].corrupted += count;
                                                    } else {
                                                        acc[baseName].normal += count;
                                                    }

                                                    return acc;
                                                }, {})
                                            ).map(([name, counts]) => (
                                                <Card key={name} className='flex p-2 gap-2'>
                                                    <Image
                                                        src={`/icons/dungeon/${name.replace(' ', '_').replace('-', '_').replace("'s", '').toLowerCase()}.webp`}
                                                        alt={name}
                                                        width={64}
                                                        height={64}
                                                    />
                                                    <div>
                                                        <span>{name}</span>
                                                        <div className='flex flex-row gap-3'>
                                                            {counts.normal > 0 && (
                                                                <div className='flex gap-1 items-center'>
                                                                    <MiscIcon id='dungeon_key' size={24} />
                                                                    {counts.normal}
                                                                </div>
                                                            )}
                                                            {counts.corrupted > 0 && (
                                                                <div className='flex gap-1 items-center'>
                                                                    <MiscIcon id='corrupted_dungeon_key' size={24} />
                                                                    {counts.corrupted}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-semibold mb-2">Raids</h3>
                                        <div className="text-sm mb-4">
                                            Total Raids Completed: {char.raids.total}
                                        </div>
                                        <div className='grid sm:grid-cols-2 gap-4'>
                                            {Object.entries(char.raids.list).map(([name, count]) => (
                                                <Card key={name} className='flex p-2 gap-2'>
                                                    <Image
                                                        src={`/icons/raid/${name}.webp`}
                                                        alt={name}
                                                        width={64}
                                                        height={64}
                                                    />
                                                    <div className='flex flex-col'>
                                                        <span>{name}</span>
                                                        {count}
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-semibold mb-2">Quests</h3>
                                        <Card className="p-2">
                                            <ScrollArea className="h-[300px]">
                                                <div className="flex flex-wrap gap-1 text-xs">
                                                    {QuestList
                                                        .sort((a, b) => {
                                                            const aIncluded: any = char.quests.includes(a);
                                                            const bIncluded: any = char.quests.includes(b);
                                                            return bIncluded - aIncluded; // Included quests first
                                                        })
                                                        .map((quest) => (
                                                            <Link key={quest} href={`https://wynncraft.wiki.gg/wiki/${quest.replace(' ', '_').replace('À', '')}`}>
                                                                <div className={cn(char.quests.includes(quest) ? "bg-green-950/30 text-green-400 hover:bg-green-950/60" : "bg-muted/50 text-muted-foreground hover:bg-muted ", "flex items-center gap-2 p-2 rounded-lg transition-colors cursor-default group cursor-pointer")}>
                                                                    <span>{quest}</span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                </div>
                                            </ScrollArea>
                                        </Card>
                                    </section>
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div >
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
