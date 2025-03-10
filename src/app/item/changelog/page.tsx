'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, MinusCircle, RefreshCw } from 'lucide-react'
import api from '@/utils/api'
import { ItemDisplay } from '@/components/custom/item-display'
import { ItemDiffViewer } from './ItemDiff'
import { Spinner } from '@/components/ui/spinner'

interface ChangelogData {
    add?: any[];
    modify?: any[];
    remove?: any[];
}

// Helper function to get the appropriate color for item tier
export default function ChangelogPage() {
    const [changelogTimestamps, setChangelogTimestamps] = useState<number[]>([]);
    const [selectedTab, setSelectedTab] = useState<string | null>(null);
    const [changelogData, setChangelogData] = useState<ChangelogData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch list of available timestamps
    useEffect(() => {
        const fetchChangelogList = async () => {
            try {
                const response = await fetch(api("/item/changelog/list"));
                if (!response.ok) throw new Error("Failed to fetch changelog timestamps");

                const data: number[] = await response.json();
                setChangelogTimestamps(data);

                if (data.length > 0) {
                    setSelectedTab(String(data[0])); // Auto-select latest
                }
            } catch (error) {
                console.error("Error fetching changelog list:", error);
            }
        };

        fetchChangelogList();
    }, []);

    // Fetch changelog data when a timestamp is selected
    useEffect(() => {
        if (!selectedTab) return;

        const fetchChangelogData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(api(`/item/changelog/${selectedTab}`));
                if (!response.ok) throw new Error("Failed to fetch changelog data");

                const data: ChangelogData = await response.json();
                setChangelogData(data);
            } catch (error) {
                console.error("Error fetching changelog data:", error);
                setChangelogData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChangelogData();
    }, [selectedTab]);

    const formatDate = (timestamp: number, isLatest: boolean) => {
        return `${new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })} ${isLatest ? "(Latest)" : ""}`;
    };

    return (
        <div className="container mx-auto p-4 max-w-screen-xl duration-150">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-3xl">Item Changelog</CardTitle>
                    <CardDescription>Track changes to items across game updates</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={selectedTab || ""} onValueChange={setSelectedTab} className="w-full">
                        <TabsList className="mb-4">
                            {changelogTimestamps.map((timestamp, index) => (
                                <TabsTrigger key={timestamp} value={String(timestamp)}>
                                    {formatDate(timestamp, index === 0)}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value={selectedTab || ""}>
                            {isLoading ? (
                                <div className='h-64 flex item-center justify-center'>
                                    <Spinner className='h-16 w-16'/>
                                </div>
                            ) : changelogData ? (
                                <div className="space-y-6">
                                    {/* Added Items */}
                                    {changelogData.add && changelogData.add.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-semibold flex items-center mb-3">
                                                <PlusCircle className="mr-2 h-5 w-5 text-green-500" />
                                                Added Items
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {changelogData.add.map((item, index) => (
                                                    <Card key={index} className="border-l-4 border-green-500">
                                                        <ItemDisplay item={item} />
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Modified Items */}
                                    {changelogData.modify && changelogData.modify.length > 0 && (

                                        <div>
                                            <h3 className="text-xl font-semibold flex items-center mb-3">
                                                <RefreshCw className="mr-2 h-5 w-5 text-blue-500" />
                                                Modified Items
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {changelogData.modify.map((item, index) => (
                                                    <Card key={index} className="border-l-4 border-blue-500">
                                                        
                                                        <CardHeader className="p-4">
                                                            <div className="flex justify-between items-center">
                                                                <CardTitle className="text-lg">{item.itemName}</CardTitle>
                                                                <Badge>{item.after.rarity}</Badge>
                                                            </div>
                                                            <CardDescription>{item.after.type}</CardDescription>
                                                        </CardHeader>
                                                        {/* <CardContent>
                                                            <h4 className="text-sm font-semibold">Changes:</h4>
                                                            <ul className="text-sm">
                                                                {Object.keys(item.before).map((key) =>
                                                                    JSON.stringify(item.before[key]) !==
                                                                        JSON.stringify(item.after[key]) ? (
                                                                        <li key={key} className="flex flex-col">
                                                                            <span className="text-red-500 line-through">
                                                                                {key}: {JSON.stringify(item.before[key])}
                                                                            </span>
                                                                            <span className="text-green-500">
                                                                                {key}: {JSON.stringify(item.after[key])}
                                                                            </span>
                                                                        </li>
                                                                    ) : null
                                                                )}
                                                            </ul>
                                                        </CardContent> */}
                                                        <ItemDiffViewer {...item}/>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Removed Items */}
                                    {changelogData.remove && changelogData.remove.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-semibold flex items-center mb-3">
                                                <MinusCircle className="mr-2 h-5 w-5 text-red-500" />
                                                Removed Items
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {changelogData.remove.map((item, index) => (
                                                    <Card key={index} className="border-l-4 border-red-500">
                                                        <ItemDisplay item={item} />
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>No data available for this update.</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}