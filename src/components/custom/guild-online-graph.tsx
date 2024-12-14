"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "../ui/spinner"

interface OnlineCountData {
    timestamp: number
    count: number
}

interface ChartProps {
    guildUuid: string
}

export default function GuildOnlineGraph({ guildUuid }: ChartProps) {
    const [chartData, setChartData] = React.useState<OnlineCountData[]>([])
    const [loading, setLoading] = React.useState(true)
    const [timeSpan, setTimeSpan] = React.useState("24h")

    React.useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const now = Math.floor(Date.now() / 1000)
                let startTime: number

                switch (timeSpan) {
                    case "6h":
                        startTime = now - 6 * 60 * 60
                        break
                    case "24h":
                        startTime = now - 24 * 60 * 60
                        break
                    case "3d":
                        startTime = now - 3 * 24 * 60 * 60
                        break
                    default:
                        startTime = now - 24 * 60 * 60
                }

                const response = await fetch(`/api/guild/online-count`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        guild_uuid: guildUuid,
                        startTime: startTime,
                    }),
                })
                const result = await response.json()
                setChartData(result.data.map((item: any) => ({
                    timestamp: item.timestamp * 1000, // Convert to milliseconds
                    count: item.count,
                })))
            } catch (error) {
                console.error("Failed to fetch chart data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [guildUuid, timeSpan])

    const chartConfig = {
        onlineCount: {
            label: "Online Count",
            color: "hsl(var(--chart-1))",
        },
    }

    const maxCount = Math.max(...chartData.map(item => item.count))
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-background/80 p-2 shadow-md rounded-lg border border-border">
                    <p className="font-semibold">{new Date(data.timestamp).toLocaleString()}</p>
                    <p>Count: {data.count}</p>
                </div>
            )
        }
        return null
    }
    
    return (
        <Card className="mt-4">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1 text-center sm:text-left">
                    <CardTitle>Guild Online Count</CardTitle>
                    <CardDescription>
                        Showing online member count over time
                    </CardDescription>
                </div>
                <Select value={timeSpan} onValueChange={setTimeSpan}>
                    <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
                        <SelectValue placeholder="Select time span" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="6h">Last 6 hours</SelectItem>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="3d">Last 3 days</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {loading ? (
                    <div className="flex h-[250px] items-center justify-center">
                        <Spinner size="large" />
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[250px] w-full"
                    >
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fillOnlineCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-onlineCount)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-onlineCount)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                    })
                                }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                domain={[0, maxCount]}
                                allowDataOverflow={true}
                            />
                            <ChartTooltip content={<CustomTooltip />} />
                            <Area
                                dataKey="count"
                                type="monotone"
                                fill="url(#fillOnlineCount)"
                                stroke="var(--color-onlineCount)"
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}

