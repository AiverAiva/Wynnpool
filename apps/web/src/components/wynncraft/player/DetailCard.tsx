"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { ClassRaidChart, getRaidTotals } from "./DetailCardClassChart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MiscIcon } from "@/components/custom/WynnIcon"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const DetailCard: React.FC<{ title: string; playerData: any; }> = ({ title, playerData }) => {
    if (!playerData) return null
    const raidType = title.toLowerCase().includes("dungeon") ? "dungeons" : "raids"

    if (!playerData.characters) {
        console.log("true")
        //fall back to legacyStats
        return (
            raidType === "dungeons" ?
                <DungeonCard title="Dungeons Completed" dungeons={playerData.globalData.dungeons} />
                :
                <RaidCard title="Raids Completed" raids={playerData.globalData.raids} />

        )
    }
    const totals = getRaidTotals(playerData)
    const total = raidType === "dungeons" ? totals.dungeons : totals.raids

    if (total === 0) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="transition-all duration-150 hover:bg-accent cursor-pointer hover:scale-105">
                    <CardHeader className="p-4 flex flex-row justify-between item-center">
                        <div>
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <CardDescription className="text-2xl font-bold">{total}</CardDescription>
                        </div>
                        <ChevronDown className="h-6 w-6 self-center" />
                    </CardHeader>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <ScrollArea className='max-h-[65vh]'>
                    <DialogHeader>
                        <DialogTitle>{title} Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <ClassRaidChart playerData={playerData} raidType={raidType} />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}


const DungeonCard: React.FC<{ title: string, dungeons: any }> = ({ title, dungeons }) => {
    if (!dungeons || dungeons.total == 0) return
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className='transition-all duration-150 hover:bg-accent cursor-pointer hover:scale-105'>
                    <CardHeader className="p-4 flex flex-row justify-between item-center">
                        <div>
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <CardDescription className="text-2xl font-bold">{dungeons.total}</CardDescription>
                        </div>
                        <ChevronDown className='h-6 w-6 self-center' />
                    </CardHeader>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-w-screen-lg">
                <ScrollArea className='max-h-[65vh]'>
                    <DialogHeader>
                        <DialogTitle>Dungeon Details</DialogTitle>
                    </DialogHeader>
                    <DungeonStats dungeons={dungeons} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

const RaidCard: React.FC<{ title: string, raids: any }> = ({ title, raids }) => {
    if (!raids || raids.total == 0) return
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className='transition-all duration-150 hover:bg-accent cursor-pointer hover:scale-105'>
                    <CardHeader className="p-4 flex flex-row justify-between item-center">
                        <div>
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <CardDescription className="text-2xl font-bold">{raids.total}</CardDescription>
                        </div>
                        <ChevronDown className='h-6 w-6 self-center' />
                    </CardHeader>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-w-screen-lg">
                <DialogHeader>
                    <DialogTitle>Raids Details</DialogTitle>
                </DialogHeader>
                <RaidStats raids={raids} />
            </DialogContent>
        </Dialog>
    )
}

function RaidStats({ raids }: { raids: any }) {
    return (
        <section>
            <h3 className="font-semibold mb-2">Raids</h3>
            <div className="text-sm mb-4">
                Total Raids Completed: {raids.total}
            </div>
            <div className='grid sm:grid-cols-2 gap-4'>
                {Object.entries(raids.list).map(([name, count]) => (
                    <Card key={name} className='flex p-2 gap-2'>
                        <Image
                            src={`/icons/raid/${name}.webp`}
                            alt={name}
                            width={64}
                            height={64}
                        />
                        <div className='flex flex-row justify-between items-center w-full'>
                            <span>{name}</span>
                            <Badge variant="outline" className="m-1 py-2 px-4">
                                {count as number}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    )
}

function DungeonStats({ dungeons }: { dungeons: any }) {
    return (
        <section>
            <h3 className="font-semibold mb-2">Dungeons</h3>
            <div className="text-sm mb-4">
                Total Dungeons Completed: {dungeons.total}
            </div>
            <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-4'>
                {Object.entries(
                    Object.entries(dungeons.list).reduce<{
                        [key: string]: { normal: number; corrupted: number };
                    }>((acc, [name, count]) => {
                        const isCorrupted = name.startsWith("Corrupted ");
                        const baseName = isCorrupted ? name.replace("Corrupted ", "") : name;

                        if (!acc[baseName]) {
                            acc[baseName] = { normal: 0, corrupted: 0 };
                        }

                        if (isCorrupted) {
                            acc[baseName].corrupted += count as number;
                        } else {
                            acc[baseName].normal += count as number;
                        }

                        return acc;
                    }, {})
                ).map(([name, counts]) => (
                    <Card key={name} className='flex p-2 gap-2'>
                        <Image
                            src={`/icons/dungeon/${name.replace(' ', '_').replace('-', '_').replace("'s", '').toLowerCase()}.webp`}
                            alt={name}
                            width={72}
                            height={72}
                        />
                        <div className='flex justify-between items-center w-full'>
                            <span>{name}</span>
                            <div className='flex flex-col '>
                                {counts.normal > 0 && (
                                    <div className='flex gap-1 items-center'>
                                        <Badge variant="outline" className="m-1">
                                            <MiscIcon id='dungeon_key' size={24} />
                                            {counts.normal}
                                        </Badge>
                                    </div>
                                )}
                                {counts.corrupted > 0 && (
                                    <div className='flex gap-1 items-center'>
                                        <Badge variant="outline" className="mx-1">
                                            <MiscIcon id='corrupted_dungeon_key' size={24} />
                                            {counts.corrupted}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    )
}


export { DetailCard, RaidCard, DungeonCard, RaidStats, DungeonStats } 
