'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ItemDisplay } from "@/components/wynncraft/item/ItemDisplay"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import ItemSearch from "./itemSearch"
import IngredientSearch from "./ingredientSearch"

import '@/assets/css/wynncraft.css'

export default function PageSwitch() {
    const [results, setResults] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="container mx-auto p-4 max-w-screen-xl duration-150">
            <div className="mt-[80px]" />
            <Card className="mt-4">
                <Tabs defaultValue="item" className="">
                    <CardHeader className="flex flex-row justify-between">
                        <div>
                            <CardTitle>Item Search</CardTitle>
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
                <Alert className="w-full mx-auto mt-4 border-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle className="text-red-500">Error</AlertTitle>
                    <AlertDescription>
                        <p className="text-red-500">{error}</p>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}