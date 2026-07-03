import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Sponsors — Wynnpool",
  description: "Wynnpool runs on the support of people who use it.",
}

/* ------------------------------------------------------------------ */
/* Sponsor data — add a sponsor by adding one object here.             */
/* Empty brackets never render; Past Sponsors renders only if non-empty. */
/* ------------------------------------------------------------------ */

type Bracket = {
  id: string
  label: string // the visible tier name IS the amount, no "/mo"
  order: number // sort desc: highest contribution first
}

type Sponsor = {
  name: string
  logo?: string // path under /public; if absent, monogram fallback
  uuid?: string // Minecraft UUID → renders a player head via vzge.me
  bracket: string
  blurb?: string // optional one-liner; absent → not rendered
  url?: string // optional external link
  recurring: boolean // true → ongoing (Current), false → one-time (Past)
}

const brackets: Bracket[] = [
  { id: "b-100", label: "$100+", order: 2 },
  { id: "b-50", label: "$50+", order: 1 },
]

const sponsors: Sponsor[] = [
  {
    name: "Whale",
    logo: "/sponsors/whale.png",
    bracket: "b-50",
    recurring: false,
  },
  {
    name: "Qintao He",
    bracket: "b-50",
    recurring: false,
    // Buy Me a Coffee link TBD; card renders without external link until then.
  },
  {
    name: "Dorrie (aka Flufe)",
    uuid: "f33dfcce-8e29-49b9-a528-93729f95fa39", // Flufe
    bracket: "b-100",
    recurring: false,
  },
]

const BMC_URL = "https://buymeacoffee.com/aiveraiva"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function bracketOf(id: string): Bracket | undefined {
  return brackets.find((b) => b.id === id)
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SponsorPage() {
  const recurring = sponsors
    .filter((s) => s.recurring)
    .map((s) => ({ sponsor: s, bracket: bracketOf(s.bracket) }))
    .filter((x): x is { sponsor: Sponsor; bracket: Bracket } => Boolean(x.bracket))
    .sort((a, b) => b.bracket.order - a.bracket.order)

  const past = sponsors.filter((s) => !s.recurring)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-36 md:px-12">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Sponsors
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Wynnpool runs on the support of people who use it.
        </p>
      </section>

      {/* Current Sponsors — ongoing supporters; renders only if any exist */}
      {recurring.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16 md:px-12">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
            Current Sponsors
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recurring.map(({ sponsor, bracket }) => (
              <SponsorCard key={sponsor.name} sponsor={sponsor} bracket={bracket} />
            ))}
          </div>
        </section>
      )}

      {/* Past Sponsors — one-time contributions; renders only if any exist.
          Uses the same card treatment as Current so the contribution level
          (bracket) is visible. Sits above the meta/CTA sections because
          social proof should precede the pitch. */}
      {past.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16 md:px-12">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
            Past Sponsors
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {past
              .map((sponsor) => ({ sponsor, bracket: bracketOf(sponsor.bracket) }))
              .filter((x): x is { sponsor: Sponsor; bracket: Bracket } => Boolean(x.bracket))
              .sort((a, b) => b.bracket.order - a.bracket.order)
              .map(({ sponsor, bracket }) => (
                <SponsorCard key={sponsor.name} sponsor={sponsor} bracket={bracket} />
              ))}
          </div>
        </section>
      )}

      {/* Why Sponsor */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-12">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
            Why Sponsor
          </h2>
          <p className="max-w-[65ch] text-[15px] leading-relaxed text-muted-foreground">
            Wynnpool is free and ad-free. Sponsorships cover server hosting,
            the domain, and the data pipelines that keep lootpools and stats fresh.
          </p>
        </div>
      </section>

      {/* Become a Sponsor */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="flex flex-col gap-4 rounded-2xl bg-background/70 p-8 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgb(0_0_0/0.08),inset_0_1px_0_hsl(var(--foreground)/0.05)] dark:bg-background/60 dark:shadow-[0_10px_40px_rgb(0_0_0/0.45),inset_0_1px_0_hsl(0_0%_100/0.04)] md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Become a Sponsor
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Any amount helps keep the site running.
            </p>
          </div>
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform duration-200 hover:scale-[1.02]"
          >
            Buy me a coffee
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Sponsor card                                                        */
/* ------------------------------------------------------------------ */

function SponsorCard({
  sponsor,
  bracket,
}: {
  sponsor: Sponsor
  bracket: Bracket
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-background/70 p-5 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgb(0_0_0/0.08),inset_0_1px_0_hsl(var(--foreground)/0.05)] transition-colors hover:bg-foreground/[0.02] dark:bg-background/60 dark:shadow-[0_10px_40px_rgb(0_0_0/0.45),inset_0_1px_0_hsl(0_0%_100/0.04)]">
      <div className="flex items-start gap-3">
        {sponsor.logo ? (
          <Image
            src={sponsor.logo}
            alt={sponsor.name}
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full"
          />
        ) : sponsor.uuid ? (
          // Minecraft player head — same pattern as global-search PlayerRow /
          // IdleFeatured. pixelated rendering matches the game's aesthetic.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://vzge.me/face/128/${sponsor.uuid}.png`}
            alt={sponsor.name}
            width={48}
            height={48}
            loading="lazy"
            style={{ imageRendering: 'pixelated' }}
            className="size-12 shrink-0 rounded-full"
          />
        ) : (
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-foreground/[0.06]">
            <span className="text-base font-semibold tracking-tight text-foreground">
              {getInitials(sponsor.name)}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {sponsor.name}
          </h3>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {bracket.label}
          </span>
        </div>
      </div>

      {sponsor.blurb && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {sponsor.blurb}
        </p>
      )}

      {sponsor.url && (
        <a
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground"
        >
          Visit
          <ArrowRight
            className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden="true"
          />
        </a>
      )}
    </div>
  )
}
