'use client'

import { LootData } from "@/app/raidpool/_component/loot-display"
import { createContext, useContext } from "react"

interface RaidpoolState {
    data: LootData | null
    loading: boolean
    error: string | null
}

export const RaidpoolContext = createContext<RaidpoolState | null>(null)

export function useRaidpool() {
    const ctx = useContext(RaidpoolContext)
    if (!ctx) {
        throw new Error("useRaidpool must be used within RaidpoolProvider")
    }
    return ctx
}
