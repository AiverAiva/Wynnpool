'use client'

import React, { useState, useEffect } from 'react'
import { Skeleton } from '../ui/skeleton'

interface CountdownProps {
    targetTimestamp: number | null
    endText?: string
}

export default function Countdown({ targetTimestamp, endText = "Countdown ended" }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<null | { days: number, hours: number, minutes: number, seconds: number }>(null)
    const [isEnded, setIsEnded] = useState(false)

    useEffect(() => {
        if (!targetTimestamp) return

        const calculateTimeLeft = () => {
            const now = Math.floor(Date.now() / 1000)
            const difference = targetTimestamp - now

            if (difference > 0) {
                const days = Math.floor(difference / (60 * 60 * 24))
                const hours = Math.floor((difference / (60 * 60)) % 24)
                const minutes = Math.floor((difference / 60) % 60)
                const seconds = Math.floor(difference % 60)
                
                setTimeLeft({ days, hours, minutes, seconds })
                setIsEnded(false)
            } else {
                setTimeLeft(null)
                setIsEnded(true)
            }
        }

        calculateTimeLeft() // Calculate immediately to avoid initial 0 display
        const intervalId = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(intervalId)
    }, [targetTimestamp])


    if (isEnded) {
        return <div className="font-mono text-4xl">{endText}</div>
    }

    if (!targetTimestamp || timeLeft === null) {
        return <Skeleton className="h-6 w-[300px]" />  // Skeleton placeholder
    }

   

    return (
        <div className="flex gap-5 justify-center">
            {timeLeft.days > 0 && (
                <div>
                    <span className="countdown font-mono text-4xl">
                        {timeLeft.days}
                    </span>
                    <span className="hidden sm:inline">{` day${timeLeft.days > 1 ? 's' : ''}`}</span>
                    <span className="inline sm:hidden">h</span>
                </div>
            )}
            {(timeLeft.hours > 0 || timeLeft.days > 0) && (
                <div>
                    <span className="countdown font-mono text-4xl">
                        {timeLeft.hours}
                    </span>
                    <span className="hidden sm:inline">{` hour${timeLeft.hours > 1 ? 's' : ''}`}</span>
                    <span className="inline sm:hidden">h</span>
                </div>
            )}
            {(timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) && (
                <div>
                    <span className="countdown font-mono text-4xl">
                        {timeLeft.minutes}
                    </span>
                    <span className="hidden sm:inline">{` min${timeLeft.minutes > 1 ? 's' : ''}`}</span>
                    <span className="inline sm:hidden">m</span>
                </div>
            )}
            {(timeLeft.seconds > 0 || timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) && (
                <div>
                    <span className="countdown font-mono text-4xl">
                        {timeLeft.seconds}
                    </span>
                    <span className="hidden sm:inline">{` sec${timeLeft.seconds > 1 ? 's' : ''}`}</span>
                    <span className="inline sm:hidden">s</span>
                </div>
            )}
        </div>
    )
}
