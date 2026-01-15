'use client'

import { Aspect } from '@/types/aspectType'
import { useState, ReactNode, MouseEvent } from 'react'

interface AspectTooltipProps {
    aspect: Aspect
    /** Override tier selection from outside (optional) */
    tierIndex?: number
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: ReactNode
}

const getTierKeys = (aspect: Aspect) =>
    Object.keys(aspect.tiers).sort((a, b) => Number(a) - Number(b))

export function AspectTooltip({
    aspect,
    tierIndex: externalTierIndex,
    open,
    onOpenChange,
    children,
}: AspectTooltipProps) {
    const [internalTierIndex, setInternalTierIndex] = useState(0)
    const tierIndex = externalTierIndex ?? internalTierIndex
    const tierKeys = getTierKeys(aspect)

    const effectiveIndex = tierKeys.length ? tierIndex % tierKeys.length : 0
    const effectiveTierKey = tierKeys[effectiveIndex]
    const currentTier = effectiveTierKey ? aspect.tiers[effectiveTierKey] : null

    const cycleTier = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (tierKeys.length <= 1) return
        setInternalTierIndex((prev) => (prev + 1) % tierKeys.length)
    }

    const handleMouseEnter = () => onOpenChange?.(true)
    const handleMouseLeave = () => onOpenChange?.(false)
    const handleClick = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        // Only cycle tier if tooltip is already open, otherwise just open it
        if (open) {
            if (tierKeys.length > 1) {
                setInternalTierIndex((prev) => (prev + 1) % tierKeys.length)
            }
        }
        onOpenChange?.(true)
    }

    return (
        <div
            className="relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {children}
            {open && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                    <div className="bg-popover border border-border rounded-lg shadow-xl p-4 min-w-[400px] max-w-[600px]">
                        <p className="font-bold text-base mb-2">{aspect.name}</p>
                        {currentTier && (
                            <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    <span>
                                        Tier {effectiveTierKey} of {tierKeys.length}
                                    </span>
                                    <span className="text-[10px]">Threshold: {currentTier.threshold}</span>
                                </div>
                                <div className="space-y-1">
                                    {currentTier.description.map((desc, idx) => (
                                        <div
                                            key={`${aspect.name}-${effectiveTierKey}-${idx}`}
                                            className="leading-snug text-[12px]"
                                            dangerouslySetInnerHTML={{ __html: desc }}
                                        />
                                    ))}
                                </div>
                                {tierKeys.length > 1 && (
                                    <p className="text-[11px] text-muted-foreground mt-2 italic">Click to switch tier</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
