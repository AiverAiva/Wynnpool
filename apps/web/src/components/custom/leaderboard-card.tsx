"use client"

import { Card } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import Link from "next/link"

export function LeaderboardCard() {
    return (
        <Card
            className="
                col-span-2 row-span-2 
                border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/10
                p-4 md:p-6 
                bg-card/50 backdrop-blur-sm 
                border-2 
                transition-all duration-300 
                hover:scale-[1.02] 
                hover:shadow-lg 
                cursor-pointer
                group
                relative
                overflow-hidden
        "
        >
            <Link href={'/stats/leaderboard'} prefetch={false}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-muted/50 text-amber-500 group-hover:scale-110 transition-transform duration-300">
                            <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        {/* <div className="text-right">
            <div className="text-xs font-medium text-amber-500">#1</div>
          </div> */}
                    </div>

                    <div className="space-y-1">
                        <div className="font-bold text-lg md:text-xl text-foreground group-hover:text-amber-500 transition-all duration-300">
                            Leaderboard
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">View Leaderboard</div>
                    </div>
                </div>
            </Link >
        </Card>
    )
}
