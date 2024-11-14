'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HistoryFile {
    filename: string
    timestamp: number
}

interface LootrunPoolHistoryProps {
    historyFiles: HistoryFile[]
}

interface LootItem {
    Item: string
    Tracker: string
}

interface LootData {
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
    const [fileContent, setFileContent] = useState<LootData | null>(null)

    const handleFileClick = async (file: HistoryFile) => {
        setSelectedFile(file)
        const response = await fetch(`/api/lootrun-pool/history?filename=${file.filename}`)
        const content = await response.json()
        setFileContent(content)
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleDownload = () => {
        if (fileContent) {
            const blob = new Blob([JSON.stringify(fileContent)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedFile?.filename}`;
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
                {historyFiles.map((file) => (

                    <Sheet key={file.filename}>
                        <SheetTrigger asChild>
                            <Card className="cursor-pointer hover:bg-accent" onClick={() => handleFileClick(file)}>
                                <CardHeader>
                                    <CardTitle>{formatDate(file.timestamp)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>{file.filename}</p>
                                </CardContent>
                            </Card>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] md:w-[720px] lg:w-[960px]">
                            {/* <div className="overflow-auto"> */}

                            <SheetHeader>
                                <SheetTitle>{formatDate(file.timestamp)}</SheetTitle>
                                <SheetDescription>{file.filename}</SheetDescription>
                            </SheetHeader>
                            {fileContent && (
                                <Tabs defaultValue={Object.keys(fileContent.Loot)[0]} className="mt-4 relative">
                                    <TabsList className="grid w-full grid-cols-5">
                                        {Object.keys(fileContent.Loot).map((area) => (
                                            <TabsTrigger key={area} value={area}>{area}</TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {Object.entries(fileContent.Loot).map(([area, categories]) => (
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
                                                                        <div className="flex items-center space-x-2">
                                                                            <Image
                                                                                unoptimized
                                                                                src={fileContent.Icon[item].startsWith('http')
                                                                                    ? fileContent.Icon[item]
                                                                                    : `/icons/items/${fileContent.Icon[item]}`}
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
                                                                                src={fileContent.Icon[items.Item].startsWith('http')
                                                                                    ? fileContent.Icon[items.Item]
                                                                                    : `/icons/items/${fileContent.Icon[items.Item]}`}
                                                                                alt={items.Item}
                                                                                width={32}
                                                                                height={32}
                                                                            />
                                                                            <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>{items.Item}</Badge>
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
                            {/* </div> */}
                        </SheetContent>

                    </Sheet>
                ))}
            </div>
        </div>
    )
    function ArrowLeftIcon(props: any) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
            </svg>
        )
    }
}