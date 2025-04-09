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

    // Handle scroll events for parallax effects
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY)

            // Check if footer is in view
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
                if (!response.ok) {
                    throw new Error('Failed to fetch data')
                }
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
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })
    }

    // Calculate zoom scale based on scroll position
    const calculateZoom = () => {
        if (!heroRef.current) return 1
        const heroHeight = heroRef.current.offsetHeight
        const scrollProgress = Math.min(scrollY / heroHeight, 1)
        // Start at 1, zoom out to 1.15 as user scrolls
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
        <div className="min-h-screen bg-background">
            {/* Hero Section with Background Image */}
            <div ref={heroRef} className="relative h-[80vh] lg:h-[90vh] w-full overflow-hidden">
                {/* Background Image with Zoom Effect */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 ease-out"
                    style={{
                        backgroundImage:
                            "url(/images/background/annihilation.png)",
                        backgroundPosition: "center 30%",
                        transform: `scale(${calculateZoom()})`,
                    }}
                >
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90"></div>
                </div>
                <div className="mt-[30px]" />
                {/* Hero Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-4">
                    {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center text-shadow-lg animate-fade-in">
                        Annihilation Events
                    </h1> */}

                    <div className="max-w-3xl w-full animate-slide-up">
                        {/* border-red-500/50 */}
                        <Card className="bg-black/40 backdrop-blur-sm border-none shadow-lg shadow-red-500/20">
                            {/* <Card className="bg-gradient-to-br/70 from-black via-zinc-900 to-zinc-950 border border-red-500/30 shadow-red-700/20 shadow-md"> */}
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
                                    <Alert variant="default" className="bg-red-900/50 border-red-500/50 text-white">
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

                {/* Wave Transition */}
                <div className="absolute bottom-0 left-0 right-0 z-20">
                    <svg
                        className="w-full h-auto"
                        viewBox="0 0 1440 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 120L48 110C96 100 192 80 288 75C384 70 480 80 576 85C672 90 768 90 864 85C960 80 1056 70 1152 65C1248 60 1344 60 1392 60H1440V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V120Z"
                            fill="currentColor"
                            className="text-background"
                        />
                    </svg>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto p-4 max-w-screen-lg duration-150 relative z-20">
                <Card className="border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shadow-md">
                    <CardHeader className="flex gap-2 items-center">
                        <CalendarClock className="text-red-500" />
                        <CardTitle className="text-xl">Upcoming Predictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data ? (
                            <ul className="space-y-4">
                                {data.predicted.map((event, index) => (
                                    <li key={index} className="flex items-start gap-4">
                                        <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-white">{formatDate(event.datetime_utc)}</p>
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

                {/* Scroll indicator */}
                {/* <div className="flex justify-center my-12 animate-bounce">
                    <div className="flex flex-col items-center text-muted-foreground">
                        <p className="mb-2 text-sm">Explore the Annihilation Realm</p>
                        <ArrowDown className="h-6 w-6" />
                    </div>
                </div> */}
            </div>

            {/* <div ref={footerRef} className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden mt-12">
                <div className="absolute top-0 left-0 right-0 z-10 h-32 bg-gradient-to-b from-background to-transparent"></div>

                <div className="absolute top-0 left-0 right-0 z-10">
                    <svg
                        className="w-full h-auto"
                        viewBox="0 0 1440 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 0L48 10C96 20 192 40 288 45C384 50 480 40 576 35C672 30 768 30 864 35C960 40 1056 50 1152 55C1248 60 1344 60 1392 60H1440V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0V0Z"
                            fill="currentColor"
                            className="text-background"
                        />
                    </svg>
                </div>

                <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out ${footerVisible ? "opacity-100 scale-100" : "opacity-0 scale-110"
                        }`}
                    style={{
                        backgroundImage:
                            "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7Aro6UPBnliizSqpZb8RqN68hNV5bE.png)",
                        backgroundPosition: "center center",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
                </div>

                <div className="relative z-10 h-full flex flex-col items-center justify-end text-white p-8">
                    <div
                        className={`max-w-3xl w-full text-center mb-8 transition-all duration-1000 delay-300 ${footerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                            }`}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-shadow-lg text-purple-100">Enter the Void</h2>
                        <p className="text-lg text-purple-200 max-w-xl mx-auto">
                            Join the battle against the forces of annihilation and protect the realm from destruction.
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10"></div>
            </div> */}
        </div>
    )
}
