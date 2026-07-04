"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"

export interface ServerData {
  firstSeen: number
  lastSeen: number
  uptime: number
  players: string[]
}

export interface ServerStatus {
  servers: {
    [key: string]: ServerData
  }
  Latest: number
}

export type UseServerStatusReturn = {
  data: ServerStatus | null
  loading: boolean // true on initial fetch only
  refreshing: boolean // true during a refetch (data already present)
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: number | null // Date.now() of last successful fetch
}

/**
 * Single fetch location shared by ServerStatusSummary (homepage) and
 * ServerStatusTable (/servers page). Fetches once on mount; refresh is
 * opt-in via refetch(). No polling — manual refresh keeps the API honest.
 */
export function useServerStatus(): UseServerStatusReturn {
  const [data, setData] = useState<ServerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchData = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      const response = await fetch(api("/server/status"))
      if (!response.ok) {
        throw new Error("Failed to fetch server status")
      }
      const serverStatus = (await response.json()) as ServerStatus
      setData(serverStatus)
      setError(null)
      setLastUpdated(Date.now())
    } catch (err) {
      setError("An error occurred while fetching the server status.")
      console.error(err)
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  const refetch = useCallback(() => fetchData(false), [fetchData])

  return { data, loading, refreshing, error, refetch, lastUpdated }
}
