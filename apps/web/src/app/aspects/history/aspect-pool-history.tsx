'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AspectData } from '@/types/aspectType'

interface HistoryFile {
    Loot: any
    Icon: any
    Timestamp: number
}

interface AspectPoolHistoryProps {
    historyFiles: HistoryFile[]
}

export function AspectPoolHistory({ historyFiles }: AspectPoolHistoryProps) {
    const [selectedFile, setSelectedFile] = useState<HistoryFile | null>(null)
    // const [fileContent, setFileContent] = useState<any>(null)
    const [aspectData, setAspectData] = useState<AspectData | null>({})

    useEffect(() => {
        Promise.all([
            fetch('/api/aspects-data').then(response => response.json())
        ])
            .then(([aspectData]) => {
                setAspectData(aspectData)
            })
            .catch(error => {
                console.error('Error fetching data:', error)
            })
    }, [])

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
            a.download = `Aspectpool_${selectedFile?.Timestamp}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const aspectToClassName = Object.entries(aspectData!).reduce((acc, [className, aspects]) => {
        aspects.forEach((aspect) => {
            acc[aspect.name] = className;
        });
        return acc;
    }, {} as { [aspectName: string]: string });

    return (
        <div className="container mx-auto p-4">
            <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="">Back</span>
            </Button>
            <h1 className="text-4xl font-bold mb-4">Aspect Pool History</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyFiles.map((file, index) => (
                    console.log(file),
                    <Sheet key={index}>
                        <SheetTrigger asChild>
                            <Card className="cursor-pointer hover:bg-accent" onClick={() => setSelectedFile(file)}>
                                <CardHeader>
                                    <CardTitle>{formatDate(file.Timestamp)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>{file.Timestamp}</p>
                                </CardContent>
                            </Card>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] md:w-[720px] lg:w-[960px]">
                            {/* <div className="overflow-auto"> */}

                            <SheetHeader>
                                <SheetTitle>{formatDate(file.Timestamp)}</SheetTitle>
                                <SheetDescription>{file.Timestamp}</SheetDescription>
                            </SheetHeader>
                            {selectedFile && (
                                <Tabs defaultValue="TNA" className="mt-4 relative">
                                    <TabsList className="grid w-full grid-cols-4">
                                        {Object.keys(selectedFile.Loot).map((section) => (
                                            <TabsTrigger key={section} value={section}>{section}</TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {Object.entries(selectedFile.Loot).map(([section, categories]: [string, any]) => (
                                        <TabsContent key={section} value={section} className="relative">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>{section} Loot</CardTitle>
                                                </CardHeader>

                                                <CardContent>
                                                    {/* Dynamic height for ScrollArea */}
                                                    <ScrollArea className="overflow-y-auto" style={{ height: 'calc(100vh - 265px)' }}>
                                                        {Object.entries(categories).map(([category, items]: [string, any]) => (

                                                            <div key={category} className="mb-4" >
                                                                <h3 className="text-xl font-semibold mb-2">{category}</h3>
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {items.map((item: string) => {
                                                                        const aspectInfo = Object.values(aspectData!).flat().find(aspect => aspect.name === item);
                                                                        const className = aspectToClassName[item];

                                                                        return (
                                                                            <div key={item} className="flex items-center space-x-2">
                                                                                {className ? <Image
                                                                                    unoptimized
                                                                                    src={`/icons/aspects/aspect_${className.toLowerCase()}.${aspectInfo?.rarity === 'Mythic' ? 'gif' : 'png'}`}
                                                                                    alt={item}
                                                                                    width={32}
                                                                                    height={32}
                                                                                /> : <Image
                                                                                    unoptimized
                                                                                    src="/icons/items/barrier.webp"
                                                                                    alt={item}
                                                                                    width={32}
                                                                                    height={32}
                                                                                />}
                                                                                <span>{item}</span>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}

                                                    </ScrollArea>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    ))}

                                    {/* Bottom left button positioned absolutely within Tabs */}
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