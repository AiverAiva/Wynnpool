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
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface GuildEventDisplayProps {
    query: Record<string, any>;
}

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse flex flex-col gap-2">
        {Array(10).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
        ))}
    </div>
);

const GuildEventDisplay: React.FC<GuildEventDisplayProps> = ({ query }) => {
    const [data, setData] = useState<GuildEvent[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false); // Track accordion open state
    const pathname = usePathname()

    const fetchData = async () => {
        if (!isLoading) return
        setError(null);

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
        if (page > 1) {
            setPage((prevPage) => prevPage - 1);
            setIsLoading(true)
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage((prevPage) => prevPage + 1);
            setIsLoading(true)
        }
    };

    const renderEventCard = (event: GuildEvent) => {
        let icon, bgColor, message;

        switch (event.event) {
            case 'join':
                icon = <LogIn className="w-6 h-6 text-green-600" />;
                bgColor = 'bg-green-600/20';
                message =
                    <span>
                        <Link href={`/stats/player/${event.uuid}`} className='font-bold hover:underline'>{event.name}</Link>
                        &ensp;Joined 
                        {pathname.includes('/player/') && (
                            <span>
                                &ensp;<Link className='font-bold hover:underline cursor-pointer' href={`/stats/guild/${event.guild_name}`}>{event.guild_name}</Link>&ensp;
                            </span>
                        )}
                    </span>;
                break;

            case 'leave':
                icon = <LogOut className="w-6 h-6 text-red-600" />;
                bgColor = 'bg-red-600/20';
                message =
                    <span>
                        <Link href={`/stats/player/${event.uuid}`} className='font-bold hover:underline'>{event.name}</Link>
                        &ensp;Left&ensp;
                        {pathname.includes('/player/') && (
                            <span>
                                <Link className='font-bold hover:underline cursor-pointer' href={`/stats/guild/${event.guild_name}`}>{event.guild_name}</Link>&ensp;
                            </span>
                        )}
                        as&ensp;{event.rank}
                    </span>;
                break;

            case 'rank_change':
                icon = <Edit3 className="w-6 h-6 text-cyan-600" />;
                bgColor = 'bg-cyan-600/20';
                message =
                    <span>
                        <Link href={`/stats/player/${event.uuid}`} className='font-bold hover:underline'>{event.name}</Link>'s rank changed to {event.new_rank} from {event.old_rank}
                        {pathname.includes('/player/') && (
                            <span>
                                &ensp;in&ensp;
                                <Link className='font-bold hover:underline cursor-pointer' href={`/stats/guild/${event.guild_name}`}>{event.guild_name}</Link>
                            </span>
                        )}
                    </span>;
                break;

            default:
                icon = null;
                bgColor = 'bg-gray-100';
                message = `Unknown event`;
        }

        return (
            <div
                key={event._id ? event._id.toString() : event.timestamp}
                className={`flex items-center gap-4 py-1 px-4 rounded-md shadow-sm ${bgColor}`}
            >
                {icon}
                <div>
                    <p className="text-lg font-mono">{message}</p>
                    <p className="text-sm text-foreground/50 font-mono">{new Date(event.timestamp * 1000).toLocaleString()}</p>
                </div>
            </div>
        );
    };

    if (data.length === 0) return
    return (
        <div className="mt-4">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <Card>
                <CardContent>
                    <Accordion
                        type="single"
                        collapsible
                        value={isAccordionOpen ? 'item-1' : undefined}
                        onValueChange={(value) => setIsAccordionOpen(value === 'item-1')}>
                        <AccordionItem value="item-1" className="border-b-0 -mb-6">
                            <AccordionTrigger className='hover:no-underline hover:text-foreground/60 transition-color duration-200'>Player Activity</AccordionTrigger>
                            <AccordionContent>
                                {isLoading ? (
                                    <SkeletonLoader />
                                ) : (
                                    <div className='flex flex-col gap-2'>
                                        {data.map(renderEventCard)}
                                        {totalPages > 1 && (
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
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
};

export default GuildEventDisplay;
