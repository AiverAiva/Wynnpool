'use client'

import { useState, useEffect } from 'react'

interface ScheduleEntry {
    internalName: string
    schedule: string | null
    polledAt: string
}

interface EventWithSchedule {
    name: string
    internalName: string
    difficulty: string | null
    level: number | null
    schedule: string
}

interface EventCountdownProps {
    schedules: ScheduleEntry[]
    eventNames: Record<string, { name: string; difficulty: string | null; level: number | null }>
}

const difficultyBadge: Record<string, string> = {
    EASY: 'bg-green-500/15 text-green-400',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400',
    HARD: 'bg-red-500/15 text-red-400',
}

function formatRemaining(seconds: number): string {
    if (seconds <= 0) return '0s'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const parts: string[] = []
    if (h > 0) parts.push(`${h}h`)
    if (m > 0 || h > 0) parts.push(`${m}m`)
    parts.push(`${s}s`)
    return parts.join(' ')
}

export default function EventCountdown({ schedules, eventNames }: EventCountdownProps) {
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    const upcoming: EventWithSchedule[] = schedules
        .filter((s) => s.schedule != null && new Date(s.schedule).getTime() > now)
        .map((s) => ({
            ...s,
            ...(eventNames[s.internalName] || { name: s.internalName, difficulty: null, level: null }),
            schedule: s.schedule!,
        }))
        .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())

    if (upcoming.length === 0) {
        return (
            <div className="border border-border rounded-lg p-8 text-center bg-card">
                <p className="text-sm text-muted-foreground">No upcoming events</p>
                <p className="text-xs text-muted-foreground mt-1">The API updates every 2 minutes</p>
            </div>
        )
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="px-5 py-3 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Upcoming — {upcoming.length} event{upcoming.length !== 1 ? 's' : ''}
                </p>
            </div>
            {upcoming.slice(0, 8).map((event, index) => {
                const remaining = Math.max(0, Math.floor((new Date(event.schedule).getTime() - now) / 1000))
                const isFirst = index === 0

                return (
                    <div
                        key={event.internalName}
                        className={`flex items-center gap-4 px-5 py-3 ${
                            index > 0 ? 'border-t border-border' : ''
                        } ${isFirst ? 'bg-muted/50' : ''}`}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5">
                                <span className={`text-sm font-medium truncate ${isFirst ? 'text-foreground' : 'text-foreground/80'}`}>
                                    {event.name}
                                </span>
                                {event.difficulty && (
                                    <span className={`${difficultyBadge[event.difficulty] || ''} text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-medium`}>
                                        {event.difficulty}
                                    </span>
                                )}
                                {event.level && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        Lv.{event.level}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`font-mono text-sm tabular-nums ${remaining <= 60 ? 'text-destructive font-semibold' : 'text-foreground/80'}`}>
                                {formatRemaining(remaining)}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
