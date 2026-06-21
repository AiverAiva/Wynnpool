'use client'

import { useState, useEffect, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import api from '@/lib/api'
import EventCard from '@/components/wynncraft/event/EventCard'
import EventCountdown from '@/components/wynncraft/event/EventCountdown'
import EventFilters from '@/components/wynncraft/event/EventFilters'

interface WorldEvent {
    name: string
    internalName: string
    lore: string
    difficulty: string | null
    level: number | null
    length: string | null
    rewardPerLevel: Record<string, string[]> | null
    requirements: { type: string; value: number | string }[] | null
    location: {
        event: { x: number; y: number; z: number } | null
        spawn: { x: number; y: number; z: number } | null
        reward: { x: number; y: number; z: number } | null
        radius: number | null
        spawnRadius: number | null
    }[]
    schedule?: string | null
}

interface ScheduleEntry {
    internalName: string
    schedule: string | null
    polledAt: string
}

export default function EventsPage() {
    const [events, setEvents] = useState<WorldEvent[]>([])
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [difficulty, setDifficulty] = useState<string[]>([])
    const [levelRange, setLevelRange] = useState<[number, number]>([0, 120])
    const [length, setLength] = useState<string[]>([])

    // Dynamic level bounds from actual event data
    const levelBounds = useMemo(() => {
        const levels = events.map((e) => e.level).filter((l): l is number => l != null)
        if (levels.length === 0) return { min: 0, max: 120 }
        return { min: Math.min(...levels), max: Math.max(...levels) }
    }, [events])

    // Reset level range when events load for the first time
    useEffect(() => {
        if (events.length > 0) {
            setLevelRange([levelBounds.min, levelBounds.max])
        }
    }, [levelBounds])

    const fetchData = async () => {
        try {
            const [eventsRes, schedulesRes] = await Promise.all([
                fetch(api('/world-event')),
                fetch(api('/world-event/schedule')),
            ])

            if (!eventsRes.ok) throw new Error('Failed to fetch events')
            if (!schedulesRes.ok) throw new Error('Failed to fetch schedules')

            const eventsData = await eventsRes.json()
            const schedulesData = await schedulesRes.json()

            setEvents(eventsData)
            setSchedules(schedulesData)
        } catch (err) {
            setError('Failed to load world events. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 2 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    // Build a lookup map for event names by internalName
    const eventNameMap = useMemo(() => {
        const map: Record<string, { name: string; difficulty: string | null; level: number | null }> = {}
        for (const e of events) {
            map[e.internalName] = { name: e.name, difficulty: e.difficulty, level: e.level }
        }
        return map
    }, [events])

    // Apply filters to event list
    const filteredEvents = useMemo(() => {
        const query = search.toLowerCase().trim()
        return events.filter((event) => {
            if (query && !event.name.toLowerCase().includes(query) && !event.lore.toLowerCase().includes(query)) {
                return false
            }
            if (difficulty.length > 0 && event.difficulty && !difficulty.includes(event.difficulty)) {
                return false
            }
            if (event.level != null) {
                if (event.level < levelRange[0] || event.level > levelRange[1]) {
                    return false
                }
            }
            if (length.length > 0 && event.length && !length.includes(event.length)) {
                return false
            }
            return true
        })
    }, [events, search, difficulty, levelRange, length])

    if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground pt-24">
                <div className="container max-w-5xl mx-auto px-4">
                    <div className="border border-destructive/30 rounded-lg p-6 bg-destructive/10">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container max-w-5xl mx-auto px-4 pt-24 pb-20">
                {/* Page header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        World Events
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Live countdowns for upcoming events, plus the full event database with filters.
                    </p>
                </div>

                {/* Upcoming countdown */}
                <section className="mb-12">
                    {loading ? (
                        <div className="space-y-0">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <EventCountdown schedules={schedules} eventNames={eventNameMap} />
                    )}
                </section>

                {/* Section divider */}
                <div className="border-t border-border mb-8" />

                {/* All events header */}
                <div className="flex items-baseline justify-between gap-4 mb-6">
                    <h2 className="text-lg font-semibold tracking-tight">
                        All Events
                    </h2>
                    {!loading && (
                        <span className="text-xs text-muted-foreground font-mono">
                            {filteredEvents.length}/{events.length}
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-md border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                </div>

                {/* Filters + Event list */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters sidebar */}
                    <aside className="lg:col-span-1">
                        <EventFilters
                            difficulty={difficulty}
                            onDifficultyChange={setDifficulty}
                            levelRange={levelRange}
                            onLevelRangeChange={setLevelRange}
                            levelMin={levelBounds.min}
                            levelMax={levelBounds.max}
                            length={length}
                            onLengthChange={setLength}
                        />
                    </aside>

                    {/* Event cards */}
                    <div className="lg:col-span-3 space-y-3">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-lg" />
                            ))
                        ) : filteredEvents.length === 0 ? (
                            <div className="border border-border rounded-lg p-8 text-center bg-card">
                                <p className="text-sm text-muted-foreground">No events match your filters</p>
                                <button
                                    onClick={() => {
                                        setSearch('')
                                        setDifficulty([])
                                        setLength([])
                                        setLevelRange([levelBounds.min, levelBounds.max])
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground mt-2 underline underline-offset-2 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            filteredEvents.map((event) => (
                                <EventCard key={event.internalName} event={event} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
