'use client';

import { useEffect, useState } from "react";
import { ClassAspectFinder } from "./_component/class-aspect-finder";
import { LootData, LootDisplay } from "./_component/loot-display";
import { RaidpoolProvider } from "@/components/provider/RaidpoolProvider";
import { LootTimeSelector, TimeSelection } from "./_component/loot-time-selector";
import { AspectProvider } from "@/components/provider/AspectProvider";
import { DailyGambit } from "./_component/daily-gambit";

type Selection = {
    year: number
    week: number
    isCurrent: boolean
} | null

export function getCurrentRaidpoolSelection(): Selection {
    const now = new Date()

    const WEEK_MS = 7 * 24 * 60 * 60 * 1000
    const REFERENCE_FRIDAY_UTC = Date.UTC(2024, 0, 5, 18, 0, 0)

    const diffWeeks = Math.floor(
        (now.getTime() - REFERENCE_FRIDAY_UTC) / WEEK_MS
    )

    const weekStart = REFERENCE_FRIDAY_UTC + diffWeeks * WEEK_MS
    const weekDate = new Date(weekStart)

    const year = weekDate.getUTCFullYear()

    const jan1 = new Date(Date.UTC(year, 0, 1, 18, 0, 0))
    const day = jan1.getUTCDay()
    const diffToFriday = (5 - day + 7) % 7
    jan1.setUTCDate(jan1.getUTCDate() + diffToFriday)

    const firstFriday = jan1.getTime()
    const week =
        Math.floor((weekStart - firstFriday) / WEEK_MS) + 1

    return {
        year,
        week,
        isCurrent: true,
    }
}

export default function RaidpoolPage() {
    const [selection, setSelection] = useState(getCurrentRaidpoolSelection)

    return (
        <main className="min-h-screen max-w-screen-lg mx-auto px-6 py-36 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Raid Pool</h1>
                <p className="text-sm text-muted-foreground">
                    {selection?.isCurrent
                        ? "Current weekly loot rotation"
                        : `Historical data from Week ${selection?.week}, ${selection?.year}`}
                </p>
            </div>
            <DailyGambit />

            <LootTimeSelector value={
                selection ?? {
                    year: new Date().getFullYear(),
                    week: 1,
                    isCurrent: true,
                }
            }
                onChange={setSelection}
            />

            <AspectProvider>
                <RaidpoolProvider selection={selection}>
                    <LootDisplay />
                    {selection?.isCurrent && <ClassAspectFinder />}
                </RaidpoolProvider>
            </AspectProvider>
            {/* document max-w-screen-md */}
            {/* infomation max-w-screen-lg */}
        </main>
    )
}
