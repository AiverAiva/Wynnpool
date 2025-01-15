'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ItemSearch from "./itemSearch"
import '@/assets/css/wynncraft.css'
import { ItemDisplay } from "@/components/custom/item-display"
import { useState } from "react"
import IngredientSearch from "./ingredientSearch"
import { Alert } from "@/components/ui/alert"

export default function PageSwitch() {
    const [results, setResults] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="container mx-auto p-4 max-w-screen-xl duration-150">
            <Card className="mt-4">
                <Tabs defaultValue="item" className="">
                    <CardHeader className="flex flex-row justify-between">
                        <div>
                            <CardTitle>Item Search (WIP)</CardTitle>
                            <CardDescription>Search for items using various criteria</CardDescription>
                        </div>
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="item">Item</TabsTrigger>
                            <TabsTrigger value="ingredient">Ingredient</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="item">
                            <ItemSearch
                                results={results}
                                setResults={setResults}
                                error={error}
                                setError={setError}
                            />
                        </TabsContent>
                        <TabsContent value="ingredient">
                            <Alert variant='destructive' className="mb-4">
                                <span className="font-mono font-bold text-lg">
                                    the rarity search is currently not working due to wynncraft api issue,
                                    it will be working when i finish my own item database.
                                </span>
                            </Alert>
                            <IngredientSearch
                                results={results}
                                setResults={setResults}
                                error={error}
                                setError={setError}
                            />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
            {results && (
                <Card className="mt-4">
                    <CardHeader className='relative'>
                        <CardTitle>Search Results</CardTitle>
                        <div className='absolute top-4 right-4'>
                            {Object.keys(results).length != 0 && (
                                <p className="text-center text-foreground/40 texts">{Object.keys(results).length} results found.</p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(results).length == 0 && (
                            <p className="text-center">No results found.</p>
                        )}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Object.entries(results).map(([name, item]) => (
                                <ItemDisplay key={name} item={item} embeded={true} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
            {error && (
                <Card className="w-full max-w-4xl mx-auto mt-4 border-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-500">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}