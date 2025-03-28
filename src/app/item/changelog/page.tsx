'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, MinusCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import api from '@/utils/api'
import { ItemDisplay } from '@/components/wynncraft/item/ItemDisplay'
import { Spinner } from '@/components/ui/spinner'
import ModifiedItemDisplay from '@/components/wynncraft/item/ModifiedItemDisplay'
import { motion } from 'framer-motion'

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
    const [expandedSections, setExpandedSections] = useState<Record<"add" | "modify" | "remove", boolean>>({
        add: false,
        modify: false,
        remove: false,
    });

    const toggleSection = (section: "add" | "modify" | "remove") => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

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
                                <div className="h-64 flex items-center justify-center">
                                    <Spinner className="h-16 w-16" />
                                </div>
                            ) : changelogData ? (
                                <div className="space-y-4">
                                    {/* Section Component */}
                                    {(["add", "modify", "remove"] as const).map((section) => {
                                        const items = changelogData[section];
                                        if (!items || items.length === 0) return null;

                                        const colors = {
                                            add: "green",
                                            modify: "blue",
                                            remove: "red",
                                        };

                                        const icons = {
                                            add: <PlusCircle className={`mr-2 h-5 w-5 text-${colors[section]}-500`} />,
                                            modify: <RefreshCw className={`mr-2 h-5 w-5 text-${colors[section]}-500`} />,
                                            remove: <MinusCircle className={`mr-2 h-5 w-5 text-${colors[section]}-500`} />,
                                        };

                                        // Set column layout dynamically
                                        const gridClass =
                                            section === "modify"
                                                ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                                                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

                                        return (
                                            <div key={section} className="border border-accent rounded-lg overflow-hidden">
                                                {/* Header */}
                                                <div
                                                    className="flex items-center justify-between p-4 bg-background hover:bg-accent transition cursor-pointer"
                                                    onClick={() => toggleSection(section)}
                                                >
                                                    <div className="flex items-center text-lg font-semibold">
                                                        {expandedSections[section] ? (
                                                            <ChevronDown className="mr-2 h-5 w-5" />
                                                        ) : (
                                                            <ChevronRight className="mr-2 h-5 w-5" />
                                                        )}
                                                        {icons[section]}
                                                        {section.charAt(0).toUpperCase() + section.slice(1)} Items
                                                    </div>
                                                </div>

                                                {/* Content (Animated) */}
                                                <motion.div
                                                    initial={false}
                                                    animate={{ height: expandedSections[section] ? "auto" : 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className={`${gridClass} p-4 bg-background`}>
                                                        {items.map((item, index) => (
                                                            <Card key={index} className={`border-l-4 border-${colors[section]}-500`}>
                                                                {section === "modify" ? (
                                                                    <ModifiedItemDisplay modifiedItem={item} />
                                                                ) : (
                                                                    <ItemDisplay item={item} />
                                                                )}
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
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
