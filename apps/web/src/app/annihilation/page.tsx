'use client'

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock, Info, ArrowDown, CalendarClock, Flame } from "lucide-react"
import Countdown from "@/components/custom/countdown"
import { Badge } from "@/components/ui/badge"

interface AnnihilationData {
    current: {
        datetime_utc: number
        predicted?: boolean
        workflow_dispatched?: boolean
    }
    predicted: {
        datetime_utc: number
        predicted: boolean
    }[]
}

export default function AnnihilationEvents() {
    const [data, setData] = useState<AnnihilationData | null>(null)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [scrollY, setScrollY] = useState(0)
    const heroRef = useRef<HTMLDivElement>(null)
    const footerRef = useRef<HTMLDivElement>(null)
    const [footerVisible, setFooterVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY)
            if (footerRef.current) {
                const rect = footerRef.current.getBoundingClientRect()
                const isVisible = rect.top < window.innerHeight && rect.bottom >= 0
                setFooterVisible(isVisible)
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/annihilation')
                if (!response.ok) throw new Error('Failed to fetch data')
                const result: AnnihilationData = await response.json()
                setData(result)
            } catch (err) {
                setError('Failed to load data. Please try again later.')
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (data) {
            setCountdown(data.current.datetime_utc / 1000);
        }
    }, [data])

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        })
    }

    const calculateZoom = () => {
        if (!heroRef.current) return 1
        const heroHeight = heroRef.current.offsetHeight
        const scrollProgress = Math.min(scrollY / heroHeight, 1)
        return 1 + scrollProgress * 0.15
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div ref={heroRef} className="relative h-[80vh] lg:h-[90vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 ease-out"
                    style={{
                        backgroundImage: "url(/images/background/annihilation.webp)",
                        backgroundPosition: "center 30%",
                        transform: `scale(${calculateZoom()})`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/40 to-white/10 dark:from-black/70 dark:via-black/60 dark:to-black/90" />
                </div>
                <div className="mt-[30px]" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-primary p-4">
                    <div className="max-w-3xl w-full animate-slide-up">
                        <Card className="bg-black/40 dark:bg-black/40 bg-white/70 backdrop-blur-sm border-none shadow-lg shadow-red-500/20">
                            <CardHeader className="sm:relative flex justify-center items-center text-center justify-center">
                                <div className="flex justify-center items-center gap-2">
                                    <Flame className="text-red-500 h-6 w-6" />
                                    <CardTitle className="text-3xl font-bold">Next Annihilation</CardTitle>
                                </div>
                                {data && !data.current.workflow_dispatched && (
                                    <Badge className={`sm:absolute top-4 right-4 w-fit sm:text-lg font-mono ${!data.current.predicted && 'bg-green-600'}`}>
                                        {data.current.predicted ? 'Predicted' : 'Accurate'}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="text-center">
                                {data ? (
                                    <>
                                        <Countdown targetTimestamp={countdown} endText="Updating data, come back in two minutes..." />
                                        <p className="text-sm text-muted-foreground mt-2">Starts at: {formatDate(data.current.datetime_utc)}</p>
                                    </>
                                ) : (
                                    <Skeleton className="h-16 w-full" />
                                )}
                            </CardContent>
                            {data?.current.predicted && (
                                <CardFooter>
                                    <Alert variant="default" className="bg-red-900/50 dark:bg-red-900/50 bg-red-100 border-red-500/50 text-primary">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Notice</AlertTitle>
                                        <AlertDescription>
                                            The current event is based on a prediction and might not be accurate.
                                        </AlertDescription>
                                    </Alert>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                </div>
                {/* absolute bottom-0 relative left-0 right-0 z-20 */}
                <div className="absolute bottom-0 left-0 right-0 z-20">
                    <svg className="w-full h-auto" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0 120L48 110C96 100 192 80 288 75C384 70 480 80 576 85C672 90 768 90 864 85C960 80 1056 70 1152 65C1248 60 1344 60 1392 60H1440V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V120Z" fill="currentColor" className="text-background" />
                    </svg>
                </div>
                {/* <div className="h-16 bg-white dark:bg-background z-30 relative" /> */}
            </div>
            <div className="bg-background w-full -translate-y-px ">
                <div className="container max-w-screen-lg mx-auto p-4 duration-150 relative z-20 transform ">
                    <Card className="border border-zinc-800 bg-zinc-900/80 dark:bg-zinc-900/80 bg-white/80 backdrop-blur-sm shadow-md">
                        <CardHeader className="flex gap-2 items-center">
                            <CalendarClock className="text-red-500" />
                            <CardTitle className="text-xl">Upcoming Predictions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data ? (
                                <ul className="space-y-4">
                                    {data.predicted.map((event, index) => (
                                        <li key={index} className="flex items-start gap-4 text-primary">
                                            <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div>
                                                <p className="font-medium">{formatDate(event.datetime_utc)}</p>
                                                <p className="text-sm text-muted-foreground">{event.predicted ? "Predicted" : "Confirmed"}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, index) => (
                                        <Skeleton key={index} className="h-12 w-full bg-zinc-700" />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
