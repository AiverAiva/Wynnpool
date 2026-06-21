'use client'

import { MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface EventLocation {
    event: { x: number; y: number; z: number } | null
    spawn: { x: number; y: number; z: number } | null
    reward: { x: number; y: number; z: number } | null
    radius: number | null
    spawnRadius: number | null
}

interface WorldEventData {
    name: string
    internalName: string
    lore: string
    difficulty: string | null
    level: number | null
    length: string | null
    rewardPerLevel: Record<string, string[]> | null
    requirements: { type: string; value: number | string }[] | null
    location: EventLocation[]
}

interface EventCardProps {
    event: WorldEventData
}

const difficultyBadge: Record<string, string> = {
    EASY: 'bg-green-500/15 text-green-400',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400',
    HARD: 'bg-red-500/15 text-red-400',
}

const lengthLabel: Record<string, string> = {
    SHORT: 'Short',
    MEDIUM: 'Medium',
    LONG: 'Long',
}

export default function EventCard({ event }: EventCardProps) {
    const [expanded, setExpanded] = useState(false)

    const formatCoord = (coord: { x: number; y: number; z: number } | null) => {
        if (!coord) return null
        return `${coord.x}, ${coord.y}, ${coord.z}`
    }

    const badge = event.difficulty ? difficultyBadge[event.difficulty] : null

    return (
        <div className="border border-border rounded-lg bg-card hover:border-foreground/20 transition-colors">
            <div className="px-5 py-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-medium text-foreground leading-snug">
                            {event.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {event.lore}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {badge && (
                            <span className={`${badge} text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-medium`}>
                                {event.difficulty}
                            </span>
                        )}
                        {event.level && (
                            <span className="text-xs text-muted-foreground font-mono">
                                Lv.{event.level}
                            </span>
                        )}
                        {event.length && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {lengthLabel[event.length] || event.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded ? 'Less' : 'Details'}
                </button>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-5 pb-4 pt-0 space-y-3 border-t border-border mt-0">
                    <div className="pt-3 space-y-3">
                        {/* Requirements */}
                        {event.requirements && event.requirements.length > 0 && (
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Requirements</p>
                                {event.requirements.map((req, i) => (
                                    <p key={i} className="text-sm text-foreground/80">
                                        {req.type === 'COMBAT_LEVEL' && `Combat Level ≥ ${req.value}`}
                                        {req.type === 'GLOBAL_QUEST' && `Quest: ${req.value}`}
                                        {req.type !== 'COMBAT_LEVEL' && req.type !== 'GLOBAL_QUEST' && `${req.type}: ${req.value}`}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Rewards */}
                        {event.rewardPerLevel && Object.keys(event.rewardPerLevel).length > 0 && (
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Rewards</p>
                                {Object.entries(event.rewardPerLevel).map(([level, rewards]) => (
                                    <p key={level} className="text-sm text-foreground/80">
                                        <span className="text-muted-foreground">Lv. {level}:</span>{' '}
                                        {rewards.join(', ')}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Location */}
                        {event.location && event.location.length > 0 && (
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                                {event.location.map((loc, i) => {
                                    const coord = formatCoord(loc.event)
                                    if (!coord) return null
                                    return (
                                        <div key={i} className="flex items-center gap-1.5 text-sm text-foreground/80">
                                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="font-mono text-xs">{coord}</span>
                                            {loc.radius && (
                                                <span className="text-xs text-muted-foreground">r:{loc.radius}</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
