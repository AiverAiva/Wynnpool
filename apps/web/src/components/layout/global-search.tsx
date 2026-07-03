"use client"

import '@/assets/css/wynncraft.css'
import type React from "react"
import type { Item } from "@wynnpool/shared"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AlertCircle, ArrowRight, Clock, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Input } from "../ui/input"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { cutePlayers, getPlayerDisplayName } from "@/types/playerType"
import { SmallItemCard } from "../wynncraft/item/ItemDisplay"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { cn } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"

// Search history entries store the query plus the result category.
type SearchHistoryEntry = { query: string; type: "item" | "player" | "guild" }

type PlayerSearchResult = {
  username: string
  rank: string
  supportRank?: string
  legacyRankColour?: { main: string; sub: string }
  rankBadge?: string
}

type SearchResult =
  | {
    query?: string
    players?: Record<string, PlayerSearchResult>
    guilds?: Record<
      string,
      {
        name: string
        prefix: string
      }
    >
    guildsPrefix?: Record<
      string,
      {
        name: string
        prefix: string
      }
    >
    mergedGuilds?: Record<
      // Merging guilds and guildsPrefix
      string,
      {
        name: string
        prefix: string
      }
    >
    territories?: Record<
      string,
      {
        start: [number, number] // Coordinates [X, Z]
        end: [number, number] // Coordinates [X, Z]
      }
    >
    discoveries?: Record<
      string,
      {
        start: [number, number] // Coordinates [X, Z]
        end: [number, number] // Coordinates [X, Z]
      }
    >
    items?: Item[]
  }
  | { error: string }

// Maximum number of search history items to store
const MAX_SEARCH_HISTORY = 10
// Cookie name for search history
const SEARCH_HISTORY_COOKIE = "wynncraft_search_history"

/* ------------------------------------------------------------------ */
/* Shared liquid-glass tokens (mirror navbar + user-auth-display)      */
/* ------------------------------------------------------------------ */

const panelClass = cn(
  'rounded-2xl bg-background/70 backdrop-blur-2xl backdrop-saturate-150',
  'shadow-[0_12px_40px_rgb(0_0_0/0.1),inset_0_1px_0_hsl(var(--foreground)/0.05)]',
  'dark:bg-background/60 dark:shadow-[0_16px_50px_rgb(0_0_0/0.5),inset_0_1px_0_hsl(0_0%_100/0.04)]',
)

// Small uppercase category label, same family as the navbar mobile h3.
const sectionLabelClass =
  'text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground'

// Arrow that pushes in on row hover — same move as navbar DropdownLink.
const arrowHoverClass =
  'size-3.5 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100'

/* ------------------------------------------------------------------ */
/* Result section — category label + body, staggers in on reveal       */
/* ------------------------------------------------------------------ */

function ResultSection({
  label,
  count,
  reduced,
  delay,
  children,
}: {
  label: string
  count?: number
  reduced?: boolean | null
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.4,
        delay: reduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className={sectionLabelClass}>{label}</h3>
        {typeof count === 'number' && (
          <span className="text-[11px] text-muted-foreground/70">{count}</span>
        )}
      </div>
      {children}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/* Player row — replaces the old player Card                           */
/* ------------------------------------------------------------------ */

function PlayerRow({
  uuid,
  player,
  onClick,
}: {
  uuid: string
  player: PlayerSearchResult
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
    >
      <img
        src={`https://vzge.me/face/128/${uuid}.png`}
        alt=""
        className="size-7 shrink-0 rounded-md"
        loading="lazy"
      />
      <span className="flex-1 truncate text-[13px] font-medium tracking-tight text-foreground">
        {getPlayerDisplayName(player.username)}
      </span>
      <ArrowRight className={arrowHoverClass} aria-hidden="true" />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Guild row — replaces the old guild Card                             */
/* ------------------------------------------------------------------ */

function GuildRow({
  guild,
  onClick,
}: {
  guild: { name: string; prefix: string }
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
    >
      <span className="flex-1 truncate text-[13px] font-medium tracking-tight text-foreground">
        <span className="text-muted-foreground">[{guild.prefix}]</span>{' '}
        {guild.name}
      </span>
      <ArrowRight className={arrowHoverClass} aria-hidden="true" />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Idle featured players — refined cutePlayers grid                    */
/* ------------------------------------------------------------------ */

function IdleFeatured({ reduced }: { reduced?: boolean | null }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className={sectionLabelClass}>Featured</h3>
        <span className="text-[11px] text-muted-foreground/70">these people are peaked</span>
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {cutePlayers.map(({ uuid, name, quote, icon }) => (
          <li key={uuid}>
            <Link
              href={`/stats/player/${uuid}`}
              prefetch={false}
              className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-foreground/[0.04]"
            >
              <img
                src={`https://vzge.me/face/128/${uuid}.png`}
                alt=""
                className="size-10 shrink-0 rounded-md"
                loading="lazy"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold tracking-tight text-foreground">
                  {getPlayerDisplayName(name)}
                </span>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {quote}
                </p>
              </div>
              {icon && <span className="shrink-0 self-center">{icon}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* No results — ghost SVG, calmly centered                             */
/* ------------------------------------------------------------------ */

function NotFound({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img
        src={`/illustrations/ghost/ghost-not-found.svg`}
        alt=""
        className="h-28"
      />
      <p className="mt-4 text-sm text-muted-foreground">
        No results for{' '}
        <span className="font-semibold text-foreground">{query}</span>.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Loading — skeletal rows matching the results layout                 */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-16 animate-pulse rounded-full bg-foreground/[0.06]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-foreground/[0.05]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-foreground/[0.05]" />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GlobalSearch                                                        */
/* ------------------------------------------------------------------ */

const GlobalSearch: React.FC<any> = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const debounceTimeout = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  // Load search history from cookies on component mount
  useEffect(() => {
    const savedHistory = Cookies.get(SEARCH_HISTORY_COOKIE)
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory)
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory)
        }
      } catch (error) {
        console.error("Error parsing search history from cookie:", error)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        if (isDialogOpen) return
        e.preventDefault();
        setIsDialogOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0); // delay needed to ensure dialog is mounted
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [])

  useEffect(() => {
    if (isDialogOpen) {
      setIsDialogOpen(false);
      setQuery("");
      setResults(null);
      setShowHistory(false);
    }
  }, [pathname])

  // Save search to history if it returned valid results
  const saveToSearchHistory = (searchQuery: string, type: "item" | "player" | "guild") => {
    if (searchHistory.some((entry) => entry.query === searchQuery && entry.type === type)) {
      // Move to top if exists
      const newHistory = [
        { query: searchQuery, type },
        ...searchHistory.filter((entry) => !(entry.query === searchQuery && entry.type === type)),
      ].slice(0, MAX_SEARCH_HISTORY)
      setSearchHistory(newHistory)
      Cookies.set(SEARCH_HISTORY_COOKIE, JSON.stringify(newHistory), { expires: 30 })
      return
    }
    // Add new search to history
    const newHistory = [{ query: searchQuery, type }, ...searchHistory].slice(0, MAX_SEARCH_HISTORY)
    setSearchHistory(newHistory)
    Cookies.set(SEARCH_HISTORY_COOKIE, JSON.stringify(newHistory), { expires: 30 }) // Expires in 30 days
  }

  // Remove an item from search history
  const removeFromHistory = (searchQuery: string, type: "item" | "player" | "guild") => {
    const newHistory = searchHistory.filter((entry) => !(entry.query === searchQuery && entry.type === type))
    setSearchHistory(newHistory)
    Cookies.set(SEARCH_HISTORY_COOKIE, JSON.stringify(newHistory), { expires: 30 })
  }

  // Clear all search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    Cookies.remove(SEARCH_HISTORY_COOKIE)
  }


  const latestQuery = useRef<string>("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    latestQuery.current = value

    if (value.trim() === "") {
      setResults(null)
      setIsLoading(false)
      setShowHistory(true)
      return
    }

    setShowHistory(false)
    setIsLoading(true)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = window.setTimeout(() => {
      if (value.trim()) {
        performSearch(value.trim())
      }
    }, 500) // Delay of 500ms after typing stops
  }

  const performSearch = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/${searchQuery}`)
      const data = await response.json()
      const mergedGuilds = {
        ...data.guildsPrefix,
        ...data.guilds,
      }

      if (Object.keys(mergedGuilds).length > 0) {
        data.mergedGuilds = mergedGuilds
      }

      if (searchQuery === latestQuery.current) {
        setResults(data)
        setIsDialogOpen(true)
        // Save to history if valid results
        // saveToSearchHistory(searchQuery, data)
      }
    } catch (error) {
      console.error("Error fetching search results:", error)
    } finally {
      setIsLoading(false) // Hide loading spinner after API call
    }
  }

  const handleInputFocus = () => {
    setIsDialogOpen(true)
    if (!query.trim() || (results && "error" in results)) {
      setResults(null)
      setShowHistory(true)
    }
  }

  const handleHistoryItemClick = (historyItem: SearchHistoryEntry) => {
    if (historyItem.type === "player") {
      // Try to find uuid from current results, fallback to search by name
      if (results && typeof results === "object" && !("error" in results) && results.players) {
        const exactPlayer = Object.entries(results.players).find(
          ([, player]) => player.username.toLowerCase() === historyItem.query.trim().toLowerCase()
        );
        if (exactPlayer) {
          router.push(`/stats/player/${exactPlayer[0]}`);
          setIsDialogOpen(false);
          return;
        }
      }
      // fallback: just use name as uuid (may not work, but preserves old behavior)
      router.push(`/stats/player/${historyItem.query}`);
      setIsDialogOpen(false);
      return;
    }
    if (historyItem.type === "guild") {
      router.push(`/stats/guild/${historyItem.query}`);
      setIsDialogOpen(false);
      return;
    }
    // item
    router.push(`/item/${historyItem.query}`);
    setIsDialogOpen(false);
  }

  // Add onKeyDown handler for Enter key
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results && typeof results === "object" && !("error" in results)) {
      // Item match
      if (results.items) {
        const exactItem = results.items.find(
          (item) => (item.internalName ?? item.itemName ?? item.id).toLowerCase() === query.trim().toLowerCase()
        );
        if (exactItem) {
          const itemName = exactItem.internalName ?? exactItem.itemName ?? exactItem.id;
          saveToSearchHistory(itemName, "item");
          router.push(`/item/${encodeURIComponent(itemName)}`);
          setIsDialogOpen(false);
          e.preventDefault();
          return;
        }
      }
      // Player match
      if (results.players) {
        const exactPlayer = Object.entries(results.players).find(
          ([uuid, player]) => player.username.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactPlayer) {
          saveToSearchHistory(exactPlayer[1].username, "player");
          router.push(`/stats/player/${exactPlayer[0]}`);
          setIsDialogOpen(false);
          e.preventDefault();
          return;
        }
      }
      // Guild match (by name or prefix)
      if (results.mergedGuilds) {
        const exactGuild = Object.values(results.mergedGuilds).find(
          (guild) =>
            guild.name.toLowerCase() === query.trim().toLowerCase() ||
            guild.prefix.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactGuild) {
          saveToSearchHistory(exactGuild.name, "guild");
          router.push(`/stats/guild/${exactGuild.name}`);
          setIsDialogOpen(false);
          e.preventDefault();
          return;
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      // Clear the debounce timeout when the component unmounts
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  const hasValidResults =
    results && typeof results === 'object' && !('error' in results)

  return (
    <>
      {/* Trigger — already matches the navbar icon-button family */}
      <button
        type="button"
        aria-label="Search"
        onClick={handleInputFocus}
        className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
      >
        <Search className="size-4" />
      </button>

      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AnimatePresence>
          {isDialogOpen && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-2xl backdrop-saturate-150"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild>
                <motion.div
                  // Centered via framer x/y so the scale animation composes cleanly
                  // with the -50% centering offset (never animate x/y here).
                  // Fixed height (not max-h): ScrollArea's Viewport needs a definite
                  // height to activate overflow scrolling. overflow-hidden is a
                  // defensive cap so content can never escape the panel edge.
                  style={{ x: '-50%', y: '-50%' }}
                  className={cn(
                    'fixed left-[50%] top-[50%] z-[70] flex h-[min(85dvh,560px)] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden p-3',
                    panelClass,
                  )}
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: prefersReduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">
                    Search for items, guilds, or players.
                  </DialogPrimitive.Description>

                  {/* Input row — shrink-0 so the body owns the flex slack */}
                  <div className="flex shrink-0 items-center gap-2 px-2 pb-3 pt-1.5">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search items, guilds, or players..."
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        className="h-11 rounded-xl border-border/50 bg-foreground/[0.03] pl-10 text-[15px] tracking-tight placeholder:text-muted-foreground/70 focus-visible:border-foreground/20 focus-visible:ring-0"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Close search"
                      onClick={() => setIsDialogOpen(false)}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Body — owns all flex slack. flex-1 + min-h-0 + overflow-hidden
                      gives ScrollArea a definite height so content scrolls inside
                      instead of escaping the panel. */}
                  <div className="min-h-0 flex-1 overflow-hidden px-1">
                    <ScrollArea className="h-full">
                      <div className="px-1 pb-2">
                        {isLoading ? (
                          <LoadingSkeleton />
                        ) : results ? (
                          'error' in results ? (
                            results.error ===
                            'No results found for the given query.' ? (
                              <NotFound query={query} />
                            ) : (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{results.error}</AlertDescription>
                              </Alert>
                            )
                          ) : (
                            <ResultsView
                              key={query}
                              results={results}
                              reduced={prefersReduced}
                              onPlayerClick={(uuid, username) => {
                                saveToSearchHistory(username, 'player')
                                router.push(`/stats/player/${uuid}`)
                                setIsDialogOpen(false)
                              }}
                              onGuildClick={(name) => {
                                saveToSearchHistory(name, 'guild')
                                router.push(`/stats/guild/${name}`)
                                setIsDialogOpen(false)
                              }}
                              onItemClick={(itemName) => {
                                saveToSearchHistory(itemName, 'item')
                                router.push(`/item/${encodeURIComponent(itemName)}`)
                                setIsDialogOpen(false)
                              }}
                            />
                          )
                        ) : showHistory && searchHistory.length > 0 ? (
                          <HistoryView
                            history={searchHistory}
                            onItemClick={handleHistoryItemClick}
                            onRemove={removeFromHistory}
                            onClear={clearSearchHistory}
                          />
                        ) : (
                          <IdleFeatured reduced={prefersReduced} />
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Results view — grouped sections, staggered reveal                   */
/* ------------------------------------------------------------------ */

function ResultsView({
  results,
  reduced,
  onPlayerClick,
  onGuildClick,
  onItemClick,
}: {
  results: Exclude<SearchResult, { error: string }>
  reduced?: boolean | null
  onPlayerClick: (uuid: string, username: string) => void
  onGuildClick: (name: string) => void
  onItemClick: (itemName: string) => void
}) {
  const playerEntries = results.players ? Object.entries(results.players) : []
  const guildEntries = results.mergedGuilds ? Object.entries(results.mergedGuilds) : []
  const items = results.items ?? []
  let sectionIndex = 0
  const nextDelay = () => 0.06 * sectionIndex++

  return (
    <div className="space-y-6">
      {playerEntries.length > 0 && (
        <ResultSection label="Players" count={playerEntries.length} reduced={reduced} delay={nextDelay()}>
          <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            {playerEntries.map(([uuid, player]) => (
              <PlayerRow
                key={uuid}
                uuid={uuid}
                player={player}
                onClick={() => onPlayerClick(uuid, player.username)}
              />
            ))}
          </div>
        </ResultSection>
      )}

      {guildEntries.length > 0 && (
        <ResultSection label="Guilds" count={guildEntries.length} reduced={reduced} delay={nextDelay()}>
          <div className="flex flex-col gap-0.5">
            {guildEntries.map(([id, guild]) => (
              <GuildRow key={id} guild={guild} onClick={() => onGuildClick(guild.name)} />
            ))}
          </div>
        </ResultSection>
      )}

      {items.length > 0 && (
        <ResultSection label="Items" count={items.length} reduced={reduced} delay={nextDelay()}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const itemName = item.internalName ?? item.itemName ?? item.id
              return (
                <span
                  key={itemName}
                  className="cursor-pointer"
                  onClick={() => onItemClick(itemName)}
                >
                  <SmallItemCard item={item} />
                </span>
              )
            })}
          </div>
        </ResultSection>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* History view — recent searches                                      */
/* ------------------------------------------------------------------ */

function HistoryView({
  history,
  onItemClick,
  onRemove,
  onClear,
}: {
  history: SearchHistoryEntry[]
  onItemClick: (item: SearchHistoryEntry) => void
  onRemove: (query: string, type: 'item' | 'player' | 'guild') => void
  onClear: () => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className={cn(sectionLabelClass, 'flex items-center gap-1.5')}>
          <Clock className="size-3.5" />
          Recent
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </div>

      <div className="flex flex-col gap-0.5">
        {history.map((entry, index) => (
          <div key={index} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => onItemClick(entry)}
              className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] tracking-tight text-foreground transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:outline-none"
            >
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{entry.query}</span>
              {entry.type && (
                <Badge
                  variant="outline"
                  className="border-border/50 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {entry.type}
                </Badge>
              )}
            </button>
            <button
              type="button"
              aria-label="Remove from history"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(entry.query, entry.type)
              }}
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/[0.05] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export { GlobalSearch }
