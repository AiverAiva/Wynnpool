"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { MiscIcon } from "@/components/custom/WynnIcon"

// Convert first 6 chars of the ID into a hex color
function getHexColorFromId(id: string) {
    const shortId = id.slice(0, 6); // first 6 chars
    let hash = 0;

    for (let i = 0; i < shortId.length; i++) {
        hash = shortId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert hash to RGB values
    const r = (hash >> 16) & 0xff;
    const g = (hash >> 8) & 0xff;
    const b = hash & 0xff;

    // Convert to hex color string
    return `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .padStart(6, "0")}`;
}

interface CharacterRaidData {
    characterId: string
    class: string
    reskin?: string
    nickname?: string
    level: number
    count: number
    percentage: number
}

interface IndividualRaidData {
    raidName: string
    total: number
    characterBreakdown: CharacterRaidData[]
    type?: "normal" | "corrupted"
}

interface ClassRaidChartProps {
    playerData: any
    raidType: "raids" | "dungeons"
}

export function ClassRaidChart({ playerData, raidType }: ClassRaidChartProps) {
    const [hoveredSegment, setHoveredSegment] = useState<{
        raidName: string
        characterData: CharacterRaidData
        anchorRect?: DOMRect | null
        total?: number
        parentName?: string
        parentType?: "normal" | "corrupted"
        pinned?: boolean
    } | null>(null)

    // Close pinned tooltip when clicking/tapping outside tooltip or segments
    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (!hoveredSegment || !hoveredSegment.pinned) return
            const target = e.target as HTMLElement | null
            if (!target) return
            if (target.closest('[data-tooltip]') || target.closest('[data-tooltip-seg]')) return
            setHoveredSegment(null)
        }

        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [hoveredSegment])

    const calculateTotal = (): number => {
        return Object.values(playerData.characters).reduce(
            (sum: number, char: any) => sum + (char[raidType]?.total || 0),
            0,
        )
    }

    const processRaidData = (): IndividualRaidData[] => {
        const raidMap = new Map<string, CharacterRaidData[]>()

        Object.entries(playerData.characters).forEach(([characterId, char]: [string, any]) => {
            const charRaids = char[raidType]?.list || {}
            const classType = char.type as string // Updated to string
            const reskin = char.reskin
            const nickname = char.nickname
            const level = char.level

            Object.entries(charRaids).forEach(([raidName, count]) => {
                if (count as number > 0) {
                    let processedRaidName = raidName
                    if (raidType === "dungeons") {
                        const isCorrupted = raidName.startsWith("Corrupted ")
                        const baseName = isCorrupted ? raidName.replace("Corrupted ", "") : raidName
                        processedRaidName = isCorrupted ? `${baseName}|corrupted` : `${baseName}|normal`
                    }

                    if (!raidMap.has(processedRaidName)) {
                        raidMap.set(processedRaidName, [])
                    }

                    raidMap.get(processedRaidName)!.push({
                        characterId,
                        class: classType,
                        reskin,
                        nickname,
                        level,
                        count: count as number,
                        percentage: 0, // Will be calculated later
                    })
                }
            })
        })

        const processedData = Array.from(raidMap.entries())
            .map(([raidKey, characters]) => {
                const total = characters.reduce((sum, char) => sum + char.count, 0)
                const characterBreakdown = characters.map((char) => ({
                    ...char,
                    percentage: total > 0 ? (char.count / total) * 100 : 0,
                }))

                let raidName = raidKey
                let type: "normal" | "corrupted" | undefined = undefined

                if (raidType === "dungeons" && raidKey.includes("|")) {
                    const [baseName, dungeonType] = raidKey.split("|")
                    raidName = baseName
                    type = dungeonType as "normal" | "corrupted"
                }

                return {
                    raidName,
                    total,
                    characterBreakdown: characterBreakdown.sort((a, b) => b.count - a.count),
                    type,
                }
            })
            .filter((raid) => raid.total > 0)

        if (raidType === "dungeons") {
            const groupedDungeons = new Map<string, IndividualRaidData[]>()

            processedData.forEach((dungeon) => {
                if (!groupedDungeons.has(dungeon.raidName)) {
                    groupedDungeons.set(dungeon.raidName, [])
                }
                groupedDungeons.get(dungeon.raidName)!.push(dungeon)
            })

            return Array.from(groupedDungeons.entries())
                .map(([dungeonName, dungeonVariants]) => {
                    const totalForDungeon = dungeonVariants.reduce((sum, variant) => sum + variant.total, 0)
                    return { dungeonName, dungeonVariants, totalForDungeon }
                })
                .sort((a, b) => b.totalForDungeon - a.totalForDungeon)
                .flatMap(({ dungeonVariants }) =>
                    dungeonVariants.sort((a, b) => {
                        if (a.type === "normal" && b.type === "corrupted") return -1
                        if (a.type === "corrupted" && b.type === "normal") return 1
                        return b.total - a.total
                    }),
                )
        }

        return processedData.sort((a, b) => b.total - a.total)
    }

    const raidData = processRaidData()
    const total = calculateTotal()

    if (raidData.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">No {raidType} data available</CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="text-sm">Total Completed: {total}</div>
            {raidType === "dungeons" ? (
                /* 
                
                Dungeon part start 
                
                */
                <div className="flex flex-col space-y-6">
                    {Object.entries(
                        raidData.reduce((acc: { [key: string]: IndividualRaidData[] }, raid) => {
                            if (!acc[raid.raidName]) {
                                acc[raid.raidName] = []
                            }
                            acc[raid.raidName].push(raid)
                            return acc
                        }, {}),
                    ).map(([dungeonName, dungeonVariants]) => (
                        <Card key={dungeonName} className="p-3 gap-2 w-full">
                            <div className="flex">
                                <div>
                                    <Image
                                        src={`/icons/dungeon/${dungeonName.replace(' ', '_').replace('-', '_').replace("'s", '').toLowerCase()}.webp`}
                                        alt={dungeonName}
                                        width={108}
                                        height={108}
                                    />
                                </div>
                                <div className="flex flex-col w-full space-y-2 justify-start ml-3">
                                    <h3 className="font-semibold text-base">{dungeonName}</h3>
                                    {dungeonVariants.map((dungeon) => (
                                        <div key={`${dungeonName}-${dungeon.type}`} className="flex space-x-2 items-center">
                                            <Badge variant="outline" className="w-16 sm:w-24 h-6 flex items-center justify-center rounded-full">
                                                {dungeon.type === "normal" ?
                                                    <MiscIcon id='dungeon_key' size={24} />
                                                    :
                                                    <MiscIcon id='corrupted_dungeon_key' size={24} />
                                                }
                                                {dungeon.total}
                                            </Badge>
                                            <div className="w-full">
                                                <div className="relative">
                                                    <div className="flex h-4 rounded-full overflow-hidden border bg-muted">
                                                        {dungeon.characterBreakdown.map((characterData, index) => {
                                                            const colorHex = getHexColorFromId(characterData.characterId);
                                                            return (
                                                                <div
                                                                    key={`${dungeon.raidName}-${characterData.characterId}-${index}`}
                                                                    className="relative cursor-pointer transition-color duration-200 hover:brightness-125"
                                                                    style={{
                                                                        backgroundColor: colorHex,
                                                                        width: `${characterData.percentage}%`,
                                                                        minWidth: characterData.percentage > 0 ? "2px" : "0",
                                                                    }}
                                                                            onMouseEnter={(e) => {
                                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                                                                setHoveredSegment({
                                                                                    raidName: `${dungeonName} (${dungeon.type})`,
                                                                                    characterData,
                                                                                    anchorRect: rect,
                                                                                    total: dungeon.total,
                                                                                    parentName: dungeonName,
                                                                                    parentType: dungeon.type,
                                                                                })
                                                                            }}
                                                                            onMouseLeave={() => {
                                                                                // only clear if not pinned
                                                                                if (!hoveredSegment?.pinned) setHoveredSegment(null)
                                                                            }}
                                                                            onPointerDown={(e) => {
                                                                                e.preventDefault()
                                                                                e.stopPropagation()
                                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                                                                setHoveredSegment(prev => {
                                                                                    const isSame = prev && prev.characterData.characterId === characterData.characterId && prev.raidName === `${dungeonName} (${dungeon.type})`
                                                                                    if (isSame) return null
                                                                                    return {
                                                                                        raidName: `${dungeonName} (${dungeon.type})`,
                                                                                        characterData,
                                                                                        anchorRect: rect,
                                                                                        total: dungeon.total,
                                                                                        parentName: dungeonName,
                                                                                        parentType: dungeon.type,
                                                                                        pinned: true,
                                                                                    }
                                                                                })
                                                                            }}
                                                                            data-tooltip-seg
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                    
                                                </div>
                                            </div>

                                            {/* <div className="flex flex-wrap gap-2 text-xs">
                                                {dungeon.characterBreakdown.map((characterData, index) => (
                                                    <div
                                                        key={`legend-${dungeonName}-${dungeon.type}-${characterData.characterId}-${index}`}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <div
                                                            className={`w-2 h-2 rounded-full`}
                                                            style={{
                                                                backgroundColor: getHexColorFromId(characterData.characterId),
                                                            }}
                                                        //  ${getColorClasses(generateCharacterColor(characterData.characterId))}
                                                        />
                                                        <span className="text-muted-foreground">
                                                            {characterData.reskin || characterData.class} Lv.{characterData.level}:{" "}
                                                            {characterData.count}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div> */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (

                /*
                
                STart of raid part
                
                */
                raidData.map((raid) => (
                    <Card key={raid.raidName} className="p-3 gap-2 w-full">
                        <div className="flex items-center">
                            <div>
                                <Image
                                    src={`/icons/raid/${raid.raidName}.webp`}
                                    alt={raid.raidName}
                                    width={108}
                                    height={108}
                                />
                            </div>
                            <div className="w-full ml-3 space-y-3">
                                <h3 className="font-semibold text-base">{raid.raidName}</h3>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="w-16 sm:w-24 h-6 flex items-center justify-center rounded-full">
                                        {raid.total}
                                    </Badge>
                                    <div className="flex-grow">
                                        <div className="relative">
                                            <div className="flex h-4 rounded-full overflow-hidden border bg-muted">
                                                {raid.characterBreakdown.map((characterData, index) => {
                                                    const colorHex = getHexColorFromId(characterData.characterId);
                                                    return (
                                                        <div
                                                            key={`${raid.raidName}-${characterData.characterId}-${index}`}
                                                            className="relative cursor-pointer transition-all duration-200 hover:brightness-110"
                                                            style={{
                                                                backgroundColor: colorHex,
                                                                width: `${characterData.percentage}%`,
                                                                minWidth: characterData.percentage > 0 ? "2px" : "0",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                                                setHoveredSegment({
                                                                    raidName: raid.raidName,
                                                                    characterData,
                                                                    anchorRect: rect,
                                                                    total: raid.total,
                                                                    parentName: raid.raidName,
                                                                })
                                                            }}
                                                            onMouseLeave={() => {
                                                                if (!hoveredSegment?.pinned) setHoveredSegment(null)
                                                            }}
                                                            onPointerDown={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                                                setHoveredSegment(prev => {
                                                                    const isSame = prev && prev.characterData.characterId === characterData.characterId && prev.raidName === raid.raidName
                                                                    if (isSame) return null
                                                                    return {
                                                                        raidName: raid.raidName,
                                                                        characterData,
                                                                        anchorRect: rect,
                                                                        total: raid.total,
                                                                        parentName: raid.raidName,
                                                                        pinned: true,
                                                                    }
                                                                })
                                                            }}
                                                            data-tooltip-seg
                                                        />
                                                    )
                                                })}
                                            </div>
                                            
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                        {/* 
                        <div className="flex flex-wrap gap-2 text-xs">
                            {raid.characterBreakdown.map((characterData, index) => (
                                <div
                                    key={`legend-${raid.raidName}-${characterData.characterId}-${index}`}
                                    className="flex items-center gap-1"
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full`}
                                        style={{
                                            backgroundColor: getHexColorFromId(characterData.characterId),
                                        }}
                                    //  ${getColorClasses(generateCharacterColor(characterData.characterId))}
                                    />
                                    <span className="text-muted-foreground">
                                        {characterData.reskin || characterData.class} Lv.{characterData.level}: {characterData.count}
                                    </span>
                                </div>
                            ))}
                        </div> */}
                    </Card>
                ))
            )}
            {/* </CardContent>
            </Card> */}
            {hoveredSegment && (
                <PortalTooltip anchorRect={hoveredSegment.anchorRect ?? null} interactive={!!hoveredSegment.pinned}>
                    <div data-tooltip>
                        <Card className="shadow-lg border-2" >
                        <CardContent className="p-3 min-w-56">
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className={`w-3 h-3 rounded-full`}
                                    style={{
                                        backgroundColor: getHexColorFromId(hoveredSegment.characterData.characterId),
                                    }}
                                />
                                <span className="font-semibold">
                                    {hoveredSegment.characterData.reskin || hoveredSegment.characterData.class}
                                </span>
                            </div>
                            <div className="text-sm space-y-1">
                                <div>
                                    <span className="text-muted-foreground">Class:</span>{" "}
                                    <span className="font-medium">{hoveredSegment.characterData.class}</span>
                                    {hoveredSegment.characterData.reskin && (
                                        <span className="text-muted-foreground"> ({hoveredSegment.characterData.reskin})</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Combat Level:</span>{" "}
                                    <span className="font-medium">{hoveredSegment.characterData.level}</span>
                                </div>
                                {hoveredSegment.characterData.nickname && (
                                    <div>
                                        <span className="text-muted-foreground">Nickname:</span>{" "}
                                        <span className="font-medium">{hoveredSegment.characterData.nickname}</span>
                                    </div>
                                )}
                                <div className="border-t pt-1 mt-2">
                                    <div>
                                        <span className="text-muted-foreground">Completions:</span>{" "}
                                        <span className="font-medium">{hoveredSegment.characterData.count}</span>
                                    </div>
                                </div>
                                <div className="text-xs mt-1">
                                    <span className="font-medium">{hoveredSegment.characterData.percentage.toFixed(1)}%</span>
                                    <span className="text-muted-foreground"> of {hoveredSegment.total} total {hoveredSegment.parentType === "corrupted" ? "Corrupted " : ""}{hoveredSegment.parentName} completions</span>
                                </div>
                            </div>
                        </CardContent>
                        </Card>
                    </div>
                </PortalTooltip>
            )}
        </div>
    )
}

function PortalTooltip({ anchorRect, children, interactive = false }: { anchorRect?: DOMRect | null; children: React.ReactNode; interactive?: boolean }) {
    if (!anchorRect) return null

    // tweak these to nudge the tooltip (px)
    const OFFSET_X = 0 // positive moves right
    const OFFSET_Y = 20 // negative moves up, positive moves down

    const computedLeft = anchorRect.left + anchorRect.width / 2 + OFFSET_X
    const computedTop = anchorRect.top + OFFSET_Y

    const style: React.CSSProperties = {
        position: "fixed",
        left: computedLeft,
        top: computedTop,
        transform: "translate(-50%, 0)",
        zIndex: 9999,
        pointerEvents: interactive ? "auto" : "none",
    }

    return createPortal(
        <div style={style}>
            {children}
        </div>,
        // eslint-disable-next-line no-restricted-globals
        typeof document !== "undefined" ? document.body : (null as any),
    )
}

export function getRaidTotals(playerData: any): { raids: number; dungeons: number } {
    const raids = Object.values(playerData.characters).reduce(
        (sum: number, char: any) => sum + (char.raids?.total || 0),
        0,
    )
    const dungeons = Object.values(playerData.characters).reduce(
        (sum: number, char: any) => sum + (char.dungeons?.total || 0),
        0,
    )
    return { raids, dungeons }
}
