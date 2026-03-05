"use client"

import { Card } from "@/components/ui/card"
import { Snowflake } from "lucide-react"
import { useState, useEffect } from "react"

interface TimeLeft {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export function FestivalOfTheBlizzardCard() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  function calculateTimeLeft(): TimeLeft {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    let targetDate = new Date(`${currentYear}-10-10`)
    
    if (now > targetDate) {
      targetDate = new Date(`${currentYear + 1}-10-10`)
    }
    
    const difference = +targetDate - +now
    let timeLeft: TimeLeft = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    return timeLeft
  }

  const timerComponents = Object.keys(timeLeft).map((interval) => {
    const value = timeLeft[interval as keyof TimeLeft]
    if (value === undefined) {
      return null
    }

    return (
      <div key={interval} className="text-center">
        <span className="text-2xl md:text-3xl font-bold text-cyan-400">
          {String(value).padStart(2, '0')}
        </span>
        <span className="text-xs text-muted-foreground ml-1 capitalize">
          {interval}
        </span>
      </div>
    )
  })

  return (
    <Card
      className="
        col-span-4 md:col-span-2 row-span-2 
        border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-cyan-500/10
        p-4 md:p-6 
        bg-card/50 backdrop-blur-sm 
        border-2 
        transition-all duration-300 
        hover:scale-[1.02] 
        hover:shadow-lg 
        cursor-default
        group
        relative
        overflow-hidden
      "
    >
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://cdn.pixabay.com/photo/2012/10/10/17/23/winter-60780_1280.jpg)',
            filter: 'blur(2px)'
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-muted/50 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
            <Snowflake className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="font-bold text-lg md:text-xl text-foreground">
              Festival of the Blizzard
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Possibly around October 10-15
            </div>
          </div>

          {timerComponents.length ? (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {timerComponents}
            </div>
          ) : (
            <p className="text-lg text-center text-cyan-400">Event has arrived!</p>
          )}
        </div>
      </div>

      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  )
}
