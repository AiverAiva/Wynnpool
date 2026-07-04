"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowUpDown, RefreshCw, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useServerStatus,
  type ServerData,
  type ServerStatus,
} from "./use-server-status"

type SortKey = "server" | "players" | "uptime"
type SortOrder = "asc" | "desc"

/**
 * Full table view for /servers. Server-name search + manual refresh +
 * relative "last updated" label. No polling — refresh is opt-in.
 */
export function ServerStatusTable() {
  const { data, loading, refreshing, error, refetch, lastUpdated } =
    useServerStatus()
  const [sortKey, setSortKey] = useState<SortKey>("server")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [query, setQuery] = useState("")

  const sortedServers = useMemo(() => {
    if (!data) return []
    const entries = Object.entries(data.servers)
    const filtered = query.trim()
      ? entries.filter(([name]) =>
          name.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : entries
    return filtered.sort((a, b) => {
      const av = getSortValue(a[0], a[1], sortKey)
      const bv = getSortValue(b[0], b[1], sortKey)
      if (av < bv) return sortOrder === "asc" ? -1 : 1
      if (av > bv) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortOrder, query])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  if (loading) {
    return <SkeletalTable />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">No data available.</p>
      </div>
    )
  }

  const serverCount = Object.keys(data.servers).length

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter servers..."
            className="h-10 w-full rounded-xl border border-border/50 bg-foreground/[0.03] pl-10 pr-9 text-[14px] tracking-tight text-foreground placeholder:text-muted-foreground/70 focus-visible:border-foreground/20 focus-visible:outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LastUpdated lastUpdated={lastUpdated} />
          <button
            type="button"
            onClick={() => refetch()}
            disabled={refreshing}
            aria-label="Refresh"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Result count */}
      <p className="mb-3 text-[13px] text-muted-foreground">
        {query.trim() ? (
          <>
            {sortedServers.length} of {serverCount} servers match{" "}
            <span className="font-medium text-foreground">{query}</span>
          </>
        ) : (
          <>{serverCount} servers</>
        )}
      </p>

      {/* Table or empty-filter state */}
      {sortedServers.length === 0 ? (
        <div className="rounded-2xl border border-border/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No servers match &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <SortHeader
                  label="Server"
                  active={sortKey === "server"}
                  onClick={() => handleSort("server")}
                />
                <SortHeader
                  label="Players"
                  active={sortKey === "players"}
                  onClick={() => handleSort("players")}
                  className="w-32 text-right"
                />
                <SortHeader
                  label="Uptime"
                  active={sortKey === "uptime"}
                  onClick={() => handleSort("uptime")}
                  className="w-32 text-right"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedServers.map(([server, serverData]) => (
                <tr key={server} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3 text-[14px] font-medium tracking-tight text-foreground">
                    {server}
                  </td>
                  <td className="px-4 py-3 text-right text-[14px] tabular-nums text-foreground">
                    {serverData.players.length}
                  </td>
                  <td className="px-4 py-3 text-right text-[14px] tabular-nums text-muted-foreground">
                    {formatUptime(serverData.uptime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SortHeader({
  label,
  active,
  onClick,
  className,
}: {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          active && "text-foreground",
          className?.includes("text-right") && "flex-row-reverse",
        )}
      >
        {label}
        <ArrowUpDown className="size-3" aria-hidden="true" />
      </button>
    </th>
  )
}

function LastUpdated({ lastUpdated }: { lastUpdated: number | null }) {
  const [now, setNow] = useState(() => Date.now())

  // Display-only interval: updates the "Xs ago" label so it stays accurate.
  // Does NOT re-fetch data — refresh is manual via the button.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (lastUpdated == null) return null

  return (
    <span className="text-[11px] tabular-nums text-muted-foreground">
      Updated {relativeTime(now - lastUpdated)}
    </span>
  )
}

function relativeTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

function SkeletalTable() {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 max-w-xs flex-1 animate-pulse rounded-xl bg-foreground/[0.05]" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-foreground/[0.05]" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/50">
        <div className="h-9 border-b border-border/50 bg-muted/30" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse border-b border-border/30 bg-foreground/[0.02] last:border-b-0"
          />
        ))}
      </div>
    </div>
  )
}

function getSortValue(
  server: string,
  data: ServerData,
  key: SortKey,
): number | string {
  switch (key) {
    case "server":
      return server.toLowerCase()
    case "players":
      return data.players.length
    case "uptime":
      return data.uptime
    default:
      return 0
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// Re-export the type for any consumer that imports from this file.
export type { ServerStatus }
