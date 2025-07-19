'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon } from 'lucide-react'

interface LootItem {
    Item: string
    Tracker: string
}

interface HistoryFile {
    Loot: {
        [key: string]: {
            Shiny: LootItem
            Mythic: string[]
            Fabled: string[]
            Legendary: string[]
            Rare: string[]
            Unique: string[]
        }
    }
    Icon: {
        [key: string]: string
    }
    Timestamp: number
}

interface LootrunPoolHistoryProps {
    historyFiles: HistoryFile[]
}

const rarityColors = {
    Shiny: 'bg-pink-500 text-white',
    Mythic: 'bg-fuchsia-800 text-white',
    Fabled: 'bg-rose-600 text-white',
    Legendary: 'bg-cyan-400 text-cyan-950',
    Rare: 'bg-fuchsia-400 text-fuchsia-950',
    Unique: 'bg-amber-300 text-amber-950'
}

export function LootrunPoolHistory({ historyFiles }: LootrunPoolHistoryProps) {
    const [selectedFile, setSelectedFile] = useState<HistoryFile | null>(null)

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleDownload = () => {
        if (selectedFile) {
            const blob = new Blob([JSON.stringify(selectedFile)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lootpool_${selectedFile?.Timestamp}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="">Back</span>
            </Button>
            <h1 className="text-4xl font-bold mb-4">Lootrun Pool History</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyFiles.map((file, index) => (
                    <Sheet key={index}>
                        <SheetTrigger asChild>
                            <Card className="cursor-pointer hover:bg-accent" onClick={() => setSelectedFile(file)}>
                                <CardHeader>
                                    <CardTitle>{formatDate(file.Timestamp)}</CardTitle>
                                </CardHeader>
                            </Card>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] md:w-[720px] lg:w-[960px]">
                            <SheetHeader>
                                <SheetTitle>{formatDate(file.Timestamp)}</SheetTitle>
                            </SheetHeader>
                            {selectedFile && (
                                <Tabs defaultValue={Object.keys(selectedFile.Loot)[0]} className="mt-4 relative">
                                    <TabsList className="grid w-full grid-cols-5">
                                        {Object.keys(selectedFile.Loot).map((area) => (
                                            <TabsTrigger key={area} value={area}>{area}</TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {Object.entries(selectedFile.Loot).map(([area, categories]) => (
                                        <TabsContent key={area} value={area}>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>{area} Loot</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ScrollArea className="overflow-y-auto" style={{ height: 'calc(100vh - 265px)' }}>
                                                        {Object.entries(categories).map(([rarity, items]) => (
                                                            <div key={rarity} className="mb-4">
                                                                <h3 className="text-xl font-semibold mb-2">{rarity}</h3>
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {Array.isArray(items) ? items.map((item) => (
                                                                        <div className="flex items-center space-x-2" key={item}>
                                                                            <Image
                                                                                unoptimized
                                                                                src={selectedFile.Icon[item] && selectedFile.Icon[item].startsWith('http')
                                                                                    ? selectedFile.Icon[item]
                                                                                    : (selectedFile.Icon[item] ? `/icons/items/${selectedFile.Icon[item]}` : '/icons/items/barrier.webp')}
                                                                                alt={item}
                                                                                width={32}
                                                                                height={32}
                                                                            />
                                                                            <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{item}</Badge>
                                                                        </div>
                                                                    )) : (
                                                                        <div className="flex items-center space-x-2">
                                                                            <Image
                                                                                unoptimized
                                                                                src={selectedFile.Icon[items.Item] && selectedFile.Icon[items.Item].startsWith('http')
                                                                                    ? selectedFile.Icon[items.Item]
                                                                                    : (selectedFile.Icon[items.Item] ? `/icons/items/${selectedFile.Icon[items.Item]}` : '/icons/items/barrier.webp')}
                                                                                alt={items.Item}
                                                                                width={32}
                                                                                height={32}
                                                                            />
                                                                            <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{items.Item}<span className='font-mono text-xs font-thin'>&ensp;{items.Tracker}</span></Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </ScrollArea>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    ))}
                                    <Button className="absolute bottom-4 right-4 opacity-30 transition-opacity duration-300 hover:opacity-100 " onClick={handleDownload}>
                                        Download JSON
                                    </Button>
                                </Tabs>
                            )}
                        </SheetContent>
                    </Sheet>
                ))}
            </div>
        </div>
    )
}
