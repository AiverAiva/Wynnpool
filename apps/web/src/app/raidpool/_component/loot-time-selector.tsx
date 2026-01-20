"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Clock, History, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFirstFriday18UTC, getRaidpoolYearWeek, WEEK_MS } from "@/lib/dateUtils"

const SYSTEM_START = {
    year: 2024,
    week: 38,
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

function getWeeksInRaidpoolYear(year: number): number[] {
    const firstFriday = getFirstFriday18UTC(year)
    const nextYearFirstFriday = getFirstFriday18UTC(year + 1)

    const totalWeeks = Math.floor(
        (nextYearFirstFriday - firstFriday) / WEEK_MS
    )

    const { year: currentYear, week: currentWeek } =
        getRaidpoolYearWeek(new Date())

    let minWeek = 1
    let maxWeek =
        year === currentYear
            ? currentWeek
            : totalWeeks

    // enforce system start
    if (year === SYSTEM_START.year) {
        minWeek = SYSTEM_START.week
    }

    if (maxWeek < minWeek) return []

    return Array.from(
        { length: maxWeek - minWeek + 1 },
        (_, i) => maxWeek - i
    )
}

function getWeekDateRange(year: number, week: number) {
    const firstFriday = getFirstFriday18UTC(year)
    const weekStart = new Date(firstFriday + (week - 1) * WEEK_MS)
    const weekEnd = new Date(weekStart.getTime() + WEEK_MS - 1)

    const format = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    return `${format(weekStart)} - ${format(weekEnd)}`
}

function getDaysAgo(year: number, week: number): string {
    const jan1 = new Date(Date.UTC(year, 0, 1))
    const daysToAdd = (week - 1) * 7 - ((jan1.getUTCDay() + 6) % 7)
    const weekStart = new Date(jan1)
    weekStart.setUTCDate(jan1.getUTCDate() + daysToAdd)

    // Calculate to the Friday 6PM of that week
    const friday = new Date(weekStart)
    friday.setUTCDate(weekStart.getUTCDate() + ((5 - weekStart.getUTCDay() + 7) % 7))
    friday.setUTCHours(18, 0, 0, 0)

    const now = new Date()
    const diff = now.getTime() - friday.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "1 day ago"
    if (days < 7) return `${days} days ago`
    if (days < 14) return "1 week ago"
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 60) return "1 month ago"
    return `${Math.floor(days / 30)} months ago`
}

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
            const nextFriday = new Date()

            const currentDay = now.getUTCDay()
            const currentHour = now.getUTCHours()

            let daysUntilFriday = (5 - currentDay + 7) % 7

            if (currentDay === 5 && currentHour >= 18) {
                daysUntilFriday = 7
            }
            if (daysUntilFriday === 0) {
                daysUntilFriday = 7
            }

            nextFriday.setUTCDate(now.getUTCDate() + daysUntilFriday)
            nextFriday.setUTCHours(18, 0, 0, 0)

            const diff = nextFriday.getTime() - now.getTime()

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            return `${days}d ${hours}h ${minutes}m ${seconds}s`
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
                                {getDaysAgo(value.year, value.week)}
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
                                                    <span>Week {w} ({getWeekDateRange(value.year, w)})</span>

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
                            <span className="text-xs text-muted-foreground">{getWeekDateRange(value.year, value.week)}</span>
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
