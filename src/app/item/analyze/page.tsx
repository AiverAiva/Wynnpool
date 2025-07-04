"use client";

import { useState } from 'react';
import { getIdentificationInfo, processIdentification } from '@/lib/itemUtils';
import { ItemAnalyzeData, RolledItemDisplay } from '@/components/wynncraft/item/RolledItemDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ItemWeightedLB from '@/app/item/ranking/item-weighted-lb'; // Assuming this is the correct path
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function calculateWeightedScore(
  ids: { name: string; percentage: number }[],
  weightMap: Record<string, number>
): { total: number; detailed: { name: string; score: number }[] } {
  let total = 0;

  const detailed = ids.map((id) => {
    const weight = weightMap[id.name] ?? 0;
    const score: number = 0

    if (weight < 0) {
      // If the weight is negative, we need to invert the percentage
      const invertedPercentage = 100 - id.percentage;
      total += Math.abs((invertedPercentage / 100) * weight);
    } else {
      total += (id.percentage / 100) * weight;
    }

    return { name: id.name, score: parseFloat(score.toFixed(3)) };
  });
  // return keys.reduce((acc, key) => {
  //   const inputVal = entry.identifications[key];
  //   const { formattedPercentage } = calculateIdentificationRoll(key, idRanges[key], inputVal);
    // if (weight.identifications[key] < 0) {
    //   // If the weight is negative, we need to invert the percentage
    //   const invertedPercentage = 100 - formattedPercentage;
    //   return acc + Math.abs((invertedPercentage / 100) * (weight.identifications[key] || 0));
    // } else {
    //   return acc + (formattedPercentage / 100) * (weight.identifications[key] || 0);
    // }
  // }, 0);
  return {
    total: parseFloat(total.toFixed(4)),
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
  const [rankSuggestion, setRankSuggestion] = useState<string | null>(null);

  // States for comparison mode
  const [compareItemAString, setCompareItemAString] = useState<string>('');
  const [compareItemBString, setCompareItemBString] = useState<string>('');
  const [compareDataA, setCompareDataA] = useState<any>(null);
  const [compareDataB, setCompareDataB] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("analyze"); // State for active tab

  // Function to handle the API request for single item analysis
  const fetchItemData = async (item: string) => {
    setLoading(true);
    setError(null);
    setDemoData(null); // Clear previous single item data
    setRankSuggestion(null);


    try {
      // const response = await fetch('https://api.wynnpool.com/item/full-decode', {
      const response = await fetch(api('/item/full-decode'), {
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
        checkItemRankSuggestion(data); // Re-enable rank suggestion check
      } else {
        throw new Error('Invalid item data');
      }
    } catch (error: any) {
      setError(error.message); // Show error message if something goes wrong
    } finally {
      setLoading(false);
    }
  };

import { calculateIdentificationRoll } from '@/lib/itemUtils'; // Added for rank suggestion
import api from '@/lib/api'; // Ensure api is imported

// Define a simplified structure for what we expect from item database for ranking
interface RankableItem {
  identifications: Record<string, number>; // Rolled values
  // Add any other properties needed if different from VerifiedItem in ItemWeightedLB
}


const calculateOverallScoreForItem = (
  itemIdentifications: Record<string, number>, // The rolled IDs of the item (e.g., itemData.input.identifications)
  idRanges: Record<string, { min: number; max: number; raw: number }> // Base ID ranges for the item type (e.g., itemData.original.identifications)
): number => {
  const keys = Object.keys(itemIdentifications).filter(k => !!idRanges[k]);
  if (keys.length === 0) return 0;

  const sumOfPercentages = keys.reduce((acc, key) => {
    const rollInfo = calculateIdentificationRoll(key, idRanges[key], itemIdentifications[key]);
    return acc + rollInfo.formattedPercentage;
  }, 0);

  // Return score as a percentage (0-100)
  return sumOfPercentages / keys.length;
};


  const checkItemRankSuggestion = async (itemData: ItemAnalyzeData) => {
    // itemData now expected to be ItemAnalyzeData for better type safety
    if (!itemData?.input?.identifications || !itemData?.original?.identifications || !itemData.original.internalName) {
      setRankSuggestion(null);
      return;
    }

    const processedUserItemIds = processIdentification(itemData);
    const goodIdsCount = processedUserItemIds.filter(id => id.percentage > 3).length;

    let percentileThreshold = 0;
    if (goodIdsCount === 2) percentileThreshold = 99;
    else if (goodIdsCount === 3) percentileThreshold = 92.5;
    else if (goodIdsCount >= 4 && goodIdsCount <= 6) percentileThreshold = 85;
    else {
      setRankSuggestion(null);
      return;
    }

    const userItemOverallScore = calculateOverallScoreForItem(itemData.input.identifications, itemData.original.identifications);

    if (userItemOverallScore < percentileThreshold) {
      setRankSuggestion(null);
      // console.log(`User item score ${userItemOverallScore} below threshold ${percentileThreshold}`);
      return;
    }

    // console.log(`User item score ${userItemOverallScore} meets threshold ${percentileThreshold}. Fetching DB for ranking.`);

    try {
      // Fetch all verified items for this base item type
      // The structure of items from this endpoint needs to be RankableItem compatible
      const dbItemsResponse = await fetch(api(`/item/database/${itemData.original.internalName}`));
      if (!dbItemsResponse.ok) throw new Error('Failed to fetch item database for ranking.');
      const dbItems: RankableItem[] = await dbItemsResponse.json();

      // Fetch full item details for ID ranges (might be redundant if itemData.original is already this)
      // Assuming itemData.original.identifications already contains the necessary ID ranges.
      const idRanges = itemData.original.identifications;

      const allScores: { score: number; isUserItem: boolean }[] = [];

      // Calculate score for the user's item
      allScores.push({ score: userItemOverallScore, isUserItem: true });

      // Calculate scores for all items from the database
      dbItems.forEach(dbItem => {
        // Ensure dbItem.identifications is not null or undefined
        if (dbItem.identifications) {
            const score = calculateOverallScoreForItem(dbItem.identifications, idRanges);
            allScores.push({ score: score, isUserItem: false });
        }
      });

      // Sort scores in descending order
      allScores.sort((a, b) => b.score - a.score);

      // Find the rank of the user's item
      let potentialRank = -1;
      for (let i = 0; i < allScores.length; i++) {
        if (allScores[i].isUserItem) {
          potentialRank = i + 1;
          break;
        }
      }

      // console.log(`Potential rank: ${potentialRank}, Total items in ranking: ${allScores.length}`);

      if (potentialRank !== -1 && potentialRank <= 10) {
        setRankSuggestion(`This item is possibly good enough to be ranked at #${potentialRank}! (Overall score: ${userItemOverallScore.toFixed(2)}%)`);
      } else {
        // console.log("Item is good but not top 10, or rank couldn't be determined.");
        setRankSuggestion(null); // Not top 10 or user item not found (should not happen if pushed correctly)
      }

    } catch (e: any) {
      console.error("Failed to get rank suggestion:", e);
      setRankSuggestion("Could not fetch rank suggestion at this time.");
    }
  };

  // Fetch data for comparison mode
  const fetchCompareItemData = async (itemString: string, itemSetter: React.Dispatch<React.SetStateAction<any>>) => {
    // Re-uses the single item fetch logic but targets comparison state setters
    // This could be further optimized by abstracting the core fetch logic
    try {
      // const response = await fetch('https://api.wynnpool.com/item/full-decode', {
      const response = await fetch(api('/item/full-decode'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: itemString }),
      });
      if (!response.ok) throw new Error(`Failed to fetch item data for ${itemString}`);
      const data = await response.json();
      if (data) {
        itemSetter(data);
      } else {
        throw new Error(`Invalid item data for ${itemString}`);
      }
    } catch (err: any) {
      throw err; // Rethrow to be caught by handleCompare
    }
  };

  const handleCompare = async () => {
    const trimmedA = compareItemAString.trim();
    const trimmedB = compareItemBString.trim();

    if (!trimmedA || !trimmedB) {
      setCompareError("Please enter both item strings.");
      return;
    }
    setCompareLoading(true);
    setCompareError(null);
    setCompareDataA(null);
    setCompareDataB(null);

    try {
      await Promise.all([
        fetchCompareItemData(trimmedA, setCompareDataA),
        fetchCompareItemData(trimmedB, setCompareDataB),
      ]);
    } catch (error: any) {
      setCompareError(error.message || "Failed to fetch one or both items for comparison.");
    } finally {
      setCompareLoading(false);
    }
  };


  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submission or input change event
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInputValue = inputValue.trim();
    if (trimmedInputValue !== '') {
      fetchItemData(trimmedInputValue);
    }
  };

  const renderWeightComparison = () => {
    if (!compareDataA || !compareDataB || !compareDataA.weights || !compareDataB.weights) {
      return <p>Loading comparison data or weights unavailable...</p>;
    }

    // Assuming weights are matched by name or ID. For simplicity, let's use weight_name.
    // A more robust solution might involve matching by weight_id if names can vary.
    const allWeightNames = new Set([
      ...compareDataA.weights.map((w: Weight) => w.weight_name),
      ...compareDataB.weights.map((w: Weight) => w.weight_name)
    ]);

    const processedA = processIdentification(compareDataA);
    const processedB = processIdentification(compareDataB);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 items-center font-semibold mb-2">
          <div className="text-lg">Item A Weights</div>
          <div></div> {/* Spacer for the arrow */}
          <div className="text-lg">Item B Weights</div>
        </div>
        {Array.from(allWeightNames).map(weightName => {
          const weightA = compareDataA.weights.find((w: Weight) => w.weight_name === weightName);
          const weightB = compareDataB.weights.find((w: Weight) => w.weight_name === weightName);

          const scoreA = weightA ? calculateWeightedScore(processedA, weightA.identifications).total * 100 : null;
          const scoreA = weightA ? calculateWeightedScore(processedA, weightA.identifications).total * 100 : null;
          const scoreB = weightB ? calculateWeightedScore(processedB, weightB.identifications).total * 100 : null;

          let itemAColor = "text-primary"; // Default color
          let itemBColor = "text-primary"; // Default color

          if (scoreA !== null && scoreB !== null) {
            if (scoreA > scoreB) {
              itemAColor = "text-green-500 font-semibold";
              itemBColor = "text-red-500";
            } else if (scoreB > scoreA) {
              itemBColor = "text-green-500 font-semibold";
              itemAColor = "text-red-500";
            }
            // If scores are equal, they remain default color (or you can add a specific color for ties)
          } else if (scoreA !== null && scoreB === null) {
            itemAColor = "text-green-500 font-semibold"; // Item A has a score, B doesn't
          } else if (scoreB !== null && scoreA === null) {
            itemBColor = "text-green-500 font-semibold"; // Item B has a score, A doesn't
          }


          return (
            <div key={weightName} className="grid grid-cols-3 gap-2 items-center py-3 border-b last:border-b-0">
              <div className={`truncate ${itemAColor}`}>
                <p className={`font-medium ${itemAColor}`}>{weightName}</p>
                {scoreA !== null ? `${scoreA.toFixed(2)}%` : <span className="text-gray-400">N/A</span>}
              </div>
              <div className="text-center text-xl text-primary/70">vs</div>
              <div className={`truncate text-right ${itemBColor}`}>
                <p className={`font-medium ${itemBColor}`}>{weightName}</p>
                {scoreB !== null ? `${scoreB.toFixed(2)}%` : <span className="text-gray-400">N/A</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
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

        <Tabs defaultValue="analyze" className="w-full max-w-xl" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">Analyze Single Item</TabsTrigger>
            <TabsTrigger value="compare">Compare Two Items</TabsTrigger>
          </TabsList>
          <TabsContent value="analyze">
            <form onSubmit={handleSubmit} className="w-full space-y-4 mt-4">
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
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </TabsContent>
          <TabsContent value="compare">
            <div className="w-full space-y-4 mt-4">
              <Input
                value={compareItemAString}
                onChange={(e) => setCompareItemAString(e.target.value)}
                placeholder="Paste Item A String"
                className="text-primary placeholder-gray-400"
              />
              <Input
                value={compareItemBString}
                onChange={(e) => setCompareItemBString(e.target.value)}
                placeholder="Paste Item B String"
                className="text-primary placeholder-gray-400"
              />
              <Button onClick={handleCompare} className="w-full" disabled={compareLoading}>
                {compareLoading ? "Comparing..." : "Compare Items"}
              </Button>
              {compareError && <p className="text-red-500 text-sm mt-2">{compareError}</p>}
            </div>
          </TabsContent>
        </Tabs>

        {/* Display area for single analysis results (conditionally rendered based on demoData and activeTab) */}
        {activeTab === "analyze" && demoData && !loading && !error && (
          <>
            {rankSuggestion && (
              <div className="text-green-500 font-semibold my-2 p-2 bg-green-100 border border-green-300 rounded w-full max-w-xl">
                {rankSuggestion}
              </div>
            )}
            {demoData.original?.identified && (
              <div className="text-yellow-400 mt-2 w-full max-w-xl">⚠️ This item is already identified.</div>
            )}
            {!demoData.original?.identified && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full max-w-screen-lg"> {/* Changed md:grid-cols-3 to md:grid-cols-2 */}
                <div className="md:col-span-1"> {/* This will now take 1 of 2 columns */}
                  <RolledItemDisplay data={demoData} />
                </div>
                <div className="md:col-span-1 space-y-6"> {/* This will now take 1 of 2 columns */}
                  {demoData.weights?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>Item Weights</CardTitle></CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                          {(() => {
                            const processed = processIdentification(demoData);
                            return demoData.weights.map((weight: Weight) => {
                              const result = calculateWeightedScore(processed, weight.identifications);
                              const currentWeightScore = result.total * 100;
                              let specificWeightSuggestionMessage = null;

                              if (weight.identifications) {
                                const meaningfulContributorsInWeightDefinitionCount = Object.values(
                                  weight.identifications
                                ).filter(factor => factor > 0.03).length; // Count factors > 3%

                                if (
                                  (meaningfulContributorsInWeightDefinitionCount === 2 && currentWeightScore >= 99) ||
                                  (meaningfulContributorsInWeightDefinitionCount === 3 && currentWeightScore >= 92.5) ||
                                  (meaningfulContributorsInWeightDefinitionCount >= 4 &&
                                   meaningfulContributorsInWeightDefinitionCount <= 6 && currentWeightScore >= 85)
                                ) {
                                  specificWeightSuggestionMessage = `This item is exceptionally good for '${weight.weight_name}' (Score: ${currentWeightScore.toFixed(2)}%)!`;
                                }
                              }

                              return (
                                <AccordionItem value={weight.weight_id} key={weight.weight_id}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex flex-col items-start text-left w-full pr-2"> {/* Ensure text aligns left */}
                                      <div className="flex justify-between w-full">
                                        <span>{weight.weight_name}</span>
                                        <span className="text-blue-400 font-semibold">
                                          [{currentWeightScore.toFixed(2)}%]
                                        </span>
                                      </div>
                                      {specificWeightSuggestionMessage && (
                                        <div className="text-xs text-green-400 mt-1 font-normal"> {/* Suggestion styling */}
                                          {specificWeightSuggestionMessage}
                                        </div>
                                      )}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ul className="text-gray-300 text-sm space-y-1 pl-4">
                                      {Object.entries(weight.identifications).map(([key, value]) => {
                                        const idInfo = getIdentificationInfo(key);
                                        const factorPercent = value * 100;
                                        return (
                                          <li key={key}>
                                            <span className="text-primary">
                                              {idInfo?.displayName || key}
                                            </span>: {factorPercent.toFixed(2)}% factor
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            });
                          })()}
                        </Accordion>
                      </CardContent>
                    </Card>
                  )}
                  {demoData.original?.internalName && (
                    <Card>
                      <CardHeader><CardTitle>Item Leaderboard</CardTitle></CardHeader>
                      <CardContent>
                        <ItemWeightedLB
                          item={{ internalName: demoData.original.internalName }}
                         isEmbedded={true}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Display area for comparison results (conditionally rendered based on compareDataA, compareDataB and activeTab) */}
        {activeTab === "compare" && !compareLoading && compareDataA && compareDataB && (
          <div className="w-full max-w-3xl mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-xl">Item Comparison Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-center">Item A: {compareDataA.original?.name || compareDataA.input?.name || 'Unknown'}</h3>
                    {compareDataA.original?.identified ? (
                      <p className="text-yellow-400 text-center">⚠️ Item A is already identified.</p>
                    ) : compareDataA.input ? (
                      <RolledItemDisplay data={compareDataA} />
                    ) : (
                      <p className="text-center text-gray-400">Could not display Item A details.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-center">Item B: {compareDataB.original?.name || compareDataB.input?.name || 'Unknown'}</h3>
                    {compareDataB.original?.identified ? (
                      <p className="text-yellow-400 text-center">⚠️ Item B is already identified.</p>
                    ) : compareDataB.input ? (
                      <RolledItemDisplay data={compareDataB} />
                    ) : (
                      <p className="text-center text-gray-400">Could not display Item B details.</p>
                    )}
                  </div>
                </div>
                {renderWeightComparison()}
              </CardContent>
            </Card>
          </div>
        )}
        {compareLoading && <p className="mt-4 text-center">Loading comparison data...</p>}
        {/* Note: compareError is shown within its tab. If global compare error display is needed, add here. */}
      </div>
    </div>
  );
}
