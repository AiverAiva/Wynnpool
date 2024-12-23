'use client'

import { notFound, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import GuildEventDisplay from '@/components/custom/guild-event-display'
import GuildOnlineGraph from '@/components/custom/guild-online-graph'
import Link from 'next/link'

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

export default function GuildStatsPage() {
    const { guildName } = useParams();
    const [guildData, setGuildData] = useState<any>();
    const [lastSeenData, setLastSeenData] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchGuildData() {
            try {
                const res = await fetch(`/api/guild/${guildName}`)
                if (!res.ok) {
                    throw new Error('Failed to fetch guild data')
                }

                const data = await res.json()
                setGuildData(data)
                const lastSeenRes = await fetch('/api/guild/last-seen', {
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

    if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
    if (!guildData) return <div className="items-center justify-center h-screen flex"><span className='font-mono text-2xl'>Guild Not Found.</span></div>

    const roles = ['owner', 'chief', 'strategist', 'captain', 'recruiter', 'recruit']

    return (
        <div className="container mx-auto p-4">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl">{guildData.name}</CardTitle>
                    <CardDescription>
                        Prefix: {guildData.prefix} | Level: {guildData.level} | Wars: {guildData.wars}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard title="XP Progress" value={`${guildData.xpPercent}%`}>
                            <Progress value={guildData.xpPercent} className="mt-2" />
                        </StatCard>
                        <StatCard title="Territories" value={guildData.territories} />
                        <StatCard title="Total Members" value={guildData.members.total} />
                        <StatCard title="Online Members" value={guildData.online} />
                        <StatCard title="Created" value={new Date(guildData.created).toLocaleDateString()} />
                    </div>
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
                                        <TableHead>Username</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Contribution</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Last Seen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.flatMap(role =>
                                        Object.entries(guildData.members[role] || {}).map(([uuid, member]: [string, any]) => {
                                            const lastSeenInfo = lastSeenData[uuid];
                                            const lastSeen = lastSeenInfo ? formatTimeAgo(lastSeenInfo.lastSeen * 1000) : 'Never';

                                            return (
                                                <TableRow key={uuid} className={`${member.online ? 'bg-green-500/20 hover:bg-green-300/20' : ''}`}>
                                                    <TableCell>
                                                        <Link href={`/stats/player/${uuid}`} className='flex items-center cursor-pointer'>
                                                            <img
                                                                src={`/api/player/icon/${uuid}`}
                                                                alt={member.username}
                                                                className="w-8 h-8"
                                                            />
                                                            <span className="ml-2 font-mono text-lg">{member.username}</span>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="text-md font-mono capitalize">{role}</Badge>
                                                    </TableCell>
                                                    <TableCell>{member.contributed.toLocaleString()}</TableCell>
                                                    <TableCell>{new Date(member.joined).toLocaleDateString()}</TableCell>
                                                    <TableCell>{member.online ? (
                                                        <span className='font-bold'>Online</span>
                                                    ) : (
                                                        lastSeen
                                                    )}</TableCell>
                                                </TableRow>
                                            )
                                        }
                                        )
                                    )}
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