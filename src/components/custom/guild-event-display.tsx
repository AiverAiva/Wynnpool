'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Edit3 } from 'lucide-react'; // Icons
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from '../ui/card';
import { GuildEvent } from '@/types/guildType';

interface GuildEventDisplayProps {
    query: Record<string, any>;
}

const GuildEventDisplay: React.FC<GuildEventDisplayProps> = ({ query }) => {
    const [data, setData] = useState<GuildEvent[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!isLoading) return
        setError(null);
        setData([]);

        try {
            const response = await fetch('/api/guild/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, page, limit: 10 }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            setData(result.data);
            setIsLoading(false);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [query, page]);

    const handlePreviousPage = () => {
        if (page > 1) setPage((prevPage) => prevPage - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage((prevPage) => prevPage + 1);
    };

    const renderEventCard = (event: GuildEvent) => {
        let icon, bgColor, message;

        switch (event.event) {
            case 'join':
                icon = <LogIn className="w-6 h-6 text-green-600" />;
                bgColor = 'bg-green-600/20';
                message = `${event.name} Joined ${event.guild_name}`;
                break;

            case 'leave':
                icon = <LogOut className="w-6 h-6 text-red-600" />;
                bgColor = 'bg-red-600/20';
                message = `${event.name} Left ${event.guild_name}`;
                break;

            case 'rank_change':
                icon = <Edit3 className="w-6 h-6 text-cyan-600" />;
                bgColor = 'bg-cyan-600/20';
                message = `${event.name}'s rank changed to ${event.new_rank} from ${event.old_rank} in ${event.guild_name}`;
                break;

            default:
                icon = null;
                bgColor = 'bg-gray-100';
                message = `Unknown event`;
        }

        return (
            <div
                key={event._id ? event._id.toString() : event.timestamp}
                className={`flex items-center gap-4 py-2 px-4 rounded-md shadow-sm ${bgColor}`}
            >
                {icon}
                <div>
                    <p className="text-lg font-mono">{message}</p>
                    <p className="text-sm text-foreground/50 font-mono">{new Date(event.timestamp * 1000).toLocaleString()}</p>
                </div>
            </div>
        );
    };

    if (isLoading || data.length === 0) return
    return (
        <div className="mt-4">
            {/* p-4 mx-auto  */}
            {error && <div className="text-red-500 mb-4">{error}</div>}

            {isLoading && (
                <div className="flex items-center justify-center my-4">
                    <Loader2 className="animate-spin w-6 h-6" />
                </div>
            )}

            {!isLoading && data.length > 0 && (
                <Card className=''>
                    <CardContent>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-b-0 -mb-6">
                                <AccordionTrigger className='hover:no-underline hover:text-foreground/60 transition-color duration-200'>Player Activity</AccordionTrigger>
                                <AccordionContent>
                                    <div className='flex flex-col gap-2'>
                                        {data.map(renderEventCard)}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            )}

            {/* Pagination Controls */}
            {!isLoading && data.length > 10 && (
                <div className="flex justify-between mt-4">
                    <Button onClick={handlePreviousPage} disabled={page === 1}>
                        Previous
                    </Button>
                    <span>Page {page} of {totalPages}</span>
                    <Button onClick={handleNextPage} disabled={page === totalPages}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GuildEventDisplay;
