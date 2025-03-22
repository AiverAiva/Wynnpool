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
import { getIdentificationInfo, type Item } from "@/types/itemType"
import { ItemIcon } from "@/components/custom/WynnIcon"

interface ItemRollSimulatorProps {
    item: Item
    trigger?: React.ReactNode
}

interface RolledIdentification {
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
    const [rolledIds, setRolledIds] = useState<RolledIdentification[]>([])
    const [isRolling, setIsRolling] = useState(false)

    // Initialize rolled identifications
    useEffect(() => {
        if (item.identifications) {
            const initialRolls = Object.entries(item.identifications).map(([key, value]) => {
                const idInfo = getIdentificationInfo(key) || { displayName: key, unit: "" }

                // Handle both number and range values
                if (typeof value === "number") {
                    return {
                        key,
                        displayName: idInfo.displayName,
                        unit: idInfo.unit || "",
                        min: value,
                        max: value,
                        raw: value,
                        current: value,
                        percentage: 100,
                    }
                } else {
                    // Calculate a random value between min and max for initial state
                    const current = Math.floor(Math.random() * (value.max - value.min + 1)) + value.min
                    const range = value.max - value.min
                    const percentage = range === 0 ? 100 : Math.round(((current - value.min) / range) * 100)

                    return {
                        key,
                        displayName: idInfo.displayName,
                        unit: idInfo.unit || "",
                        min: value.min,
                        max: value.max,
                        raw: value.raw,
                        current,
                        percentage,
                    }
                }
            })

            setRolledIds(initialRolls)
        }
    }, [item])

    // Roll a single identification
    const rollSingleId = (index: number) => {
        const newRolledIds = [...rolledIds]
        const id = newRolledIds[index]

        // Only roll if there's a range
        if (id.min !== id.max) {
            id.current = Math.floor(Math.random() * (id.max - id.min + 1)) + id.min
            id.percentage = Math.round(((id.current - id.min) / (id.max - id.min)) * 100)
        }

        setRolledIds(newRolledIds)
        updateRolledItem(newRolledIds)
    }

    // Roll all identifications
    const rollAllIds = () => {
        setIsRolling(true)

        // Create animation effect with multiple rolls
        let rollCount = 0
        const maxRolls = 4
        const interval = setInterval(() => {
            const newRolledIds = rolledIds.map((id) => {
                if (id.min === id.max) return id

                const current = Math.floor(Math.random() * (id.max - id.min + 1)) + id.min
                const percentage = Math.round(((current - id.min) / (id.max - id.min)) * 100)

                return {
                    ...id,
                    current,
                    percentage,
                }
            })

            setRolledIds(newRolledIds)

            rollCount++
            if (rollCount >= maxRolls) {
                clearInterval(interval)
                setIsRolling(false)
                updateRolledItem(newRolledIds)
            }
        }, 50)
    }

    // Perfect roll - set all values to maximum
    const perfectRoll = () => {
        const newRolledIds = rolledIds.map((id) => ({
            ...id,
            current: id.max,
            percentage: 100,
        }))

        setRolledIds(newRolledIds)
        updateRolledItem(newRolledIds)
    }

    // Update the rolled item with new identification values
    const updateRolledItem = (newRolledIds: RolledIdentification[]) => {
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

    // Get color based on roll percentage
    const getRollColor = (percentage: number, inverted = false) => {
        if (inverted) percentage = 100 - percentage

        if (percentage >= 96) return "text-cyan-500"
        if (percentage >= 80) return "text-green-500"
        if (percentage >= 60) return "text-yellow-400"
        if (percentage >= 40) return "text-amber-400"
        if (percentage >= 20) return "text-orange-500"
        return "text-red-500"
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
                            <Button variant="outline" size="sm" className="gap-1" onClick={rollAllIds} disabled={isRolling}>
                                <Dice className="h-3.5 w-3.5" /> Roll All
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1" onClick={perfectRoll}>
                                <Sparkles className="h-3.5 w-3.5" /> Perfect Roll
                            </Button>
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

                            <div className="space-y-4">
                                {rolledIds.map((id, index) => {
                                    // const inverted = isInvertedStat(id.key)
                                    const rollColor = getRollColor(id.percentage, false) //inverted

                                    return (
                                        <div key={id.key} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{id.displayName}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium">
                                                        {id.current}
                                                        {id.unit}
                                                    </div>
                                                    {id.min !== id.max && (
                                                        <span className={cn("text-sm font-medium", rollColor)}>
                                                            [{id.percentage}%]
                                                        </span>
                                                    )}
                                                    {/* <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => rollSingleId(index)}
                            disabled={id.min === id.max}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button> */}
                                                </div>
                                            </div>

                                            {id.min !== id.max && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground w-8">
                                                        {id.min}
                                                        {id.unit}
                                                    </span>
                                                    <div className="flex-1" />
                                                    {/* <Slider
                            value={[id.current]}
                            min={id.min}
                            max={id.max}
                            step={1}
                            className="flex-1"
                            onValueChange={(value) => handleSliderChange(index, value)}
                          /> */}
                                                    <span className="text-xs text-muted-foreground w-8">
                                                        {id.max}
                                                        {id.unit}
                                                    </span>
                                                </div>
                                            )}

                                            {/* {id.min !== id.max && (
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              id.percentage >= 90
                                ? "bg-green-500"
                                : id.percentage >= 75
                                  ? "bg-emerald-400"
                                  : id.percentage >= 50
                                    ? "bg-amber-400"
                                    : id.percentage >= 25
                                      ? "bg-orange-500"
                                      : "bg-red-500",
                            )}
                            style={{ width: `${id.percentage}%` }}
                          ></div>
                        </div>
                      )} */}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* <div className="mt-6 flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    Tip: Click on individual refresh buttons or use the sliders to fine-tune rolls
                                </div>
                                <Button variant="default" className="gap-2" onClick={rollAllIds} disabled={isRolling}>
                                    <Zap className="h-4 w-4" />
                                    {isRolling ? "Rolling..." : "Roll All"}
                                </Button>
                            </div> */}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ItemRollSimulator

