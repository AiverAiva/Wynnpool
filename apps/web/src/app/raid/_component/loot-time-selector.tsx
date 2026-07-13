"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Clock, History, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getRaidpoolYearWeek, getWeeksInRaidpoolYear, getRaidpoolWeekDateRange, getDaysSinceRaidpoolWeek, getNextRaidpoolReset } from "@wynnpool/shared"

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

export interface TimeSelection {
    year: number
    week: number
    isCurrent: boolean
}

interface LootTimeSelectorProps {
    value: TimeSelection
    onChange: (value: TimeSelection) => void
}

export function LootTimeSelector({ value, onChange }: LootTimeSelectorProps) {
    const [historyOpen, setHistoryOpen] = useState(false)
    const [timeLeft, setTimeLeft] = useState("")

    const { year: currentYear, week: currentWeek } = getRaidpoolYearWeek(new Date())
    const weeks = getWeeksInRaidpoolYear(value.year)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()

            const diff = getNextRaidpoolReset().getTime() - now.getTime()

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            // Drop leading zeros: "0d 4h" → "4h", "0d 0h 0m" → "0m"
            const parts = [
                days > 0 ? `${days}d` : null,
                days > 0 || hours > 0 ? `${hours}h` : null,
                days > 0 || hours > 0 || minutes > 0 ? `${minutes}m` : null,
                `${seconds}s`,
            ].filter(Boolean)

            return parts.join(" ")
        }

        setTimeLeft(calculateTimeLeft())
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const handleResetToCurrent = () => {
        onChange({ year: currentYear, week: currentWeek, isCurrent: true })
        setHistoryOpen(false)
    }

    const handleYearChange = (year: string) => {
        const newYear = Number(year)

        const weeks = getWeeksInRaidpoolYear(newYear)
        const newWeek = weeks.includes(value.week) ? value.week : weeks[0]

        const isCurrent =
            newYear === currentYear &&
            newWeek === currentWeek

        onChange({
            year: newYear,
            week: newWeek,
            isCurrent,
        })
    }


    const handleWeekChange = (week: string) => {
        const newWeek = Number(week)
        const isCurrent = value.year === currentYear && newWeek === currentWeek
        onChange({ year: value.year, week: newWeek, isCurrent })
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 bg-muted/30 border border-border rounded-lg px-6 py-4">
                <Clock className="h-5 w-5 text-primary" />
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    {value.isCurrent ? (
                        <>
                            <span className="text-sm text-muted-foreground">Next reset in:</span>
                            <span className="font-mono text-xl font-semibold text-foreground">{timeLeft}</span>
                            <span className="text-xs text-muted-foreground">(Friday, 6PM UTC)</span>
                        </>
                    ) : (
                        <>
                            <span className="text-sm text-muted-foreground">Viewing historical data:</span>
                            <span className="font-mono text-xl font-semibold text-foreground">
                                {getDaysSinceRaidpoolWeek(value.year, value.week)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                                Week {value.week}, {value.year}
                            </Badge>
                        </>
                    )}
                </div>
            </div>

            <button
                onClick={() => setHistoryOpen((v) => !v)}
                className={cn(
                    "flex w-full items-center justify-between gap-3",
                    "bg-muted/30 border border-border rounded-lg px-6 py-3",
                    "transition-colors hover:bg-muted/40",
                )}
            >
                <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Browse History</span>
                    {!value.isCurrent && (
                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/50">
                            Historical
                        </Badge>
                    )}
                </div>
                {historyOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </button>

            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    historyOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="bg-muted/20 border border-border rounded-lg px-6 py-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs text-muted-foreground">Year</label>
                                <Select value={value.year.toString()} onValueChange={handleYearChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 space-y-1">
                                <label className="text-xs text-muted-foreground">Week</label>
                                <Select value={value.week.toString()} onValueChange={handleWeekChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {weeks.map((w) => (
                                            <SelectItem key={w} value={w.toString()}>
                                                <div className="flex items-center justify-between gap-2 w-full">
                                                    <span>Week {w} ({getRaidpoolWeekDateRange(value.year, w)})</span>

                                                    {w === currentWeek && value.year === currentYear && (
                                                        <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                            <span className="text-xs text-muted-foreground">{getRaidpoolWeekDateRange(value.year, value.week)}</span>
                            {!value.isCurrent && (
                                <button
                                    onClick={handleResetToCurrent}
                                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Back to Current
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
