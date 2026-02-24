"use client"

import { useEffect, useState } from "react"
import { Sword } from "lucide-react"
import api from "@/lib/api"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/custom_ui/tooltip"

interface Gambit {
  color: string
  description: string[]
  name: string
  timestamp: string
}

interface GambitData {
  day: number
  month: number
  year: number
  timestamp: string
  gambits: Gambit[]
}

const parseMinecraftColors = (text: string) => {
  return text
    .replace(/§7/g, '<span class="text-muted-foreground">')
    .replace(/§f/g, '<span class="text-foreground font-medium">')
    .replace(/§/g, "")
}

export function DailyGambit() {
  const [data, setData] = useState<GambitData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(api("/raidpool/gambits"))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch gambits")
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error || !data) return null

  return (
    <TooltipProvider>
      <div className="bg-muted/30 border border-border rounded-lg px-6 py-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sword className="h-4 w-4 text-muted-foreground" />
            Gambits
          </div>
          <div className="flex items-center justify-center gap-4">
            {data.gambits.map((gambit, idx) => (
              <Tooltip key={idx} delayDuration={50}>
                <TooltipTrigger asChild>
                  <div
                    className="w-4 h-4 rotate-45 border border-border hover:border-primary transition-colors cursor-default"
                    style={{ backgroundColor: gambit.color }}
                  >
                    <div className="w-full h-full -rotate-45 flex items-center justify-center text-[10px] font-medium text-background" />
                  </div>
                </TooltipTrigger>

                <TooltipContent
                  side="bottom"
                  className="max-w-xs bg-background border border-border p-3"
                >
                  <p className="text-xs font-medium mb-1">{gambit.name}</p>
                  <div className="space-y-1">
                    {gambit.description.map((line, i) => (
                      <p
                        key={i}
                        className="text-[11px] leading-snug"
                        dangerouslySetInnerHTML={{
                          __html: parseMinecraftColors(line),
                        }}
                      />
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {new Date(data.year, data.month - 1).toLocaleString("en-US", { month: "short" })}{" "}{data.day+1}
          </span>
        </div>

      </div>  
    </TooltipProvider>
  )
}
