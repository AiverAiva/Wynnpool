"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dice1Icon as Dice, RefreshCw, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { CombatItem, Item } from "@/types/itemType"
import { ItemIcon } from "@/components/custom/WynnIcon"
import { getIdentificationInfo, getRollPercentageColor, processIdentification } from "@/lib/itemUtils"
import { IdentificationStat, ItemAnalyzeData } from "../wynncraft/item/RolledItemDisplay"
import { RolledIdentifications } from "../wynncraft/item/Identifications"

interface ItemRollSimulatorProps {
    item: CombatItem
    trigger?: React.ReactNode
}

interface RolledIdentificationType {
    key: string
    displayName: string
    unit: string
    min: number
    max: number
    raw: number
    current: number
    percentage: number
}

const ItemRollSimulator: React.FC<ItemRollSimulatorProps> = ({ item, trigger }) => {
    const [rolledItem, setRolledItem] = useState<Item>({ ...item })
    const [RolledIdentificationss, setRolledIdentificationss] = useState<IdentificationStat[]>([])
    const [rolledIds, setRolledIds] = useState<RolledIdentificationType[]>([])
    const [isRolling, setIsRolling] = useState(false)

    // Initialize rolled identifications
    useEffect(() => {
        simulateRoll()
    }, [item])

    // Roll a single identification

    const simulateRoll = () => {
        const result: Record<string, number> = {};

        if (!item.identifications) return
        for (const [key, value] of Object.entries(item.identifications)) {
            // Only roll for identifications that are objects (not flat values like rawStrength)
            if (typeof value === "object" && value !== null && 'raw' in value) {
                let base = value.raw;

                // Determine if it's a positive or negative identification
                let isNegative = base < 0;
                let isCost = key.toLowerCase().includes("cost");

                // Invert polarity if it's a cost
                if (isCost) isNegative = !isNegative;

                let roll;
                if (isNegative) {
                    // For negative IDs, roll from 1.3x down to 0.7x
                    roll = (Math.random() * (130 - 70) + 70)
                } else {
                    // For positive IDs, roll from 0.3x up to 1.3x
                    roll = (Math.random() * (130 - 30) + 30)
                }

                // Round to nearest integer
                result[key] = Math.round(roll);
            }
        }

        const data: ItemAnalyzeData = {
            'original': item,
            'input': { 'identifications': result, 'itemName': item.internalName }
        }

        return setRolledIdentificationss(processIdentification(data))
    }

    // Update the rolled item with new identification values
    const updateRolledItem = (newRolledIds: RolledIdentificationType[]) => {
        const newIdentifications: Record<string, number | { min: number; max: number; raw: number }> = {}

        newRolledIds.forEach((id) => {
            if (id.min === id.max) {
                newIdentifications[id.key] = id.current
            } else {
                newIdentifications[id.key] = {
                    min: id.min,
                    max: id.max,
                    raw: id.raw,
                }
            }
        })

        setRolledItem({
            ...rolledItem,
            identifications: newIdentifications,
        })
    }

    // Handle manual slider change
    const handleSliderChange = (index: number, value: number[]) => {
        const newRolledIds = [...rolledIds]
        const id = newRolledIds[index]

        id.current = value[0]
        id.percentage = Math.round(((id.current - id.min) / (id.max - id.min)) * 100)

        setRolledIds(newRolledIds)
        updateRolledItem(newRolledIds)
    }

    // Check if a stat is inverted (where lower is better)
    const isInvertedStat = (key: string) => {
        return (
            key.toLowerCase().includes("cost") ||
            key.toLowerCase().includes("mana") ||
            key.toLowerCase().includes("walkspeed")
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Dice className="h-4 w-4" /> Roll Simulator
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Item Roll Simulator</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1" onClick={simulateRoll} disabled={isRolling}>
                                <Dice className="h-3.5 w-3.5" /> Roll All
                            </Button>
                            {/* <Button variant="outline" size="sm" className="gap-1" onClick={perfectRoll}>
                                <Sparkles className="h-3.5 w-3.5" /> Perfect Roll
                            </Button> */}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Item Preview */}
                    <Card className="md:col-span-1 h-fit">
                        <CardContent className="p-4">
                            <div className="flex flex-col items-center">
                                <div className="relative my-2">
                                    <ItemIcon item={rolledItem} size={64} className="w-16 h-16" />
                                </div>
                                <h3 className="text-lg font-medium text-center">{rolledItem.internalName}</h3>
                                {"rarity" in rolledItem && (
                                    <Badge className="mt-1">
                                        <p className="font-thin">
                                            {(rolledItem as any).rarity.charAt(0).toUpperCase() + (rolledItem as any).rarity.slice(1)} Item
                                        </p>
                                    </Badge>
                                )}
                                <div className="text-xs text-center mt-2 text-muted-foreground">
                                    {rolledItem.type === "weapon" &&
                                        "weaponType" in rolledItem &&
                                        "attackSpeed" in rolledItem &&
                                        `${(rolledItem as any).weaponType} - ${(rolledItem as any).attackSpeed.replace("_", " ")}`}
                                </div>
                            </div>

                            <Separator className="my-3" />

                            <div className="space-y-2 text-sm">
                                {/* Base Stats */}
                                {rolledItem.base &&
                                    Object.entries(rolledItem.base).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span>{key.replace("base", "").replace("Damage", " Damage")}:</span>
                                            <span>{typeof value === "number" ? value : `${value.min}-${value.max}`}</span>
                                        </div>
                                    ))}

                                {/* Requirements */}
                                {rolledItem.requirements && (
                                    <>
                                        <Separator className="my-2" />
                                        {Object.entries(rolledItem.requirements).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span>{key === "classRequirement" ? "Class" : key}:</span>
                                                <span>{String(value)}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {rolledItem.lore && (
                                <>
                                    <Separator className="my-3" />
                                    <p className="text-xs italic text-muted-foreground">{rolledItem.lore}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Roll Controls */}

                    <Card className="md:col-span-2">
                        <CardContent className="p-4">
                            <h3 className="font-medium mb-3">Identification Rolls</h3>
                            <div className="font-ascii">
                                <RolledIdentifications stats={RolledIdentificationss} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ItemRollSimulator

