"use client"

import { Card } from "@/components/ui/card"
import { Crown } from "lucide-react"
import { useState, useEffect } from "react"

interface SeasonRatingCardProps {
  onClick: () => void
}

export function SeasonRatingCard({ onClick }: SeasonRatingCardProps) {
  const [currentSeason, setCurrentSeason] = useState<number>(26)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchCurrentSeason = async () => {
      try {
        const response = await fetch("http://localhost:8000/guild/current-season")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setCurrentSeason(data.currentSeason)
      } catch (error) {
        console.log("[v0] API not available, using fallback season 26. Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentSeason()
  }, [])

  return (
    <Card
      onClick={onClick}
      className="
        col-span-2 row-span-2 md:col-span-3 md:row-span-2
        border-primary/20 hover:border-primary/40 hover:shadow-primary/10
        p-4 md:p-6 
        bg-gradient-to-br from-primary/10 via-card/50 to-secondary/10
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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300 text-primary">
            <Crown className="w-5 h-5 md:w-6 md:h-6 group-hover:text-primary transition-all duration-300" />
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-primary group-hover:text-primary/80 transition-colors duration-300">
              View Rankings
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-2">
              <div className="w-24 h-8 bg-muted rounded animate-pulse" />
              <div className="w-20 h-4 bg-muted/70 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="font-bold text-xl md:text-2xl text-primary group-hover:text-primary/90 group-hover:scale-105 transition-all duration-300">
                Season {currentSeason}
              </div>
              <div className="text-sm font-medium text-primary/70 group-hover:text-primary/60 transition-colors duration-300">
                Guild Season Rating
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  )
}
