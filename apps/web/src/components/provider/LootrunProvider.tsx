'use client'

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { LootrunContext, LootRunData } from "../context/LootrunContext"

type Selection = {
    year: number
    week: number
    isCurrent: boolean
} | null

interface Props {
    selection: Selection
    children: React.ReactNode
}

export function LootrunProvider({ selection, children }: Props) {
    const [data, setData] = useState<LootRunData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (!selection) return

            setLoading(true)
            setError(null)

            try {
                const endpoint = selection.isCurrent
                    ? `/lootrun`
                    : `/lootrun/${selection.year}/${selection.week}`

                const res = await fetch(api(endpoint))
                if (!res.ok) throw new Error("Fetch failed")

                const json = await res.json()
                setData(json)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error")
                setData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [selection])

    return (
        <LootrunContext.Provider value={{ data, loading, error }}>
            {children}
        </LootrunContext.Provider>
    )
}
