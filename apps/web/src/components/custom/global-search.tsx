"use client"

import '@/assets/css/wynncraft.css'
import type React from "react"
import type { Item } from "@/types/itemType"
import { AlertCircle, Clock, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Input } from "../ui/input"
import { Spinner } from "../ui/spinner"
import { ScrollArea } from "../ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { cutePlayers, getPlayerDisplayName } from "@/types/playerType"
import { Card, CardContent, CardFooter } from "../ui/card"
import Link from "next/link"
import { Separator } from "../ui/separator"
import Cookies from "js-cookie"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { SmallItemCard } from "../wynncraft/item/ItemDisplay"
import { Button } from "../ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Badge } from "../ui/badge"

// Change searchHistory to store objects: { query: string, type: "item" | "player" | "guild" }
type SearchHistoryEntry = { query: string; type: "item" | "player" | "guild" };

type SearchResult =
  | {
    query?: string
    players?: Record<string, string> // Mapping of UUID to username
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
      //Merging guilds and guildsPrefix
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
    items?: Record<string, Item>
  }
  | { error: string }

// Maximum number of search history items to store
const MAX_SEARCH_HISTORY = 10
// Cookie name for search history
const SEARCH_HISTORY_COOKIE = "wynncraft_search_history"

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
          ([, name]) => name.toLowerCase() === historyItem.query.trim().toLowerCase()
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
        const exactItem = Object.keys(results.items).find(
          (itemName) => itemName.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactItem) {
          saveToSearchHistory(exactItem, "item");
          router.push(`/item/${exactItem}`);
          setIsDialogOpen(false);
          e.preventDefault();
          return;
        }
      }
      // Player match
      if (results.players) {
        const exactPlayer = Object.entries(results.players).find(
          ([uuid, name]) => name.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactPlayer) {
          saveToSearchHistory(exactPlayer[1], "player");
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

  return (
    <>
      <Button
        variant='ghost'
        className='size-9 p-0'
        onClick={handleInputFocus}
      >
        <Search className="size-4" />
      </Button>

      {/* blur */}
      <div
        className={`absolute w-screen h-screen top-0 left-0 z-5 backdrop-blur-sm pointer-events-none ${!isDialogOpen && "hidden"}`}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="z-50">
          <DialogTitle className="hidden" />
          <DialogHeader>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute z-20 top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for items, guilds, or players..."
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  className="pl-10"
                />
              </div>
              <DialogClose asChild>
                <Button variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="min-h-[50vh] max-h-[60vh]">
            <ScrollArea className="h-full">
              {!isLoading ? (
                results ? (
                  "error" in results ? (
                    results.error === "No results found for the given query." ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <img src={`/turtles/not_found.png`} alt="NOT FOUND" className="h-32 mt-8" />
                        <span className="font-mono text-lg">
                          No results found for <span className="font-bold">{query}</span>.
                        </span>
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{results.error}</AlertDescription>
                      </Alert>
                    )
                  ) : (
                    //  className='pr-4' prob for scrollbar
                    <div>
                      {results.players && (
                        <div>
                          <h2 className="font-bold mb-2">Players</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {Object.entries(results.players).map(([uuid, name]) => (
                              <span
                                key={uuid}
                                onClick={() => {
                                  saveToSearchHistory(name, "player");
                                }}
                              >
                                <Link href={`/stats/player/${uuid}`} prefetch={false}>
                                  <Card className="h-full flex flex-col hover:bg-accent transition-colors cursor-pointer">
                                    <CardContent className="flex flex-col justify-between p-2 h-full">
                                      <div className="flex items-center gap-3">
                                        <img src={`https://vzge.me/face/128/${uuid}.png`} alt={name} className="w-8 h-8" loading="lazy" />
                                        <div>
                                          <span className="text-md font-mono">{getPlayerDisplayName(name)}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {results.mergedGuilds && (
                        <div className="mt-4">
                          <h2 className="font-bold mb-2">Guilds</h2>
                          <ul>
                            {Object.entries(results.mergedGuilds).map(([id, guild]) => (
                              <span
                                key={id}
                                onClick={() => {
                                  saveToSearchHistory(guild.name, "guild");
                                }}
                              >
                                <Link href={`/stats/guild/${guild.name}`} prefetch={false}>
                                  <Card className="w-full hover:bg-accent/60 transition-colors cursor-pointer p-1.5 px-3 rounded-md mb-2">
                                    <li className="text-md font-mono">
                                      [{guild.prefix}] {guild.name}
                                    </li>
                                  </Card>
                                </Link>
                              </span>
                            ))}
                          </ul>
                        </div>
                      )}
                      {results.items && (
                        <div className="mt-4">
                          <h2 className="font-bold mb-2">Items</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.keys(results.items).map((itemName) => (
                              <span
                                key={itemName}
                                onClick={() => {
                                  saveToSearchHistory(itemName, "item");
                                }}
                              >
                                <Link href={`/item/${itemName}`} prefetch={false}>
                                  <SmallItemCard item={results.items![itemName]} />
                                </Link>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : showHistory && searchHistory.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-bold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Recent Searches
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearchHistory}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {searchHistory.map((historyItem, index) => (
                        <div key={index} className="flex items-center justify-between group">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left px-2 py-1 h-auto"
                            onClick={() => handleHistoryItemClick(historyItem)}
                          >
                            <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {historyItem.query}

                            {historyItem.type
                              ? (
                                <Badge className="text-xs">
                                  {historyItem.type.charAt(0).toUpperCase() + historyItem.type.slice(1)}
                                </Badge>
                              ) : ""
                            }

                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromHistory(historyItem.query, historyItem.type)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </div>
                ) : (
                  <div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {cutePlayers.map(({ uuid, name, quote, icon }) => (
                        <Link href={`/stats/player/${uuid}`} key={uuid} prefetch={false}>
                          <li className="relative">
                            <Card className="h-full flex flex-col hover:bg-accent transition-colors cursor-pointer">
                              <CardContent className="flex flex-col justify-between p-4 h-full">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={`https://vzge.me/face/128/${uuid}.png`}
                                    alt={name}
                                    className="w-12 h-12"
                                    loading="lazy"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                  <div>
                                    <span className="font-semibold text-lg">{getPlayerDisplayName(name)}</span>
                                    <p className="text-xs text-muted-foreground mt-1">{quote}</p>
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter className="flex justify-end items-end p-4">
                                <div className="absolute bottom-4 right-4">{icon}</div>
                              </CardFooter>
                            </Card>
                          </li>
                        </Link>
                      ))}
                    </ul>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { GlobalSearch }

