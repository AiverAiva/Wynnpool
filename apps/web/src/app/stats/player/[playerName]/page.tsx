'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getPlayerDisplayName, Player, PlayerBase, QuestList } from '@/types/playerType';
import { Spinner } from '@/components/ui/spinner';
import GuildEventDisplay from '@/components/custom/guild-event-display';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from '@/lib/api';
import SkinViewerComponent from '@/components/custom/SkinViewer';
import { TooltipPortal } from '@radix-ui/react-tooltip';
import { DetailCard, DungeonStats, RaidStats } from '@/components/wynncraft/player/DetailCard';
import { PlayerRanking } from '@/components/wynncraft/player/PlayerRanking';

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


function formatNumberWithUnit(num: number): string {
    const absNum = Math.abs(num);

    if (absNum < 1_000_000) return num.toString();

    const units = [
        { value: 1_000_000_000_000, symbol: "T" },
        { value: 1_000_000_000, symbol: "B" },
        { value: 1_000_000, symbol: "M" },
    ];

    for (const unit of units) {
        if (absNum >= unit.value) {
            const formatted = (num / unit.value).toFixed(1).replace(/\.0$/, "");
            return `${formatted}${unit.symbol}`;
        }
    }

    return num.toString(); // fallback, shouldn't be reached
}

const xpList: number[] = [
    110, 190, 275, 385, 505, 645, 790, 940, 1100, 1370,
    1570, 1800, 2090, 2400, 2720, 3100, 3600, 4150, 4800, 5300,
    5900, 6750, 7750, 8900, 10200, 11650, 13300, 15200, 17150, 19600,
    22100, 24900, 28000, 31500, 35500, 39900, 44700, 50000, 55800, 62000,
    68800, 76400, 84700, 93800, 103800, 114800, 126800, 140000, 154500, 170300,
    187600, 206500, 227000, 249500, 274000, 300500, 329500, 361000, 395000, 432200,
    472300, 515800, 562800, 613700, 668600, 728000, 792000, 860000, 935000, 1040400,
    1154400, 1282600, 1414800, 1567500, 1730400, 1837000, 1954800, 2077600, 2194400, 2325600,
    2455000, 2645000, 2845000, 3141100, 3404710, 3782160, 4151400, 4604100, 5057300, 5533840,
    6087120, 6685120, 7352800, 8080800, 8725600, 9578400, 10545600, 11585600, 12740000, 14418250,
    16280000, 21196500, 23315500, 25649000, 249232940
];

function getPlayerLevelXP(level: number): number | undefined {
    level -= 1; // Adjust level to match the xpList index (0-based)
    if (level < 0 || level >= xpList.length) {
        console.error('level out of bounds. Must be between 0 and 104 inclusive.');
        return undefined;
    }
    return xpList[level];
}

export default function PlayerStatsPage() {
    const { playerName } = useParams();
    const [playerData, setPlayerData] = useState<Player>();
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'createDate' | 'combatLevel' | 'totalLevel'>('combatLevel');

    const sortedCharacters = useMemo(() => {
        if (!playerData ||
            !playerData.characters ||
            playerData.restrictions.characterDataAccess
        ) return [];

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
            } catch (err) {
                console.error('An error occurred while fetching the player data.', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPlayerData()


    }, [playerName])

    if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
    if (!playerData) return <div className="items-center justify-center h-screen flex"><span className='font-mono text-2xl'>Player Not Found.</span></div>

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <div className="mt-[80px]" />
            <Card className={`mb-8 ${playerData.online ? " outline outline-green-500" : "outline-none"}`}>
                {/* https://ui.shadcn.com/docs/components/dialog add a share button for sharing profiles here*/}
                <CardHeader>
                    <div className="flex items-center space-x-4 ">
                        <SkinViewerComponent
                            skinUrl={`https://mineskin.eu/skin/${playerData.uuid}`}
                            width={150}
                            height={200}
                        />

                        <div className="flex flex-col w-full sm:relative">
                            <div className={`sm:absolute top-0 w-fit mb-2 right-0 px-4 py-1 text-md font-mono text-white rounded-full ${playerData.online ? "bg-green-500" : "bg-accent"}`}>
                                {playerData.online ? (
                                    <span><span className='font-bold'>Online</span> on <span className='font-bold'>{playerData.server}</span></span>
                                ) : (
                                    <span className='font-bold'>Offline</span>
                                )}
                            </div>
                            {!playerData.restrictions.mainAccess && playerData.firstJoin &&
                                <span className="italic text-sm text-gray-500">
                                    Joined {formatDateWithSuffix(playerData.firstJoin)}
                                </span>
                            }
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
                                {playerData.guild ? (
                                    <span className='text-md font-mono'>
                                        <span className='font-bold capitalize'>{playerData.guild.rank}</span> of <Link href={`/stats/guild/${playerData.guild.name}`} className='font-bold cursor-pointer hover:underline' prefetch={false}>{playerData.guild.name} [{playerData.guild.prefix}]</Link>
                                    </span>
                                ) : (
                                    <span>No guild</span>
                                )}
                            </CardDescription>
                        </div>

                    </div>
                </CardHeader>
                {!playerData.restrictions.mainAccess && playerData.globalData && (
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {playerData.playtime && (
                                <StatCard title="Playtime" value={`${Math.round(playerData.playtime)} hours`} />
                            )}

                            <DetailCard title="Raids Completed" playerData={playerData} />
                            <DetailCard title="Dungeons Completed" playerData={playerData} />

                            <StatCard title="Mobs Killed" value={playerData.globalData.mobsKilled} />
                            <StatCard title="Wars" value={playerData.globalData.wars} />
                            <StatCard title="Quests Completed" value={playerData.globalData.completedQuests} />
                            <StatCard title="Chests Found" value={playerData.globalData.chestsFound} />


                            {/* these are pmuch content book number, not completion count, maybe not using for now */}
                            {/* <StatCard title="World Events" value={playerData.globalData.worldEvents} />
                            <StatCard title="Lootruns Completed" value={playerData.globalData.lootruns} />
                            <StatCard title="Caves Discovered" value={playerData.globalData.caves} /> */}

                            {/* <StatCard title="Raids Completed" value={playerData.globalData.raids.total} />
                        <StatCard title="Dungeons Completed" value={playerData.globalData.dungeons.total} /> */}
                        </div>
                        <GuildEventDisplay query={{ uuid: playerData.uuid }} />
                        <PlayerRanking data={playerData} />
                    </CardContent>
                )}
            </Card>

            {!playerData.restrictions.characterDataAccess ? (
                <>
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
                                    <Card className={`relative p-4 z-0 cursor-pointer hover:scale-105 transition-all duration-200 hover:bg-accent ${id == playerData.activeCharacter && playerData.online ? 'outline outline-green-500' : ''}`}>
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
                                                                        <TooltipPortal>
                                                                            <TooltipContent side="top" className='z-20'>
                                                                                <p>{`${mode == 'hardcore' && char.deaths > 0 ? 'Defeated ' : ''}${formattedMode}`}</p>
                                                                            </TooltipContent>
                                                                        </TooltipPortal>
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
                                                {!char.nickname && char.gamemode.length > 0 && (
                                                    <div className='h-4' />
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full overflow-hidden rounded-b-md z-10">
                                            <div className='flex justify-end'>
                                                <span className='mr-4 text-xs font-mono text-muted-foreground'>
                                                    {formatNumberWithUnit(char.xp)}{char.level < 106 && `/${formatNumberWithUnit(getPlayerLevelXP(char.level)!)}`}
                                                </span>
                                            </div>
                                            <Progress className="rounded-none h-1" value={char.xpPercent} />
                                        </div>
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
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

                                            <DungeonStats dungeons={char.dungeons} />
                                            <RaidStats raids={char.raids} />

                                            <section>
                                                <h3 className="font-semibold mb-2">Quests</h3>
                                                <div className="text-sm mb-4">
                                                    Total Quests Completed: {char.quests.length}/{QuestList.length}
                                                </div>
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
                                                                    <Link prefetch={false} key={quest} href={`https://wynncraft.wiki.gg/wiki/${quest.replace(' ', '_').replace('À', '')}`}>
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
                </>
            ) : (
                <div className="w-full h-[50vh] flex flex-col items-center justify-center border rounded-lg">
                    <span className="font-mono text-lg italic">Private Charater Data</span>
                    <img
                        src={`/turtles/not_found.png`}
                        alt='NOT FOUND'
                        className="h-32"
                    />
                </div>
            )}

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
