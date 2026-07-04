"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useServerStatus, type ServerStatus } from "./use-server-status"

/**
 * Homepage lean summary. Replaces the old full table on the homepage.
 * Renders three computed metrics + a single CTA to /servers.
 */
export function ServerStatusSummary() {
  const { data, loading, error } = useServerStatus()

  return (
    <Link
      href="/servers"
      prefetch={false}
      className="group block rounded-2xl bg-background/70 p-6 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgb(0_0_0/0.08),inset_0_1px_0_hsl(var(--foreground)/0.05)] transition-colors hover:bg-foreground/[0.02] dark:bg-background/60 dark:shadow-[0_10px_40px_rgb(0_0_0/0.45),inset_0_1px_0_hsl(0_0%_100/0.04)]"
    >
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          <>
            <SkeletalMetric />
            <SkeletalMetric />
          </>
        ) : error || !data ? (
          <div className="col-span-2 py-2">
            <p className="text-sm text-muted-foreground">
              {error ?? "Status unavailable."}
            </p>
          </div>
        ) : (
          <Metrics data={data} />
        )}
      </div>

      <div className="mt-5 flex items-center justify-end">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          View all
          <ArrowRight
            className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

function Metrics({ data }: { data: ServerStatus }) {
  const serverEntries = Object.entries(data.servers)
  const totalPlayers = serverEntries.reduce(
    (sum, [, s]) => sum + s.players.length,
    0,
  )
  const serverCount = serverEntries.length

  return (
    <>
      <Metric value={totalPlayers.toLocaleString()} label="Players online" />
      <Metric value={String(serverCount)} label="Servers" />
    </>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function SkeletalMetric() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-7 w-16 animate-pulse rounded-md bg-foreground/[0.06]" />
      <div className="h-3 w-20 animate-pulse rounded-full bg-foreground/[0.05]" />
    </div>
  )
}
