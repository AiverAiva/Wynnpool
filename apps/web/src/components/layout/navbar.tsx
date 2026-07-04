'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { ModeToggle } from '@/components/layout/mode-toggle'
import UserAuthDisplay from '@/components/layout/user-auth-display'
import { GlobalSearch } from '@/components/layout/global-search'

interface NavbarProps {
  user: any | null
}

/* ------------------------------------------------------------------ */
/* IA — kept exactly as before (no route / label changes)             */
/* ------------------------------------------------------------------ */

const navCategories = [
  {
    category: 'Main',
    items: [
      { name: 'Home', href: '/' },
      { name: 'Stats', href: '/stats' },
      { name: 'Discord', href: 'https://discord.gg/QVxPPqHFMk' },
    ],
  },
  {
    category: 'Lootpool',
    items: [
      { name: 'Raid', href: '/raid' },
      { name: 'Lootrun', href: '/lootrun' },
    ],
  },
  {
    category: 'Loadout',
    items: [
      { name: 'Item Search', href: '/item/search' },
      { name: 'Item Changelog', href: '/item/changelog' },
      { name: 'Item Analyze', href: '/item/analyze' },
      { name: 'Item Ranking', href: '/item/ranking' },
      { name: 'Item Weight', href: '/item/weight' },
      { name: 'Aspects Data', href: '/aspects/data' },
    ],
  },
  {
    category: 'World',
    items: [
      { name: 'Annihilation', href: '/annihilation' },
      { name: 'Events', href: '/events' },
      { name: 'Servers', href: '/servers' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Desktop nav — section model                                         */
/* ------------------------------------------------------------------ */

type Section = {
  label: string
  /** active when pathname starts with any of these */
  match: string[]
  /** single link OR groups of items rendered in a dropdown */
  href?: string
  groups?: { items: { name: string; href: string; desc: string }[] }[]
}

const sections: Section[] = [
  { label: 'Home', match: ['/'], href: '/' },
  {
    label: 'Lootpool',
    match: ['/raid', '/lootrun'],
    groups: [
      {
        items: [
          { name: 'Raid', href: '/raid', desc: 'Raid pool data and a planner.' },
          { name: 'Lootrun', href: '/lootrun', desc: 'Lootrun pool for every area, in detail.' },
        ],
      },
    ],
  },
  {
    label: 'Loadout',
    match: ['/item/search', '/item/changelog', '/item/analyze', '/item/ranking', '/item/weight', '/aspects/data'],
    groups: [
      {
        items: [
          { name: 'Item Search', href: '/item/search', desc: 'Find items with a selected filter.' },
          { name: 'Item Changelog', href: '/item/changelog', desc: 'Track item changes across updates.' },
          { name: 'Item Analyze', href: '/item/analyze', desc: "Inspect an item's potential with weight sets." },
          { name: 'Item Ranking', href: '/item/ranking', desc: 'Best items, ranked by weighted score.' },
          { name: 'Item Weight', href: '/item/weight', desc: 'Check the weight of every item.' },
        ],
      },
      {
        items: [
          { name: 'Aspect Data', href: '/aspects/data', desc: 'All aspects and their effects, by class.' },
        ],
      },
    ],
  },
  {
    label: 'World',
    match: ['/annihilation', '/events', '/servers'],
    groups: [
      {
        items: [
          { name: 'Annihilation', href: '/annihilation', desc: 'Countdown to the next Annihilation with predictions.' },
          { name: 'Events', href: '/events', desc: 'All world events with live countdowns and filters.' },
          { name: 'Servers', href: '/servers', desc: 'Live player count and uptime across all Wynncraft servers.' },
        ],
      },
    ],
  },
  { label: 'Stats', match: ['/stats'], href: '/stats' },
]

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const prefersReduced = useReducedMotion()

  const isSectionActive = (s: Section) =>
    s.match.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))

  return (
    <header className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl px-0">
      <nav className="flex h-14 items-center rounded-2xl bg-background/70 px-6 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-xl backdrop-saturate-150 dark:bg-background/60 dark:shadow-[0_10px_40px_rgb(0_0_0/0.45)]">
        {/* ── Left: brand ──────────────────────────────────────── */}
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="flex shrink-0 items-center font-[family-name:var(--font-pixelify)] text-lg leading-none tracking-[0.02em] text-foreground"
          >
            Wynnpool
          </Link>
        </div>

        {/* ── Center: desktop nav ──────────────────────────────── */}
        <ul className="hidden flex-1 items-center justify-center gap-0.5 md:flex" role="menubar">
          {sections.map((section) =>
            section.href && !section.groups ? (
              <li key={section.label} role="none">
                <Link
                  href={section.href}
                  role="menuitem"
                  className={cn(
                    'inline-flex h-9 items-center rounded-md px-3 text-[13px] transition-colors duration-200',
                    isSectionActive(section)
                      ? 'font-semibold text-foreground'
                      : 'font-medium text-muted-foreground hover:text-foreground',
                  )}
                >
                  {section.label}
                </Link>
              </li>
            ) : (
              <DropdownSection
                key={section.label}
                section={section}
                active={isSectionActive(section)}
                pathname={pathname}
              />
            ),
          )}
        </ul>

        {/* ── Right cluster ─────────────────────────────────────── */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <GlobalSearch />
          <ModeToggle />
          <div className="hidden md:flex items-center">
            <UserAuthDisplay user={user} />
          </div>

          {/* Mobile trigger (right cluster, thumb-reachable) */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground md:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>

      {/* ── Mobile overlay ─────────────────────────────────────── */}
      <MobileOverlay
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        pathname={pathname}
        reduced={prefersReduced}
        user={user}
      />
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Dropdown section — portal-based for working backdrop-filter         */
/* The dropdown panel is portaled to document.body, escaping the       */
/* fixed header's stacking context so backdrop-filter can blur the     */
/* actual page content behind it.                                      */
/* ------------------------------------------------------------------ */

function DropdownSection({
  section,
  active,
  pathname,
}: {
  section: Section
  active: boolean
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ left: 0, top: 0 })
  const timer = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const prefersReduced = useReducedMotion()

  const computePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const panelWidth = Math.min(window.innerWidth * 0.92, 540)
    let left = rect.left + rect.width / 2 - panelWidth / 2
    // clamp to viewport with 16px margin
    left = Math.max(16, Math.min(left, window.innerWidth - panelWidth - 16))
    setPanelPos({ left, top: rect.bottom + 8 })
  }

  const openMenu = () => {
    if (timer.current) clearTimeout(timer.current)
    computePosition()
    setOpen(true)
  }
  const closeMenu = () => {
    timer.current = setTimeout(() => setOpen(false), 100)
  }

  useEffect(() => {
    if (!open) return
    const handleScroll = () => {
      setOpen(false)
    }
    window.addEventListener('scroll', handleScroll, true)
    const handleResize = () => computePosition()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <li
      role="none"
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        ref={triggerRef}
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          if (open) setOpen(false)
          else {
            computePosition()
            setOpen(true)
          }
        }}
        className={cn(
          'inline-flex h-9 items-center rounded-md px-3 text-[13px] transition-colors duration-200',
          active
            ? 'font-semibold text-foreground'
            : 'font-medium text-muted-foreground hover:text-foreground',
        )}
      >
        {section.label}
        <ChevronDown
          className={cn(
            'relative top-[1px] ml-1 h-3 w-3 transition duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <motion.div
            style={{ position: 'fixed', left: panelPos.left, top: panelPos.top, zIndex: 50 }}
            className={cn(
              'w-[min(92vw,540px)] rounded-2xl bg-background/70 p-2',
              'shadow-[0_12px_40px_rgb(0_0_0/0.1),inset_0_1px_0_hsl(var(--foreground)/0.05)]',
              'backdrop-blur-2xl backdrop-saturate-150',
              'dark:bg-background/60 dark:shadow-[0_16px_50px_rgb(0_0_0/0.5),inset_0_1px_0_hsl(0_0%_100/0.04)]',
            )}
            initial={{ opacity: 0, y: prefersReduced ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReduced ? 0 : -6 }}
            transition={{ duration: prefersReduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
            role="menu"
          >
            <div
              className={cn(
                'grid gap-0.5',
                section.groups && section.groups.length > 1
                  ? 'md:grid-cols-[1fr_auto_1fr] md:items-start'
                  : 'grid-cols-1',
              )}
            >
              {section.groups?.map((group, gi) => (
                <React.Fragment key={gi}>
                  {gi > 0 && <div className="mx-2 hidden w-px self-stretch bg-border/60 md:block" />}
                  <div className="grid gap-0.5 p-2">
                    {group.items.map((item) => (
                      <DropdownLink key={item.href} item={item} pathname={pathname} />
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.div>,
          document.body,
        )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Dropdown item                                                       */
/* ------------------------------------------------------------------ */

function DropdownLink({
  item,
  pathname,
}: {
  item: { name: string; href: string; desc: string }
  pathname: string
}) {
  const active = pathname === item.href
  return (
    <Link
      href={item.href}
      className={cn(
        'group/item relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200',
        active ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.04]',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{item.name}</div>
        <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
          {item.desc}
        </div>
      </div>
      <ArrowRight className="mt-0.5 size-3.5 shrink-0 translate-x-[-4px] text-muted-foreground opacity-0 transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100" />
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile full-screen overlay                                          */
/* ------------------------------------------------------------------ */

function MobileOverlay({
  open,
  onOpenChange,
  pathname,
  reduced,
  user,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  pathname: string
  reduced?: boolean | null
  user: any | null
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-2xl backdrop-saturate-150"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                className="fixed inset-0 z-[60] flex flex-col bg-background/80 backdrop-blur-2xl backdrop-saturate-150"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Top bar */}
                <div className="flex h-14 items-center justify-between px-5">
                  <span className="flex items-center font-[family-name:var(--font-pixelify)] text-lg leading-none tracking-[0.02em] text-foreground">
                    Wynnpool
                  </span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => onOpenChange(false)}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Nav body */}
                <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
                  <div className="flex flex-col gap-7">
                    {navCategories.map((category, ci) => (
                      <motion.section
                        key={category.category}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduced ? 0 : 0.4,
                          delay: reduced ? 0 : 0.08 + ci * 0.06,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {category.category}
                        </h3>
                        <div className="flex flex-col gap-0.5">
                          {category.items.map((item) => {
                            const active = pathname === item.href
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onOpenChange(false)}
                                className={cn(
                                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                                  active
                                    ? 'bg-foreground/[0.06] text-foreground'
                                    : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                                )}
                              >
                                {item.name}
                                {active && <span className="size-1.5 rounded-full bg-foreground/60" />}
                              </Link>
                            )
                          })}
                        </div>
                      </motion.section>
                    ))}
                  </div>
                </div>

                {/* Footer row */}
                {user && (
                  <div className="border-t border-border/50 px-5 py-3">
                    <UserAuthDisplay user={user} />
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
