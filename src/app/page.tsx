// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
//           <li className="mb-2">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
//               src/app/page.tsx
//             </code>
//             .
//           </li>
//           <li>Save and see your changes instantly.</li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Compass, Database, Globe, Search, Users, AlertCircle, Heart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import WynncraftNews from '@/components/custom/lastest-news'
import ServerStatusDisplay from '@/components/custom/server-status'
import { ItemBase } from '@/types/itemType'
import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cutePlayers, getPlayerDisplayName } from '@/types/playerType'

type SearchResult = | {
  query?: string;
  players?: Record<string, string>; // Mapping of UUID to username
  guilds?: Record<
    string,
    {
      name: string;
      prefix: string;
    }
  >;
  guildsPrefix?: Record<
    string,
    {
      name: string;
      prefix: string;
    }
  >;
  territories?: Record<
    string,
    {
      start: [number, number]; // Coordinates [X, Z]
      end: [number, number];   // Coordinates [X, Z]
    }
  >;
  discoveries?: Record<
    string,
    {
      start: [number, number]; // Coordinates [X, Z]
      end: [number, number];   // Coordinates [X, Z]
    }
  >;
  items?: Record<string, ItemBase>;
} | { error: string };

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === '') {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = window.setTimeout(() => {
      if (value.trim()) {
        performSearch(value);
      }
    }, 500); // Delay of 500ms after typing stops
  };

  const performSearch = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/${searchQuery}`);
      const data = await response.json();

      if (query.trim() != '') setResults(data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false); // Hide loading spinner after API call
    }
  };

  const handleInputFocus = () => {
    setIsDialogOpen(true);
    if (!query.trim() || (results && 'error' in results)) {
      setResults(null)
    }
  };

  useEffect(() => {
    return () => {
      // Clear the debounce timeout when the component unmounts
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">Wynnpool</Link>
          <nav>
            <ul className="flex space-x-4">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">About</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
            </ul>
          </nav>
        </div>
      </header> */}

      <main className="container mx-auto px-4 py-8 max-w-screen-lg">

        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Wynnpool</h1>
          <p className="text-xl text-muted-foreground mb-8">Your ultimate utility for up-to-date Wynncraft information</p>
          <div className="max-w-md mx-auto">
            {/* onSubmit={(e) => e.preventDefault()} */}
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <div className="relative w-full inline-flex group">
                <div
                  className="absolute z-0 transitiona-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt">
                </div>
                <Search className="absolute z-20 top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for items, guilds, or players..."
                  value={query}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="pl-10 z-10"
                />
              </div>
            </form>
          </div>
        </section>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              this is actually not working at the moment, coming soon!
              <DialogTitle>
                <div className="relative">
                  <Search className="absolute z-20 top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search for items, guilds, or players..."
                    value={query}
                    onChange={handleInputChange}
                    className="pl-10 rounded-r-none"
                  />
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-[50vh] max-h-[60vh]">
              <ScrollArea className="h-full">
                {!isLoading ? (
                  results ? (
                    'error' in results ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {results.error}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      //  className='pr-4' prob for scrollbar
                      <div>
                        {results.players && (
                          <div>
                            <h2 className="font-bold mb-2">Players</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {Object.entries(results.players).map(([uuid, name]) => (
                                <Link href={`/stats/player/${name}`}>
                                  <Card className="h-full flex flex-col hover:bg-accent transition-colors cursor-pointer">
                                    <CardContent className="flex flex-col justify-between p-2 h-full">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={`/api/player/icon/${uuid}`}
                                          alt={name}
                                          className="w-8 h-8"
                                        />
                                        <div>
                                          <span>{getPlayerDisplayName(name)}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.guilds && (
                          <div className="mt-4">
                            <h2 className="font-bold mb-2">Guilds</h2>
                            <ul>
                              {Object.entries(results.guilds).map(([id, guild]) => (
                                <li key={id} className="mb-1">{guild.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {results.guildsPrefix && (
                          <div className="mt-4">
                            <h2 className="font-bold mb-2">Guilds</h2>
                            <ul>
                              {Object.entries(results.guildsPrefix).map(([id, guild]) => (
                                <li key={id} className="mb-1">{guild.name} {guild.prefix}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {results.items && (
                          <div className="mt-4">
                            <h2 className="font-bold mb-2">Items</h2>
                            <ul>
                              {Object.keys(results.items).map((itemName) => (
                                <li key={itemName} className="mb-1">{itemName}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {cutePlayers.map(({ uuid, name, quote, icon }) => (
                          <Link href={`/stats/player/${name}`}>
                            <li key={uuid} className="relative">
                              <Card className="h-full flex flex-col hover:bg-accent transition-colors cursor-pointer">
                                <CardContent className="flex flex-col justify-between p-4 h-full">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={`/api/player/icon/${uuid}`}
                                      alt={name}
                                      className="w-12 h-12"
                                      style={{ imageRendering: 'pixelated' }}
                                    />
                                    <div>
                                      <span className="font-semibold text-lg">{getPlayerDisplayName(name)}</span>
                                      <p className="text-xs text-muted-foreground mt-1">{quote}</p>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex justify-end items-end p-4">
                                  <div className="absolute bottom-4 right-4">
                                    {icon}
                                  </div>
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
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Item Database</CardTitle>
                <CardDescription>Browse and search for Wynncraft items</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/items/search">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Explore Items
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Support on Patreon</CardTitle>
                <CardDescription>Help keeping Wynnpool no ads by donating</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="https://www.patreon.com/AiverAiva">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Support Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {/* <Card>
              <CardHeader>
                <CardTitle>Quest Guide (WIP)</CardTitle>
                <CardDescription>Find detailed quest walkthroughs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Quests
                </Button>
              </CardContent>
            </Card> */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Player Stats (WIP)</CardTitle>
                <CardDescription>Look up player statistics and rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Check Stats
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Latest Updates</h2>
          <Tabs defaultValue="game">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="game">Latest News</TabsTrigger>
              <TabsTrigger value="items">Item Changelog</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            <TabsContent value="game">
              <WynncraftNews />
            </TabsContent>
            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Item changelogs (WIP)</CardTitle>
                  <CardDescription>Check out the latest changes to the items</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>BBB(Mythic)</li>
                    <li>AAA(Legendary)</li>
                    <li>CCC(Unique)</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events (WIP)</CardTitle>
                  <CardDescription>Don't miss out on these limited-time events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>AAA (Starts June 1st)</li>
                    <li>BBB (May 15th - 17th)</li>
                    <li>CCC (Every Saturday)</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
        <section>
          <ServerStatusDisplay />
        </section>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>&copy; 2024 Wynnpool. All rights reserved. Not affiliated with Wynncraft.</p>
        </div>
      </footer>
    </div>
  )
}