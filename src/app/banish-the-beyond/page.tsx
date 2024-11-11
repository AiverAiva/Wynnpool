'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"

// Define the structure of the time left object
interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export default function CountdownPage() {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    function calculateTimeLeft(): TimeLeft {
        const difference = +new Date('2025-10-12') - +new Date()
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

    const timerComponents = Object.keys(timeLeft).map(interval => {
        const value = timeLeft[interval as keyof TimeLeft]; // Cast interval to a key of TimeLeft
        if (value === undefined) {
            return null
        }

        return (
            <div key={interval} className="text-center">
                <span className="text-4xl font-bold">{value}</span>
                <span className="text-xl">{interval}</span>
            </div>
        )
    })

    return (
        <div className='bg-background'>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center ">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-center font-thin">Countdown to next <p className="text-3xl font-bold">Banish the beyond</p></CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timerComponents.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {timerComponents}
                            </div>
                        ) : (
                            <p className="text-2xl text-center">Time's up!</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
