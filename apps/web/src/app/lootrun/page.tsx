'use client';

import { useState } from "react";
import { LootRunDisplay } from "./_component/loot-display";
import { LootTimeSelector } from "./_component/loot-time-selector";
// import { AspectProvider } from "@/components/provider/AspectProvider";
import { LootrunProvider } from "@/components/provider/LootrunProvider";
import { getLootpoolYearWeek } from "@/lib/dateUtils";

import { LootrunItemHistory } from "./_component/loot-item-history";

type Selection = {
    year: number
    week: number
    isCurrent: boolean
} | null

export function getCurrentLootpoolSelection(): Selection {
    const { year, week } = getLootpoolYearWeek(new Date());

    return {
        year,
        week,
        isCurrent: true,
    }
}

export default function LootrunPage() {
    const [selection, setSelection] = useState<Selection>(getCurrentLootpoolSelection)

    return (
        <main className="min-h-screen max-w-screen-lg mx-auto px-6 py-36 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Lootrun pool</h1>
                <p className="text-sm text-muted-foreground">
                    {selection?.isCurrent
                        ? "Current weekly loot rotation"
                        : `Historical data from Week ${selection?.week}, ${selection?.year}`}
                </p>
            </div>

            <LootTimeSelector value={
                selection ?? {
                    year: new Date().getFullYear(),
                    week: 1,
                    isCurrent: true,
                }
            }
                onChange={setSelection}
            />


            <LootrunProvider selection={selection}>
                <LootRunDisplay />
            </LootrunProvider>
            <LootrunItemHistory />
        </main>
    )
}
