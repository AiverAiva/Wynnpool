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

async function getGuildData(guildName: string) {
    try {
        const res = await fetch(`https://api.wynncraft.com/v3/guild/${guildName}`)
        if (!res.ok) throw new Error('Failed to fetch guild data')
        return res.json()
    } catch (error) {
        console.error('Error fetching guild data:', error)
        return null
    }
}

export default function GuildStatsPage({ params }: { params: { guildName: string } }) {
    const { guildName } = useParams();
    const [guildData, setGuildData] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchGuildData() {
            try {
                const res = await fetch(`https://api.wynncraft.com/v3/guild/${guildName}?identifier=uuid`)
                if (!res.ok) {
                    throw new Error('Failed to fetch player data')
                }

                const data = await res.json()
                setGuildData(data)
            } catch (err) {
                console.error('An error occurred while fetching the player data.', err)
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.flatMap(role =>
                                        Object.entries(guildData.members[role] || {}).map(([uuid, member]: [string, any]) => (
                                            <TableRow key={uuid}>
                                                <TableCell><span>{member.username}</span></TableCell>
                                                <TableCell>
                                                    <Badge>{role}</Badge>
                                                </TableCell>
                                                <TableCell>{member.contributed.toLocaleString()}</TableCell>
                                                <TableCell>{new Date(member.joined).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))
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