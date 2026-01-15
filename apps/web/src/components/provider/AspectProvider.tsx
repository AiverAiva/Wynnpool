"use client"

import { Aspect } from "@/types/aspectType"
import { useEffect, useMemo, useState } from "react"
import { AspectContext } from "../context/AspectContext"
import api from "@/lib/api"

export function AspectProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [aspects, setAspects] = useState<Aspect[]>([])

    useEffect(() => {
        let cancelled = false

        async function load() {
            const res = await fetch(api("/aspect/list"))
            const data: Aspect[] = await res.json()
            if (!cancelled) {
                setAspects(data)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    const aspectByName = useMemo(() => {
        return new Map(aspects.map(aspect => [aspect.name, aspect]))
    }, [aspects])

    const value = useMemo(
        () => ({
            aspectByName,
            getAspect: (name: string) => aspectByName.get(name),
        }),
        [aspectByName],
    )

    return (
        <AspectContext.Provider value={value}>
            {children}
        </AspectContext.Provider>
    )
}
