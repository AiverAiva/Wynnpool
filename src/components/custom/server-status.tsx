'use client'

import { useState, useMemo, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Card } from '../ui/card'

interface ServerData {
    initial: number
    players: string[]
}

interface ServerStatus {
    servers: {
        [key: string]: ServerData
    }
    Latest: number
}

type SortKey = 'server' | 'players' | 'uptime'
type SortOrder = 'asc' | 'desc'

export default function ServerStatusDisplay() {
    const [data, setData] = useState<ServerStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortKey, setSortKey] = useState<SortKey>('server')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('https://nori.fish/api/uptime')
                if (!response.ok) {
                    throw new Error('Failed to fetch server status')
                }
                const serverStatus = await response.json()
                setData(serverStatus)
            } catch (err) {
                setError('An error occurred while fetching the server status.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const sortedServers = useMemo(() => {
        if (!data) return []
        return Object.entries(data.servers).sort((a, b) => {
            const aValue = getSortValue(a[0], a[1], sortKey, data.Latest)
            const bValue = getSortValue(b[0], b[1], sortKey, data.Latest)

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
            return 0
        })
    }, [data, sortKey, sortOrder])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortOrder('asc')
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>
    }

    if (!data) {
        return <div className="text-center">No data available</div>
    }

    return (
        <div className="container mx-auto py-8 max-w-screen-lg">
            <h3 className="text-2xl font-bold mb-4">Server Status</h3>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow >
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('server')}>
                                    Server <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('players')}>
                                    Players <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('uptime')}>
                                    Uptime <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {sortedServers.map(([server, serverData]) => (
                            <TableRow key={server}>
                                <TableCell>{server}</TableCell>
                                <TableCell>{serverData.players.length}</TableCell>
                                <TableCell>{formatUptime(data.Latest - serverData.initial)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}

function getSortValue(server: string, data: ServerData, key: SortKey, latestTimestamp: number): number | string {
    switch (key) {
        case 'server':
            return server;
        case 'players':
            return data.players.length
        case 'uptime':
            return latestTimestamp - data.initial
        default:
            return 0
    }
}

function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}