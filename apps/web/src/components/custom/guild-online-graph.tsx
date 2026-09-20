"use client"

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
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "../ui/spinner"
import { useEffect, useState } from "react"
import api from "@/lib/api"

/**
 * One bucket from the engine. `count` is the mean over the samples taken in that
 * bucket; `samples` is how many samples it is based on, so a point is only ever
 * rendered when it represents real observations.
 */
interface OnlineCountPoint {
    timestamp: number
    count: number | null
    countMax: number
    samples: number
}

interface ChartProps {
    guildUuid: string
}

/** Must match BUCKET_SECS in apps/engine/src/tasks/guild_online.rs. */
const BUCKET_MS = 15 * 60 * 1000

/**
 * Insert an explicit "no data" node for every bucket interval the collector did not
 * sample.
 *
 * The previous version of this filled those intervals with `count: 0`, which is why a
 * stalled collector looked exactly like "nobody is online" for three weeks. Now a
 * missing interval is `null` and breaks the area (see `connectNulls` below), so a gap
 * reads as a gap rather than as an activity level.
 */
function insertNoDataNodes(data: OnlineCountPoint[]): OnlineCountPoint[] {
    const filled: OnlineCountPoint[] = []

    for (let i = 0; i < data.length; i++) {
        filled.push(data[i])

        if (i < data.length - 1) {
            let tempTimestamp = data[i].timestamp + BUCKET_MS
            while (tempTimestamp < data[i + 1].timestamp) {
                filled.push({ timestamp: tempTimestamp, count: null, countMax: 0, samples: 0 })
                tempTimestamp += BUCKET_MS
            }
        }
    }

    return filled
}

export default function GuildOnlineGraph({ guildUuid }: ChartProps) {
    const [chartData, setChartData] = useState<OnlineCountPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [timeSpan, setTimeSpan] = useState("24h")

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const now = Math.floor(Date.now() / 1000)
                let startTime: number

                switch (timeSpan) {
                    case "24h":
                        startTime = now - 24 * 60 * 60
                        break
                    case "3d":
                        startTime = now - 3 * 24 * 60 * 60
                        break
                    case "14d":
                        startTime = now - 14 * 24 * 60 * 60
                        break
                    default:
                        startTime = now - 24 * 60 * 60
                }
 
                const response = await fetch(api('/guild/online-count'), {
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
                setChartData(insertNoDataNodes((result.data ?? []).map((item: any) => ({
                    timestamp: item.timestamp * 1000,
                    count: item.count,
                    countMax: item.countMax ?? 0,
                    samples: item.samples ?? 0,
                }))))
            } catch (error) {
                console.error("Failed to fetch chart data:", error)
                setChartData([])
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

    const sampled = chartData.filter(item => item.count !== null)
    const maxCount = sampled.length > 0
        ? Math.max(...sampled.map(item => item.count as number))
        : 0
    // An empty series would otherwise produce a [0, -Infinity] domain.
    const yMax = maxCount > 0 ? maxCount : 1

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null

        const point = payload[0].payload
        return (
            <div className="bg-background/80 p-2 shadow-md rounded-lg border border-border">
                <p className="font-semibold">{new Date(point.timestamp).toLocaleString()}</p>
                {point.count === null ? (
                    <p className="text-muted-foreground">No data recorded</p>
                ) : (
                    <>
                        <p>Count: {point.count} <span className="text-muted-foreground">avg/15min</span></p>
                        {point.samples > 0 && (
                            <p className="text-muted-foreground">
                                {point.samples} sample{point.samples === 1 ? "" : "s"}, peak {point.countMax}
                            </p>
                        )}
                    </>
                )}
            </div>
        )
    }

    return (
        <Card className="mt-4">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1 text-center sm:text-left">
                    <CardTitle>Guild Online Count</CardTitle>
                    <CardDescription>
                        15-minute average online members. Gaps are periods with no recorded samples.
                    </CardDescription>
                </div>
                <Select value={timeSpan} onValueChange={setTimeSpan}>
                    <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
                        <SelectValue placeholder="Select time span" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="3d">Last 3 days</SelectItem>
                        <SelectItem value="14d">Last 14 days</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {loading ? (
                    <div className="flex h-[250px] items-center justify-center">
                        <Spinner size="large" />
                    </div>
                ) : sampled.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        No online-member samples were recorded for this period.
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
                                // Numeric time axis: buckets are hourly, so spacing must
                                // reflect real elapsed time rather than point order.
                                type="number"
                                scale="time"
                                domain={["dataMin", "dataMax"]}
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
                                domain={[0, yMax]}
                                allowDataOverflow={true}
                            />
                            <ChartTooltip content={<CustomTooltip />} />
                            <Area
                                dataKey="count"
                                type="monotone"
                                connectNulls={false}
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
