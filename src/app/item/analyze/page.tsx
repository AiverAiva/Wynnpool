"use client";

import { useState } from 'react';
import { getIdentificationInfo, getRollPercentageString, processIdentification } from '@/lib/itemUtils';
import { ItemAnalyzeData, RolledItemDisplay } from '@/components/wynncraft/item/RolledItemDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

function calculateWeightedScore(
  ids: { name: string; percentage: number }[],
  weightMap: Record<string, number>
): { total: number; detailed: { name: string; score: number }[] } {
  let total = 0;

  const detailed = ids.map((id) => {
    const weight = weightMap[id.name] ?? 0;
    const score = (id.percentage / 100) * weight;
    total += score;
    return { name: id.name, score: parseFloat(score.toFixed(3)) };
  });

  return {
    total: parseFloat(total.toFixed(3)),
    detailed,
  };
}

export interface Weight {
  item_name: string;
  item_id: string;
  weight_name: string;
  weight_id: string;
  type: string;
  author: string;
  timestamp: number;
  identifications: Record<string, number>;
  description: string;
  userId: string;
}

export default function Home() {
  // State for the item input, fetched data, and loading status
  const [inputValue, setInputValue] = useState<string>('');
  const [demoData, setDemoData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle the API request
  const fetchItemData = async (item: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.wynnpool.com/item/full-decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch item data');
      }

      const data = await response.json();
      if (data) {
        setDemoData(data); // Save item data to state if the response is valid
      } else {
        throw new Error('Invalid item data');
      }
    } catch (error: any) {
      setError(error.message); // Show error message if something goes wrong
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submission or input change event
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      fetchItemData(inputValue);
    }
  };
  return (
    <div className="container mx-auto p-4 max-w-screen-lg">
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-12 space-y-6">
        <div className='mt-[80px]' />
        <Badge variant="outline" className="text-foreground/50">Beta Version</Badge>
        <div className='flex flex-col items-center'> 
          <h1 className="text-3xl font-bold text-primary">Wynncraft Item Analyzer</h1>
          <p className='text-primary/50'>Weight for every item on <Link href="https://weight.wynnpool.com/" className='transition-color duration-150 text-blue-600 hover:text-blue-800'>weight.wynnpool.com</Link></p>
          <p className='text-primary/50'>Having questions about weights?</p>
          <p className='text-primary/50'>Join <Link href="https://discord.gg/QZn4Qk3mSP" className='transition-color duration-150 text-blue-600 hover:text-blue-800'>Wynnpool Official Discord</Link></p>
          <p className='text-red-300 mt-3'>Reminder: If you are having problem with fetching item</p>
          <p className='text-red-300'>Please join the discord server above for support</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter Wynntils Item String"
            className="text-primary placeholder-gray-400"
          />
          <Button type="submit" className="w-full">
            {loading ? "Loading..." : "Analyze"}
          </Button>
        </form>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {demoData?.original?.identified && (
          <div className="text-yellow-400">⚠️ This item is already identified.</div>
        )}

        {demoData && !loading && !error && !demoData.original.identified && (
          <div className="flex justify-center w-full space-y-6 mt-6 gap-4">
            <RolledItemDisplay data={demoData} />
            {demoData.weights?.length > 0 && (
              <div className="grid grid-cols-1 space-y-4">
                {(() => {
                  const processed = processIdentification(demoData)
                  return demoData.weights.map((weight: Weight) => {
                    const result = calculateWeightedScore(processed, weight.identifications)
                    return (
                      <Card key={weight.weight_id} className='w-fit h-fit'>
                        <CardContent className="p-4 space-y-2">
                          <h3 className="text-blue-400 font-semibold text-sm">
                            🏋️ {weight.weight_name} [{getRollPercentageString(result.total * 100)}]
                          </h3>
                          <ul className="text-gray-300 text-sm space-y-1">
                            {Object.entries(weight.identifications).map(([key, value]) => {
                              const percent = Math.trunc(value * 10000) / 100
                              return (
                                <li key={key}>
                                  <span className="text-primary">
                                    {getIdentificationInfo(key)?.displayName}
                                  </span>: {percent.toFixed(2)}%
                                </li>
                              )
                            })}
                          </ul>
                        </CardContent>
                      </Card>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
