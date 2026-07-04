import type { Metadata } from "next"
import { ServerStatusTable } from "@/components/custom/server-status-table"

export const metadata: Metadata = {
  title: "Servers — Wynnpool",
  description: "Live player count and uptime across all Wynncraft servers.",
}

export default function ServersPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 pb-8 pt-36 md:px-12">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Servers
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Live player count and uptime across all Wynncraft servers.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8 md:px-12">
        <ServerStatusTable />
      </section>
    </main>
  )
}
