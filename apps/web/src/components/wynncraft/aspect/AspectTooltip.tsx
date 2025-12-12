'use client'

import { useState, ReactNode, cloneElement, isValidElement, MouseEvent } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AspectTier {
    threshold: number
    description: string[]
}

export interface Aspect {
    aspectId: string
    name: string
    rarity: string
    requiredClass: string
    tiers: Record<string, AspectTier>
    description: string
}

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
        if (tierKeys.length <= 1) return
        setInternalTierIndex((prev) => (prev + 1) % tierKeys.length)
    }

    // Clone children to inject onClick for tier cycling
    const trigger = isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
            onClick: (e: MouseEvent) => {
                cycleTier(e)
                // Call original onClick if present
                const original = (children as React.ReactElement<{ onClick?: (e: MouseEvent) => void }>).props.onClick
                if (typeof original === 'function') original(e)
            },
        })
        : children

    return (
        <TooltipProvider>
            <Tooltip open={open} onOpenChange={onOpenChange}>
                <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                <TooltipContent side="top" align="center" sideOffset={10} className="p-0">
                    <div className="bg-popover border border-border rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px]">
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
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
