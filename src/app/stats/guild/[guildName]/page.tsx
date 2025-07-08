'use client'

import { notFound, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import GuildEventDisplay from '@/components/custom/guild-event-display'
import GuildOnlineGraph from '@/components/custom/guild-online-graph'
import Link from 'next/link'
import Banner from '@/components/custom/banner'
import { ChevronDown, ChevronUp, ExternalLink, Info, Shield, Trophy, Users, Map } from 'lucide-react'
import api from '@/lib/api'
import { getMaxGuildMembers } from '@/lib/guildUtils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

function formatTimeAgo(timestamp: number | string | undefined): string {
    if (!timestamp) return 'Never';

    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

function calculateGuildXPRequired(level: number, base = 20000): number {
    let totalXP = 0;
    if (level > 130) level = 130; // Cap level at 130

    for (let n = 1; n <= level; n++) {
        totalXP += Math.pow(1.15, n - 1);
    }

    return Math.round(totalXP * base); // Round to nearest whole number
}

const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

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

type Role = 'owner' | 'chief' | 'strategist' | 'captain' | 'recruiter' | 'recruit';

interface Member {
    username: string;
    online: boolean;
    contributed: number;
    joined: string;
    role: string;
    lastSeen: number | null;
}

type SortKey = keyof Member;
interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

interface LastSeenData {
    [uuid: string]: {
        lastSeen: number | null;
    } | undefined;
}
export default function GuildStatsPage() {
    const { guildName } = useParams();
    const [guildData, setGuildData] = useState<any>();
    const [lastSeenData, setLastSeenData] = useState<LastSeenData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'role', direction: 'asc' });
    const [isTouch, setIsTouch] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const checkTouch = () => {
            setIsTouch(('ontouchstart' in window) || navigator.maxTouchPoints > 0)
        }
        checkTouch()
    }, [])

    const toggleCard = () => {
        if (isTouch) setOpen(prev => !prev)
    }

    useEffect(() => {
        async function fetchGuildData() {
            try {
                const res = await fetch(api(`/guild/${guildName}`))
                if (!res.ok) {
                    throw new Error('Failed to fetch guild data')
                }

                const data = await res.json()
                setGuildData(data)
                const lastSeenRes = await fetch(api('/guild/last-seen'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ guild_uuid: data.uuid }),
                });
                if (!lastSeenRes.ok) {
                    throw new Error('Failed to fetch last seen data')
                }
                const lastSeenData = await lastSeenRes.json()
                setLastSeenData(lastSeenData.data.members)
            } catch (err) {
                console.error('An error occurred while fetching the guild data.', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchGuildData()
    }, [guildName])

    const roles: Role[] = ['owner', 'chief', 'strategist', 'captain', 'recruiter', 'recruit'];

    const sortedMembers = useMemo(() => {
        if (!guildData) return [];

        let sortableItems = roles.flatMap(role =>
            Object.entries(guildData.members[role] || {}).map(([uuid, member]) => ({
                uuid,
                ...member as Member,
                role,
                lastSeen: lastSeenData[uuid]?.lastSeen ?? null
            }))
        );

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'username') {
                    return a.username.localeCompare(b.username) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                if (sortConfig.key === 'role') {
                    const roleOrder: { [key in Role]: number } = { owner: 0, chief: 1, strategist: 2, captain: 3, recruiter: 4, recruit: 5 };
                    return (roleOrder[a.role] - roleOrder[b.role]) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                if (sortConfig.key === 'contributed') {
                    return (b.contributed - a.contributed) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                if (sortConfig.key === 'joined') {
                    return (new Date(a.joined).getTime() - new Date(b.joined).getTime()) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                if (sortConfig.key === 'lastSeen') {
                    if (a.online && b.online) return 0;
                    if (a.online) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (b.online) return sortConfig.direction === 'asc' ? 1 : -1;
                    if (a.lastSeen === null && b.lastSeen === null) return 0;
                    if (a.lastSeen === null) return sortConfig.direction === 'asc' ? 1 : -1;
                    if (b.lastSeen === null) return sortConfig.direction === 'asc' ? -1 : 1;
                    return (b.lastSeen - a.lastSeen) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [guildData, lastSeenData, sortConfig]);

    const requestSort = (key: SortKey) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
        }));
    };


    if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
    if (!guildData) return <div className="items-center justify-center h-screen flex"><span className='font-mono text-2xl'>Guild Not Found.</span></div>

    const totalXpRequired = calculateGuildXPRequired(guildData.level)
    const currentXp = Math.round(totalXpRequired * guildData.xpPercent / 100)
    const raidXp = Math.round(totalXpRequired * 0.1 / 100) //0.1%

    return (
        <div className="container mx-auto p-4">
            <div className="mt-[80px]" />
            <Card className="mb-8">
                <div className='flex'>
                    {guildData.banner && (
                        <div className='ml-12 mr-6 items-center hidden sm:flex'>
                            <Banner className='rounded-lg' {...guildData.banner} />
                        </div>
                    )}
                    <div className='w-full'>
                        <CardHeader className="pb-2 mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Banner - visible on all screen sizes */}
                                <Banner
                                    className="rounded-lg sm:hidden flex-shrink-0"
                                    size={80}
                                    {...guildData.banner}
                                />

                                {/* Guild name and info */}
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-2xl sm:text-3xl font-bold">
                                            {guildData.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                                            {guildData.prefix}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                                        {/* Level with tooltip */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1">
                                                        <Shield className="h-4 w-4 text-primary" />
                                                        <span>Level {guildData.level}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Guild level</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        {/* Wars with tooltip */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1">
                                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                                        <span>{guildData.wars} Wars</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Total wars participated in</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        {/* Territories if available */}
                                        {guildData.territories != 0 && (
                                            <div className="flex items-center gap-1">
                                                <Map className="h-4 w-4 text-green-500" />
                                                <span>{guildData.territories} Territories</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* XP Progress with hover card */}
                            <div className="mt-2 relative">
                                <HoverCard open={isTouch ? open : undefined} onOpenChange={setOpen} openDelay={0}>
                                    <HoverCardTrigger asChild>
                                        <div className="cursor-help" onClick={toggleCard}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-muted-foreground">XP Progress</span>
                                                <span className="font-medium">
                                                    {formatNumberWithUnit(currentXp)} / {formatNumberWithUnit(totalXpRequired)} XP ({guildData.xpPercent}%)
                                                </span>
                                            </div>
                                            <Progress
                                                value={guildData.xpPercent}
                                                className="h-3 bg-muted/50"
                                            />
                                            <div className="absolute right-0 -bottom-4 flex items-center text-xs text-muted-foreground">
                                                <Info className="h-3 w-3 mr-1 opacity-70" />
                                                <span>{isTouch ? "Tap for details" : "Hover for details"}</span>
                                            </div>
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80 p-4">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold">Guild XP Details</h4>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-muted-foreground">Current Level:</div>
                                                <div className="font-medium">{guildData.level}</div>

                                                <div className="text-muted-foreground">XP Progress:</div>
                                                <div className="font-medium">{guildData.xpPercent}%</div>

                                                <div className="text-muted-foreground">Current XP:</div>
                                                <div className="font-medium">{formatNumber(currentXp)}</div>

                                                <div className="text-muted-foreground">XP Required:</div>
                                                <div className="font-medium">{formatNumber(totalXpRequired)}</div>

                                                <div className="text-muted-foreground">XP Remaining:</div>
                                                <div className="font-medium">{formatNumber(totalXpRequired - currentXp)}</div>

                                                <div className="text-muted-foreground">XP from Raid:</div>
                                                <div className="font-medium text-green-500">{formatNumberWithUnit(raidXp)} (0.1%)</div>

                                                <div className="text-muted-foreground">Raids to Level:</div>
                                                <div className="font-medium">
                                                    {Math.ceil((100 - guildData.xpPercent) / 0.1)}
                                                </div>
                                            </div>

                                            {/* <div className="text-xs text-muted-foreground pt-2 border-t">
                                                
                                            </div> */}
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <StatCard title="Territories" value={guildData.territories} />
                                <StatCard title="Total Members" value={`${guildData.members.total} / ${getMaxGuildMembers(guildData.level)}`} />
                                <StatCard title="Online Members" value={guildData.online} />
                                <StatCard title="Created" value={new Date(guildData.created).toLocaleDateString()} />
                            </div>
                        </CardContent>
                    </div>
                </div>
                <CardContent>
                    <GuildOnlineGraph guildUuid={guildData.uuid} />
                    <GuildEventDisplay query={{ guild_uuid: guildData.uuid }} />
                </CardContent>
            </Card>

            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="seasons">Season Ranks</TabsTrigger>
                </TabsList>
                <TabsContent value="members">
                    <Card>
                        <CardHeader>
                            <CardTitle>Guild Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {[
                                            { key: 'username', label: 'Username' },
                                            { key: 'role', label: 'Role' },
                                            { key: 'contributed', label: 'Contribution' },
                                            { key: 'joined', label: 'Joined' },
                                            { key: 'lastSeen', label: 'Last Seen' }
                                        ].map(({ key, label }) => (
                                            <TableHead key={key} className="cursor-pointer transition-colors">
                                                <div
                                                    className="flex items-center justify-between hover:bg-muted/50 rounded-md py-2 px-4 transition-all duration-200"
                                                    onClick={() => requestSort(key as SortKey)}
                                                >
                                                    <span>{label}</span>
                                                    <div className="flex flex-col ml-2">
                                                        <ChevronUp
                                                            className={`h-3 w-3 ${sortConfig.key === key && sortConfig.direction === 'asc'
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground/65'
                                                                }`}
                                                        />
                                                        <ChevronDown
                                                            className={`h-3 w-3 ${sortConfig.key === key && sortConfig.direction === 'desc'
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground/65'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMembers.map((member) => {
                                        const lastSeen = member.online ? 'Online' : (member.lastSeen ? formatTimeAgo(member.lastSeen * 1000) : 'Never');
                                        // theres something wrong with wynncraft api thats not showing the correct online status, prob to be fixed?
                                        return (
                                            <TableRow key={member.uuid} className={`${member.online ? 'bg-green-500/20 hover:bg-green-300/20' : ''}`}>
                                                <TableCell className='group hover:scale-105 transition-transform duration-200'>
                                                    <Link href={`/stats/player/${member.uuid}`} className='flex items-center cursor-pointer gap-2'>
                                                        <img
                                                            src={`/api/player/icon/${member.uuid}`}
                                                            alt={member.username}
                                                            className="w-8 h-8"
                                                        />
                                                        {member.online ? (
                                                            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                                                            </div>
                                                        )}
                                                        <span className="font-mono text-lg">{member.username}</span>
                                                        <ExternalLink className='hidden opacity-0 group-hover:inline-block group-hover:opacity-100 h-4 w-4 text-muted-foreground transition-all duration-500' />
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="text-md font-mono capitalize">{member.role}</Badge>
                                                </TableCell>
                                                <TableCell>{member.contributed.toLocaleString()}</TableCell>
                                                <TableCell>{new Date(member.joined).toLocaleDateString()}</TableCell>
                                                <TableCell>{lastSeen}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="seasons">
                    <Card>
                        <CardHeader>
                            <CardTitle>Season Ranks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Season</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Final Territories</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(guildData.seasonRanks).map(([season, data]: [string, any]) => (
                                        <TableRow key={season}>
                                            <TableCell>{season}</TableCell>
                                            <TableCell>{data.rating.toLocaleString()}</TableCell>
                                            <TableCell>{data.finalTerritories}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StatCard({ title, value, children }: { title: string; value: number | string; children?: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <CardDescription className="text-2xl font-bold">{value}</CardDescription>
            </CardHeader>
            {children && <CardContent>{children}</CardContent>}
        </Card>
    )
}