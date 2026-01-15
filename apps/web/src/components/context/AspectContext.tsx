"use client"

import { Aspect } from "@/types/aspectType"
import { createContext, useContext } from "react"

export interface AspectContextValue {
    aspectByName: Map<string, Aspect>
    getAspect: (name: string) => Aspect | undefined
}

export const AspectContext = createContext<AspectContextValue | null>(null)

export function useAspect() {
    const ctx = useContext(AspectContext)
    if (!ctx) {
        throw new Error("useAspect must be used inside <AspectProvider />")
    }
    return ctx
}