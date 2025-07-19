"use client";

import { useState } from 'react';
import { getIdentificationInfo, processIdentification, calculateIdentificationRoll } from '@/lib/itemUtils';
import api from '@/lib/api';
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
  const [rankSuggestion, setRankSuggestion] = useState<React.ReactNode | null>(null);

  // States for comparison mode
  const [compareItemAString, setCompareItemAString] = useState<string>('');
  const [compareItemBString, setCompareItemBString] = useState<string>('');
  const [compareDataA, setCompareDataA] = useState<any>(null);
  const [compareDataB, setCompareDataB] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'analyze' | 'compare'>('analyze');

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



  // Define a simplified structure for what we expect from item database for ranking
  interface RankableItem {
    identifications: Record<string, number>; // Rolled values
    // Add any other properties needed if different from VerifiedItem in ItemWeightedLB
  }


  // Helper type for idRanges
  type IdRange = { min: number; max: number; raw: number };
  function isValidIdRange(obj: any): obj is IdRange {
    return obj && typeof obj.min === 'number' && typeof obj.max === 'number' && typeof obj.raw === 'number';
  }
  function filterValidIdRanges(idRanges: Record<string, any>): Record<string, IdRange> {
    const result: Record<string, IdRange> = {};
    for (const key in idRanges) {
      if (isValidIdRange(idRanges[key])) {
        result[key] = idRanges[key];
      }
    }
    return result;
  }
  const calculateOverallScoreForItem = (
    itemIdentifications: Record<string, number>,
    idRanges: Record<string, any>
  ): number => {
    const validIdRanges = filterValidIdRanges(idRanges);
    const keys = Object.keys(itemIdentifications).filter(k => validIdRanges[k]);
    if (keys.length === 0) return 0;
    const sumOfPercentages = keys.reduce((acc, key) => {
      const rollInfo = calculateIdentificationRoll(key, validIdRanges[key], itemIdentifications[key]);
      return acc + rollInfo.formattedPercentage;
    }, 0);
    return sumOfPercentages / keys.length;
  };

  const checkItemRankSuggestion = async (itemData: ItemAnalyzeData) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (!itemData?.input?.identifications || !itemData?.original?.identifications || !itemData.original.internalName) {
      setRankSuggestion(null);
      if (isDev) {
        console.log('[DEBUG] Missing required itemData fields:', {
          hasInputIdentifications: !!itemData?.input?.identifications,
          hasOriginalIdentifications: !!itemData?.original?.identifications,
          hasInternalName: !!itemData?.original?.internalName
        });
      }
      return;
    }

    const processedUserItemIds = processIdentification(itemData);
    if (isDev) console.log('[DEBUG] processedUserItemIds:', processedUserItemIds);
    // Calculate valid IDs count for each weight (based only on weight data, not user item)
    let validIdsCountPerWeight: Record<string, number> = {};
    if (itemData.weights && itemData.weights.length > 0) {
      if (isDev) console.log('[DEBUG] Checking threshold for each weight...');
      itemData.weights.forEach(weight => {
        // Only count identifications in the weight where the weight value is >= 0.03 (3%)
        const count = Object.values(weight.identifications).filter(val => Math.abs(val) >= 0.03).length;
        validIdsCountPerWeight[weight.weight_id] = count;
      });
    }
    // Fallback: use all weight identifications if no weights (rare)
    let fallbackValidIdsCount = 0;
    if (!itemData.weights || itemData.weights.length === 0) {
      if (itemData.input?.identifications) {
        fallbackValidIdsCount = Object.values(itemData.input.identifications).filter(val => Math.abs(val) >= 0.03).length;
      }
    }
    if (isDev) {
      console.log('[DEBUG] validIdsCountPerWeight:', validIdsCountPerWeight);
      console.log('[DEBUG] fallbackValidIdsCount:', fallbackValidIdsCount);
    }

    // STEP 1: Check if the item is "good enough" (meets the id:percent threshold for any weight)
    // We'll use the same logic as getPercentileThreshold, but require the user's score to be above the threshold for that weight
    // Helper for threshold (applies to both weighted and overall)
    function getStatThreshold(count: number) {
      if (count === 1) return 100;
      if (count === 2) return 99.5;
      if (count === 3) return 91;
      if (count === 4) return 88;
      if (count === 5) return 84;
      return 80;
    }

    // For each weight, check if the user's score is above the threshold
    let passesThresholdForAnyWeight = false;
    let userScoreByWeight: Record<string, number> = {};
    if (itemData.weights && itemData.weights.length > 0) {
      for (const weight of itemData.weights) {
        if (isDev) console.log(`[DEBUG] Weight: ${weight.weight_name}, weight_id: ${weight.weight_id}`);
        // Only count identifications in the weight where the scaled value is >= 0.04 (4%)
        const count = Object.values(weight.identifications).filter(val => Math.abs(val) >= 0.04).length;
        const threshold = getStatThreshold(count);
        if (isDev) console.log(`[DEBUG]   validIdsCount: ${count}, threshold: ${threshold}`);
        // Calculate user score for this weight (same as leaderboard logic)
        const idRanges = itemData.original.identifications;
        const keys = Object.keys(itemData.input.identifications).filter(k => typeof idRanges[k] === 'object' && idRanges[k] !== null && 'min' in idRanges[k] && 'max' in idRanges[k] && 'raw' in idRanges[k]);
        const userScore = keys.reduce((acc, key) => {
          const inputVal = itemData.input.identifications[key];
          const idRange = idRanges[key];
          if (!idRange || typeof idRange !== 'object' || !('min' in idRange && 'max' in idRange && 'raw' in idRange)) return acc;
          const { formattedPercentage } = calculateIdentificationRoll(key, idRange, inputVal);
          if (weight.identifications[key] < 0) {
            const invertedPercentage = 100 - formattedPercentage;
            return acc + Math.abs((invertedPercentage / 100) * (weight.identifications[key] || 0));
          } else {
            return acc + (formattedPercentage / 100) * (weight.identifications[key] || 0);
          }
        }, 0) * 100;
        if (isDev) console.log(`[DEBUG]   userScore: ${userScore}`);
        userScoreByWeight[weight.weight_id] = userScore;
        if (userScore >= threshold) {
          passesThresholdForAnyWeight = true;
          if (isDev) console.log(`[DEBUG]   PASSES threshold for weight: ${weight.weight_name}`);
          break; // Only need to pass for one weight
        } else {
          if (isDev) console.log(`[DEBUG]   DOES NOT PASS threshold for weight: ${weight.weight_name}`);
        }
      }
    }
    // Fallback: check overall (legacy behavior)
    // Always calculate userItemOverallScore so it is available for leaderboard logic
    let passesOverallThreshold = false;
    const idRanges = itemData.original.identifications;
    const validIdRanges = filterValidIdRanges(idRanges);
    const keys = Object.keys(itemData.input.identifications).filter(k => validIdRanges[k]);
    let userItemOverallScore: number = keys.length === 0 ? 0 : keys.reduce((acc, key) => {
      const rollInfo = calculateIdentificationRoll(key, validIdRanges[key], itemData.input.identifications[key]);
      return acc + rollInfo.formattedPercentage;
    }, 0) / keys.length;
    if (!passesThresholdForAnyWeight) {
      if (isDev) console.log('[DEBUG] Checking overall fallback threshold...');
      // Use the fallback valid id count for threshold
      const threshold = getStatThreshold(fallbackValidIdsCount);
      if (isDev) console.log(`[DEBUG]   userItemOverallScore: ${userItemOverallScore}, threshold: ${threshold}`);
      if (userItemOverallScore >= threshold) {
        passesOverallThreshold = true;
        if (isDev) console.log('[DEBUG]   PASSES overall threshold');
      } else {
        if (isDev) console.log('[DEBUG]   DOES NOT PASS overall threshold');
      }
    }
    // If not good enough, do not show suggestion

    if (isDev) console.log('[DEBUG] --- Checking leaderboard for each weight ---');

    // For each weight, determine the percentile threshold based on its valid id count
    // (moved to getPercentileThresholdLocal above)
    // No early return, always check leaderboard

    let weightRankResults: { name: string; rank: number; score: number }[] = [];
    let anyRanked = false;
    try {
      // Fetch all verified items for this base item type
      const dbItemsResponse = await fetch(api(`/item/database/${itemData.original.internalName}`));
      if (!dbItemsResponse.ok) throw new Error('Failed to fetch item database for ranking.');
      const dbItems: RankableItem[] = await dbItemsResponse.json();
      const idRanges = itemData.original.identifications;

      // Helper to get unique user key for deduplication
      const getUserKey = (item: any) => JSON.stringify(item.identifications);

      // If there are weights, check each one (reference ItemWeightedLB logic)
      if (itemData.weights && itemData.weights.length > 0) {
        for (const weight of itemData.weights) {
          if (isDev) console.log(`[DEBUG] [LB] Weight: ${weight.weight_name}`);
          // Reference: calculateScore from ItemWeightedLB
          // 1. Get keys present in both user item and idRanges
          const keys = Object.keys(itemData.input.identifications).filter(k => typeof idRanges[k] === 'object' && idRanges[k] !== null && 'min' in idRanges[k] && 'max' in idRanges[k] && 'raw' in idRanges[k]);
          // 2. Calculate user score for this weight
          const userScore = keys.reduce((acc, key) => {
            const inputVal = itemData.input.identifications[key];
            const idRange = idRanges[key];
            if (!idRange || typeof idRange !== 'object' || !('min' in idRange && 'max' in idRange && 'raw' in idRange)) return acc;
            const { formattedPercentage } = calculateIdentificationRoll(key, idRange, inputVal);
            if (weight.identifications[key] < 0) {
              // If the weight is negative, we need to invert the percentage
              const invertedPercentage = 100 - formattedPercentage;
              return acc + Math.abs((invertedPercentage / 100) * (weight.identifications[key] || 0));
            } else {
              return acc + (formattedPercentage / 100) * (weight.identifications[key] || 0);
            }
          }, 0) * 100;
          if (isDev) console.log(`[DEBUG] Weight: ${weight.weight_name}, userScore:`, userScore);

          // Calculate scores for all items in DB for this weight
          const allScores: { score: number; isUserItem: boolean; key: string; dbItem?: any }[] = [];
          const userKey = getUserKey(itemData.input);
          allScores.push({ score: userScore, isUserItem: true, key: userKey });
          dbItems.forEach(dbItem => {
            if (dbItem.identifications) {
              // Use the same keys logic as above
              const dbKeys = Object.keys(dbItem.identifications).filter(k => typeof idRanges[k] === 'object' && idRanges[k] !== null && 'min' in idRanges[k] && 'max' in idRanges[k] && 'raw' in idRanges[k]);
              const dbScore = dbKeys.reduce((acc, key) => {
                const inputVal = dbItem.identifications[key];
                const idRange = idRanges[key];
                if (!idRange || typeof idRange !== 'object' || !('min' in idRange && 'max' in idRange && 'raw' in idRange)) return acc;
                const { formattedPercentage } = calculateIdentificationRoll(key, idRange, inputVal);
                if (weight.identifications[key] < 0) {
                  const invertedPercentage = 100 - formattedPercentage;
                  return acc + Math.abs((invertedPercentage / 100) * (weight.identifications[key] || 0));
                } else {
                  return acc + (formattedPercentage / 100) * (weight.identifications[key] || 0);
                }
              }, 0) * 100;
              const dbKey = getUserKey(dbItem);
              allScores.push({ score: dbScore, isUserItem: false, key: dbKey, dbItem });
            }
          });
          // Remove duplicate entries by key (keep highest score for each unique key)
          const uniqueScoresMap = new Map();
          allScores.forEach(entry => {
            if (!uniqueScoresMap.has(entry.key) || uniqueScoresMap.get(entry.key).score < entry.score) {
              uniqueScoresMap.set(entry.key, entry);
            }
          });
          const uniqueScores = Array.from(uniqueScoresMap.values());
          uniqueScores.sort((a, b) => b.score - a.score);
          // Debug: print the sorted scores for this weight
          if (isDev) console.log(`[DEBUG] Weight: ${weight.weight_name}, sorted uniqueScores:`, uniqueScores.map((s, idx) => ({ idx: idx + 1, score: s.score, isUserItem: s.isUserItem, key: s.key, dbItem: s.dbItem })));
          let potentialRank = -1;
          for (let i = 0; i < uniqueScores.length; i++) {
            if (i < 10) {
              const entry = uniqueScores[i];
              if (isDev) console.log(`[DEBUG]   LB #${i + 1}: score=${entry.score}, isUserItem=${entry.isUserItem}`);
            }
            if (uniqueScores[i].isUserItem) {
              potentialRank = i + 1;
              break;
            }
          }
          if (isDev) console.log(`[DEBUG] Weight: ${weight.weight_name}, potentialRank:`, potentialRank, 'userKey:', userKey, 'uniqueScores:', uniqueScores);
          // Only show suggestion if leaderboard has at least 10 unique entries\
          // && uniqueScores.length >= 10
          if (potentialRank !== -1 && potentialRank <= 10 ) {
            // Check threshold for this weight before adding to results
            const count = validIdsCountPerWeight[weight.weight_id] || 0;
            const threshold = getStatThreshold(count);
            if (userScore >= threshold) {
              if (isDev) console.log(`[DEBUG]   User is rank ${potentialRank} of ${uniqueScores.length} (LB) and passes threshold (${userScore} >= ${threshold})`);
              weightRankResults.push({ name: weight.weight_name, rank: potentialRank, score: userScore });
              anyRanked = true;
            } else {
              if (isDev) console.log(`[DEBUG]   User is rank ${potentialRank} of ${uniqueScores.length} (LB) but does NOT pass threshold (${userScore} < ${threshold}), not adding to results.`);
            }
          } else {
            if (isDev) console.log(`[DEBUG]   User is NOT top 10 or leaderboard too small (rank=${potentialRank}, total=${uniqueScores.length})`);
          }
        }
      }
      // Fallback: also check overall (legacy behavior)
      // Move allScores, userItemOverallScore, etc. declaration above this block to avoid block-scope issues
      if (isDev) console.log('[DEBUG] --- Checking leaderboard for overall ---');
      // userItemOverallScore already declared above, so just use it here
      // Move this block after userItemOverallScore is declared and assigned
      // userItemOverallScore is already declared above, so do not redeclare it here
      // Find the previous declaration and move this block after it
      // Find the first declaration of userItemOverallScore
      // (should be above, after fallback threshold check)
      // So, just use it here
      // Only build allScoresOverall after userItemOverallScore is assigned
      let allScoresOverall: { score: number; isUserItem: boolean; key: string }[] = [];
      const userKeyOverall = getUserKey(itemData.input);
      // Only push if userItemOverallScore is assigned (after threshold check)
      if (typeof userItemOverallScore === 'number') {
        allScoresOverall.push({ score: userItemOverallScore, isUserItem: true, key: userKeyOverall });
      }
      dbItems.forEach(dbItem => {
        if (dbItem.identifications) {
          const score = calculateOverallScoreForItem(dbItem.identifications, idRanges);
          const dbKey = getUserKey(dbItem);
          allScoresOverall.push({ score: score, isUserItem: false, key: dbKey });
        }
      });
      // Remove duplicate entries by key
      const uniqueScoresMapOverall = new Map();
      allScoresOverall.forEach(entry => {
        if (!uniqueScoresMapOverall.has(entry.key) || uniqueScoresMapOverall.get(entry.key).score < entry.score) {
          uniqueScoresMapOverall.set(entry.key, entry);
        }
      });
      const uniqueScoresOverall = Array.from(uniqueScoresMapOverall.values());
      uniqueScoresOverall.sort((a, b) => b.score - a.score);
      // Debug print top 10 leaderboard entries
      for (let j = 0; j < Math.min(10, uniqueScoresOverall.length); j++) {
        const entry = uniqueScoresOverall[j];
        if (isDev) console.log(`[DEBUG]   LB #${j + 1}: score=${entry.score}, isUserItem=${entry.isUserItem}`);
      }
      let potentialRankOverall = -1;
      for (let i = 0; i < uniqueScoresOverall.length; i++) {
        if (uniqueScoresOverall[i].isUserItem) {
          potentialRankOverall = i + 1;
          break;
        }
      }
      if (isDev) console.log(`[DEBUG]   User is rank ${potentialRankOverall} of ${uniqueScoresOverall.length} (LB Overall)`);
      // Only show suggestion if leaderboard has at least 10 unique entries
      //  && uniqueScoresOverall.length >= 10
      if (potentialRankOverall !== -1 && potentialRankOverall <= 10) {
        // Count only identifications that are objects for overall threshold, and scaled >= 0.04 (4%)
        const overallValidIdCount = Object.entries(itemData.original?.identifications || {})
          .filter(([_, v]) => typeof v === 'object' && v !== null && typeof v.raw === 'number' && Math.abs(v.raw) >= 0.04)
          .length;
        const overallThreshold = getStatThreshold(overallValidIdCount);
        if (userItemOverallScore >= overallThreshold) {
        if (isDev) console.log(`[DEBUG]   User is rank ${potentialRankOverall} of ${uniqueScoresOverall.length} (LB Overall) and passes threshold (${userItemOverallScore} >= ${overallThreshold})`);
          weightRankResults.push({ name: 'Overall', rank: potentialRankOverall, score: userItemOverallScore });
          anyRanked = true;
        } else {
        if (isDev) console.log(`[DEBUG]   User is rank ${potentialRankOverall} of ${uniqueScoresOverall.length} (LB Overall) but does NOT pass threshold (${userItemOverallScore} < ${overallThreshold}), not adding to results.`);
        }
      } else {
      if (isDev) console.log(`[DEBUG]   User is NOT top 10 or leaderboard too small (rank=${potentialRankOverall}, total=${uniqueScoresOverall.length})`);
      }
      // The block below is redundant and causes scoping issues. The leaderboard logic for overall is already handled above using userItemOverallScore.
      // Removed duplicate/redeclaration of userItemOverallScore and related leaderboard logic.
      if (anyRanked && weightRankResults.length > 0) {
        if (isDev) console.log("3qwaeinujaeniu as", anyRanked, weightRankResults, passesThresholdForAnyWeight, passesOverallThreshold)
        // Only show suggestion if the item actually passed a threshold (for any weight or overall)
        if (passesThresholdForAnyWeight || passesOverallThreshold) {
          // Debug logs removed for production
          setRankSuggestion(
            // Styled suggestion message as a React element
            <div className="rounded-lg border border-green-400 bg-green-50 dark:bg-green-900/40 p-4 text-green-800 dark:text-green-200 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span className="inline-block text-green-500 dark:text-green-300">🏆</span>
                <span>This item is possibly ranked in the <span className="text-green-600 dark:text-green-200 font-bold">top 10</span> for:</span>
              </div>
              <ul className="pl-4 list-disc">
                {weightRankResults.map(r => (
                  <div key={r.name} className="font-medium">
                    <span className="text-green-700 dark:text-green-100">{r.name}</span>
                    {': '}<span className="font-bold">#{r.rank}</span> <span className="text-green-500">({r.score.toFixed(2)}%)</span>
                  </div>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span>Join our <Link href={'https://discord.gg/QVxPPqHFMk'} className='text-cyan-300 hover:text-cyan-500 transition-all hover:underline'>Discord</Link> for submitting item.</span>
              </div>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 rounded p-2 border border-yellow-300">
                As our database is relatively new, the rankings may be missing a lot of better ranked mythics. Please do not rely on these rankings for now while we collect more data.
              </div>
            </div>
          );
        } else {
          // Defensive: should not happen, but if it does, do not show suggestion
          if (isDev) console.log('[DEBUG] No threshold passed, not setting suggestion.');
          setRankSuggestion(null);
        }
      } else {
        if (isDev) console.log('[DEBUG] No ranks found, not setting suggestion.');
        setRankSuggestion(null);
      }
      if (!passesThresholdForAnyWeight && !passesOverallThreshold) {
        setRankSuggestion(null);
        if (isDev) {
          console.log('[DEBUG] Item does not meet threshold for any weight or overall. No suggestion.');
          console.log('[DEBUG] --- checkItemRankSuggestion END (NO SUGGESTION) ---');
        }
        return;
      }
    } catch (e: any) {
      if (isDev) console.error("[DEBUG] Failed to get rank suggestion:", e);
      setRankSuggestion(
        <div className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-900/40 p-4 text-red-800 dark:text-red-200 flex items-center gap-2">
          <span className="inline-block text-red-500 dark:text-red-300">❌</span>
          <span>Could not fetch rank suggestion at this time.</span>
        </div>
      );
    }
  };

  // Fetch data for comparison mode
const fetchCompareItemData = async (
  itemString: string,
  itemSetter: React.Dispatch<React.SetStateAction<any>>
) => {
  // Re-uses the single item fetch logic but targets comparison state setters
  // This could be further optimized by abstracting the core fetch logic
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
};

  const handleCompare = async () => {
    if (!compareItemAString.trim() || !compareItemBString.trim()) {
      setCompareError("Please enter both item strings.");
      return;
    }
    setCompareLoading(true);
    setCompareError(null);
    setCompareDataA(null);
    setCompareDataB(null);

    try {
      await Promise.all([
        fetchCompareItemData(compareItemAString, setCompareDataA),
        fetchCompareItemData(compareItemBString, setCompareDataB),
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
    if (inputValue.trim() !== '') {
      fetchItemData(inputValue);
    }
  };

  // Enhanced: renderWeightComparison now takes A and B, and shows which side is better
  const renderWeightComparison = (compareDataA: any, compareDataB: any) => {
    if (!compareDataA || !compareDataB || !compareDataA.weights || !compareDataB.weights) {
      return <p>Loading comparison data or weights unavailable...</p>;
    }

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
          <div></div>
          <div className="text-lg">Item B Weights</div>
        </div>
        {Array.from(allWeightNames).map(weightName => {
          const weightA = compareDataA.weights.find((w: Weight) => w.weight_name === weightName);
          const weightB = compareDataB.weights.find((w: Weight) => w.weight_name === weightName);

          const scoreA = weightA ? calculateWeightedScore(processedA, weightA.identifications).total * 100 : null;
          const scoreB = weightB ? calculateWeightedScore(processedB, weightB.identifications).total * 100 : null;

          // if (isDev) console.log(scoreA, scoreB, "1298371hd9uan")
          let winner: 'A' | 'B' | null = null;
          if (scoreA !== null && scoreB !== null) {
            if (scoreA > scoreB) winner = 'A';
            else if (scoreB > scoreA) winner = 'B';
          }

          return (
            <div key={weightName} className="grid grid-cols-3 gap-4 items-center py-2 border-b">
              <div className={winner === 'A' ? 'truncate font-bold text-green-600 dark:text-green-300' : 'truncate'}>
                <p className="font-medium">{weightName}</p>
                {scoreA !== null ? `${scoreA.toFixed(2)}%` : <span className="text-gray-400">N/A</span>}
                {winner === 'A' && <span className="ml-2 text-green-500 dark:text-green-300">▲</span>}
              </div>
              <div className="text-center text-2xl text-primary/70">↔</div>
              <div className={winner === 'B' ? 'truncate text-right font-bold text-green-600 dark:text-green-300' : 'truncate text-right'}>
                <p className="font-medium">{weightName}</p>
                {scoreB !== null ? `${scoreB.toFixed(2)}%` : <span className="text-gray-400">N/A</span>}
                {winner === 'B' && <span className="ml-2 text-green-500 dark:text-green-300">▲</span>}
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
        <div className='flex flex-col items-center'>
          <h1 className="text-3xl font-bold text-primary">Wynncraft Item Analyzer</h1>
          <p className='text-primary/50'>Weight for every item on <Link href="/item/weight" className='transition-color duration-150 text-blue-600 hover:text-blue-800'>Item Weights</Link></p>
          <p className='text-primary/50'>Having questions about weights?</p>
          <p className='text-primary/50'>Join <Link href="https://discord.gg/QZn4Qk3mSP" className='transition-color duration-150 text-blue-600 hover:text-blue-800'>Wynnpool Official Discord</Link></p>
          <p className='text-red-300 mt-3'>Reminder: If you are having problem with fetching item</p>
          <p className='text-red-300'>Please join the discord server above for support</p>
        </div>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'analyze' | 'compare')}
          className="w-full max-w-xl"
        >
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
                placeholder="Paste First String"
                className="text-primary placeholder-gray-400"
              />
              <Input
                value={compareItemBString}
                onChange={(e) => setCompareItemBString(e.target.value)}
                placeholder="Paste Second String"
                className="text-primary placeholder-gray-400"
              />
              <Button onClick={handleCompare} className="w-full" disabled={compareLoading}>
                {compareLoading ? "Comparing..." : "Compare Items"}
              </Button>
              {compareError && <p className="text-red-500 text-sm mt-2">{compareError}</p>}
            </div>
          </TabsContent>
        </Tabs>

        {/* Display area for single analysis results (conditionally rendered based on demoData) */}
        {/* This content appears when demoData is populated from the "Analyze Single Item" tab */}
        {activeTab === 'analyze' && demoData && !loading && !error && (
          <>
            {rankSuggestion && (
              <div className="my-2 w-full max-w-xl">{rankSuggestion}</div>
            )}
            {demoData.original?.identified && (
              <div className="text-yellow-400 mt-2 w-full max-w-xl">⚠️ This item is already identified.</div>
            )}
            {!demoData.original?.identified && (
              <div className="flex flex-col md:flex-row md:items-start items-center gap-6 mt-6 w-full max-w-screen-lg">
                {/* Item display always on the left, centered on mobile */}
                <div className="w-full md:w-auto flex justify-center md:justify-start md:items-start">
                  <div className="max-w-md w-full flex flex-col items-center md:items-start">
                    <RolledItemDisplay data={demoData} />
                  </div>
                </div>
                {/* Right side: Tabs for Weights/Leaderboard */}
                <div className="w-full md:w-[480px] flex flex-col space-y-6">
                  <Tabs defaultValue="weights" className="w-full" id="weights-leaderboard-tabs">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                      <TabsTrigger value="weights">Item Weights</TabsTrigger>
                      <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                    </TabsList>
                    <TabsContent value="weights">
                      {demoData.weights?.length > 0 ? (
                        <Card>
                          <CardHeader><CardTitle>Item Weights</CardTitle></CardHeader>
                          <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                              {(() => {
                                const processed = processIdentification(demoData);
                                // Sort weights by score descending
                                const weightsWithScore = demoData.weights.map((weight: Weight): { weight: Weight; score: number } => {
                                  const result = calculateWeightedScore(processed, weight.identifications);
                                  return { weight, score: result.total };
                                });
                                weightsWithScore.sort((a: { weight: Weight; score: number }, b: { weight: Weight; score: number }) => b.score - a.score);
                                return weightsWithScore.map(({ weight, score }: { weight: Weight; score: number }) => {
                                  return (
                                    <AccordionItem value={weight.weight_id} key={weight.weight_id}>
                                      <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                          <span>{weight.weight_name}</span>
                                          <span className="text-blue-400 font-semibold">
                                            [{(score * 100).toFixed(2)}%]
                                          </span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <ul className="text-gray-300 text-sm space-y-1 pl-4">
                                          {Object.entries(weight.identifications).map(([key, value]) => {
                                            const idInfo = getIdentificationInfo(key);
                                            const percent = Math.trunc((value as number) * 10000) / 100;
                                            return (
                                              <li key={key}>
                                                <span className="text-primary">
                                                  {idInfo?.displayName || key}
                                                </span>: {percent.toFixed(2)}%
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
                      ) : (
                        <div className="text-center text-gray-400">No weights available.</div>
                      )}
                    </TabsContent>
                    <TabsContent value="leaderboard" className="md:items-start md:justify-start flex flex-col">
                      {demoData.original?.internalName ? (
                        <Card className="w-full">
                          <CardHeader><CardTitle>Item Leaderboard</CardTitle></CardHeader>
                          <CardContent>
                            <ItemWeightedLB
                              item={{ internalName: demoData.original.internalName }}
                              isEmbedded={true}
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center text-gray-400">No leaderboard available.</div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </>
        )}

        {/* Display area for comparison results (conditionally rendered based on compareDataA and compareDataB) */}
        {/* This content appears when compareDataA and compareDataB are populated from the "Compare Two Items" tab */}
        {activeTab === 'compare' && !compareLoading && compareDataA && compareDataB && (
          <div className="w-full max-w-3xl mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-xl">Item Comparison Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    {/* <h3 className="font-semibold text-lg mb-2 text-center">Item A: {compareDataA.original?.name || compareDataA.input?.name || 'Unknown'}</h3> */}
                    {compareDataA.original?.identified ? (
                      <p className="text-yellow-400 text-center">⚠️ Item A is already identified.</p>
                    ) : compareDataA.input ? (
                      <RolledItemDisplay data={compareDataA} />
                    ) : (
                      <p className="text-center text-gray-400">Could not display Item A details.</p>
                    )}
                  </div>
                  <div>
                    {/* <h3 className="font-semibold text-lg mb-2 text-center">Item B: {compareDataB.original?.name || compareDataB.input?.name || 'Unknown'}</h3> */}
                    {compareDataB.original?.identified ? (
                      <p className="text-yellow-400 text-center">⚠️ Item B is already identified.</p>
                    ) : compareDataB.input ? (
                      <RolledItemDisplay data={compareDataB} />
                    ) : (
                      <p className="text-center text-gray-400">Could not display Item B details.</p>
                    )}
                  </div>
                </div>
                {renderWeightComparison(compareDataA, compareDataB)}
              </CardContent>
            </Card>
          </div>
        )}
        {compareLoading && <p className="mt-4 text-center">Loading comparison data...</p>}
        {/* Note: compareError is shown within its tab. If global compare error display is needed, add here. */}

        {/* FAQ section: only show when no item is analyzed and not loading or error */}
        {activeTab === 'analyze' && !demoData && !loading && !error && (
          <div className="w-full max-w-xl mt-12 border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-2">FAQ</h2>
            <div className="mb-2">
              <span className="font-semibold">Q: How do I copy a string of an item?</span>
              <br />
              <span className="">A: Get <Link href="https://wynntils.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors duration-150">Wynntils</Link>, press <span className="font-mono bg-muted px-1 rounded">F3</span> when hovering on your item in inventory.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
