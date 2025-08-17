"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { ClassRaidChart, getRaidTotals } from "./DetailCardClassChart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DungeonCard, RaidCard } from "@/app/stats/player/[playerName]/page"

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

export { DetailCard }
