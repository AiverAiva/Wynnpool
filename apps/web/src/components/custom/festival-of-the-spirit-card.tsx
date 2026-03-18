"use client"

import { Card } from "@/components/ui/card"
import { Ghost } from "lucide-react"
import { useState, useEffect } from "react"

export function FestivalOfTheSpiritCard() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [])

  function calculateTimeLeft() {
    const now = new Date()
    const target = new Date(`${now.getFullYear() + (now > new Date(`${now.getFullYear()}-10-10`) ? 1 : 0)}-10-10`)
    const diff = +target - +now
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff / (1000 * 60 * 60)) % 24),
      m: Math.floor((diff / 1000 / 60) % 60),
      s: Math.floor((diff / 1000) % 60)
    }
  }

  const Stat = ({ val, unit }: { val: number, unit: string }) => (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className="text-3xl md:text-5xl font-extralight tracking-tighter text-white tabular-nums drop-shadow-sm">
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-[9px] uppercase tracking-[0.25em] text-purple-300/60 font-bold">
        {unit}
      </span>
    </div>
  )

  return (
    <Card className="
      group relative col-span-4 row-span-1 h-44 md:h-40 overflow-hidden border-none
      bg-slate-950 rounded-3xl transition-all duration-700
      shadow-[0_20px_50px_rgba(0,0,0,0.5)]
    ">
      {/* 1. Full Background Image with a subtle zoom */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
        style={{ backgroundImage: 'url(/images/background/fotspirit.png)' }}
      />

      {/* 2. Gradual Glassmorphism Overlay */}
      {/* This creates the "fade-in" frost effect from right to left */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/20 to-transparent z-10" />
      <div className="absolute inset-0 backdrop-blur-[1px] md:backdrop-blur-[2px] [mask-image:linear-gradient(to_right,transparent_10%,black_100%)] z-20" />

      {/* 3. The Actual Glass Layer (Right Side Focus) */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[65%] z-30 
                      bg-purple-950/30 md:bg-purple-950/40 backdrop-blur-sm md:backdrop-blur-md
                      flex items-center justify-center
                      border-l border-purple-500/20
                      [mask-image:linear-gradient(to_right,transparent,black_40%)]">
      </div>

      {/* 4. Balanced Content Layer */}
      <div className="relative z-40 h-full w-full flex flex-col md:flex-row items-center px-8 md:gap-0">

        {/* Left Side: Title */}
        <div className="flex flex-col justify-center w-full md:w-1/2 pt-6 md:pt-0">
          <div className="flex items-center gap-3 mb-1">
          <div className="relative">
              <Ghost className="relative w-5 h-5 text-purple-200" />
            </div>
            <span className="text-[11px] font-black tracking-[0.4em] text-purple-400 uppercase">
              Annual Event
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extralight text-white leading-tight tracking-tight">
            Festival of the{' '}
            <span className="font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] 
                          transition-all duration-300 
                          group-hover:scale-105 
                          group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] 
                          group-hover:text-purple-50">
              Spirit
            </span>
          </h2>
        </div>

        {/* Right Side: Elegant Countdown */}
        <div className="flex flex-1 items-center justify-between w-full md:w-auto md:justify-around md:pl-12">
          <Stat val={timeLeft.d} unit="days" />
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <Stat val={timeLeft.h} unit="hours" />
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <Stat val={timeLeft.m} unit="mins" />
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <Stat val={timeLeft.s} unit="secs" />
        </div>
      </div>

      {/* Top Edge Highlight for "Glass" feel */}
      {/* <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/0 via-white/20 to-white/0 z-50" /> */}
    </Card>
  )
}