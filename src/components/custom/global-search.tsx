'use client'

import { ItemBase } from "@/types/itemType";
import { AlertCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cutePlayers, getPlayerDisplayName } from '@/types/playerType'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"

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
    mergedGuilds?: Record<  //Merging guilds and guildsPrefix
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


const GlobalSearch: React.FC<any> = () => {
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
            const mergedGuilds = {
                ...data.guildsPrefix,
                ...data.guilds,
            };

            if (Object.keys(mergedGuilds).length > 0) {
                data.mergedGuilds = mergedGuilds;
            }

            setResults(data)
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
        <div className="max-w-md mx-auto">
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {Object.entries(results.players).map(([uuid, name]) => (
                                <Link href={`/stats/player/${uuid}`} key={uuid}>
                                  <Card className="h-full flex flex-col hover:bg-accent transition-colors cursor-pointer">
                                    <CardContent className="flex flex-col justify-between p-2 h-full">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={`/api/player/icon/${uuid}`}
                                          alt={name}
                                          className="w-8 h-8"
                                        />
                                        <div>
                                          <span className='font-mono'>{getPlayerDisplayName(name)}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.mergedGuilds && (
                          <div className="mt-4">
                            <h2 className="font-bold mb-2">Guilds</h2>
                            <ul>
                              {Object.entries(results.mergedGuilds).map(([id, guild]) => (
                                <Link href={`/stats/guild/${guild.name}`}>
                                  <Card className='w-full hover:bg-accent/60 transition-colors cursor-pointer p-1.5 px-3 rounded-md mb-2'>
                                    <li key={id} className='text-md font-mono'>[{guild.prefix}] {guild.name}</li>
                                  </Card>
                                </Link>
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
        </div>
    );
};

export { GlobalSearch }