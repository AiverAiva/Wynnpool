'use client'

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { LootData } from "@/app/raidpool/_component/loot-display"
import { RaidpoolContext } from "../context/RaidpoolContext"

type Selection = {
    year: number
    week: number
    isCurrent: boolean
} | null

interface Props {
    selection: Selection
    children: React.ReactNode
}

export function RaidpoolProvider({ selection, children }: Props) {
    const [data, setData] = useState<LootData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    //     const value = useMemo(
    //   () => ({ data, loading, error }),
    //   [data, loading, error]
    // )

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            try {
                if (!selection) return
                const endpoint = selection.isCurrent
                    ? `/raidpool/`
                    : `/raidpool/${selection.year}/${selection.week}`

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
        <RaidpoolContext.Provider value={{ data, loading, error }}>
            {children}
        </RaidpoolContext.Provider>
    )
}
