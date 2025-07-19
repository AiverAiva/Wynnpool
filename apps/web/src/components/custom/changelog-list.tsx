'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

interface ChangelogListProps {
  limit?: number;
}

export function ChangelogList({ limit = 5 }: ChangelogListProps) {
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChangelogList();
  }, []);

  const fetchChangelogList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(api('/item/changelog/list'));
      if (!response.ok) {
        throw new Error('Failed to fetch changelog list');
      }
      const data: number[] = await response.json();
      setTimestamps(data);
    } catch (err: any) {
      setError('An error occurred while fetching the changelog list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days ago
  const getDaysAgo = (timestamp: number): string => {
    const now = new Date();
    const changelogDate = new Date(timestamp * 1000);
    
    // Calculate difference in days
    const diffTime = Math.abs(now.getTime() - changelogDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Display limited number of timestamps
  const displayedTimestamps = timestamps.slice(0, limit);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Recent Item Changes
        </CardTitle>
        <CardDescription>
          Latest item updates and modifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="text-red-500 py-4">{error}</div>
        ) : timestamps.length === 0 ? (
          // Empty state
          <div className="text-center text-muted-foreground py-4">
            No changelog data available
          </div>
        ) : (
          // Changelog list
          <div className="space-y-1">
            {displayedTimestamps.map((timestamp) => (
              <Link 
                key={timestamp} 
                href={`/item/changelog/`}
                // href={`/changelog/${timestamp}`}
                className="flex justify-between items-center py-3 px-2 border-b last:border-0 hover:bg-muted/50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatDate(timestamp)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-3 w-3" />
                  <span>{getDaysAgo(timestamp)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      {!loading && !error && timestamps.length > limit && (
        <CardFooter className="flex justify-center pt-2 pb-4">
          <Button variant="outline" asChild>
            <Link href="/changelog" className="flex items-center gap-2">
              Show more changelogs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}