"use client"

import { Clock, Info, ExternalLink } from "lucide-react"
import Link from "next/link"

export function LootrunItemHistory() {
    return (
        <div className="relative overflow-hidden border border-border rounded-xl bg-zinc-950/20 p-6 space-y-4">
            <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                        Lootrun History revamping, work in progress
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        We are currently rebuilding the history system to provide more detailed analytics and better visualization.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400">
                <Info className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs">
                    if you want to access it now, head to{" "}
                    <Link
                        href="/lootrun/legacy/"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        prefetch={false}
                    >
                        /lootrun/legacy/
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                    , but its no longer being maintained.
                </p>
            </div>
        </div>
    )
}
