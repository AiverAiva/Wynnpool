'use client'

import { createContext, useContext } from "react"

export interface Item {
    name: string
    amount: number
    itemType: string
    rarity: string
    subtype: string
    icon: { format: string; value: string } | null
    shiny?: boolean
    shinyStat?: {
        shinyRerolls: number
        statType: {
            displayName: string
            id: number
            key: string
            statUnit: string
        }
        value: number
    } | null
}

export interface Region {
    items: Item[]
    region: string
    timestamp: string
    type: string
}

export interface LootRunData {
    _id: string
    regions: Region[]
    week: number
    year: number
}

interface LootrunState {
    data: LootRunData | null
    loading: boolean
    error: string | null
}

export const LootrunContext = createContext<LootrunState | null>(null)

export function useLootrun() {
    const ctx = useContext(LootrunContext)
    if (!ctx) {
        throw new Error("useLootrun must be used within LootrunProvider")
    }
    return ctx
}
