'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock, Info } from "lucide-react"
import Countdown from '@/components/custom/countdown'
import { Badge } from '@/components/ui/badge'

interface AnnihilationData {
    current: {
        datetime_utc: number
        predicted?: boolean
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
            <div className="container mx-auto p-4 max-w-screen-lg">
                <h1 className="text-3xl font-bold mb-6">Annihilation Events</h1>

                <Card className="mb-6 relative">
                    {data?.current.predicted && (
                        <Badge className="absolute top-4 right-4 text-xl font-mono">Predicted</Badge>
                    )}
                    <CardHeader className="flex justify-center items-center">
                        <CardTitle>Next Annihilation In</CardTitle>
                    </CardHeader>

                    <CardContent className="flex justify-center items-center">

                        {data ? (
                            <div>
                                <Countdown targetTimestamp={countdown} endText="Data outdated, waiting for update..." />
                                <p className="text-sm text-muted-foreground">
                                    Starts at: {formatDate(data.current.datetime_utc)}
                                </p>
                            </div>
                        ) : (
                            <Skeleton className="h-16 w-full" />
                        )}

                    </CardContent>
                    <CardFooter>
                        {data?.current.predicted && (
                            <Alert variant="default">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Notice</AlertTitle>
                                <AlertDescription>
                                    The current event is based on a prediction and might not be accurate.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardFooter>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle>Predicted Future Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data ? (
                            <ul className="space-y-4">
                                {data.predicted.map((event, index) => (
                                    <li key={index} className="flex items-start space-x-4">
                                        <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{formatDate(event.datetime_utc)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {event.predicted ? 'Predicted' : 'Confirmed'}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, index) => (
                                    <Skeleton key={index} className="h-12 w-full" />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
