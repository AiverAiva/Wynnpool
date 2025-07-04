"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { CombatItem } from "@/types/itemType";
import { calculateIdentificationRoll, getRollPercentageString } from "@/lib/itemUtils";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import api from "@/lib/api";
import { RolledItemDisplay } from "@/components/wynncraft/item/RolledItemDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added for embeddable version

interface Item { internalName: string; }

interface VerifiedItem {
  itemName: string;
  owner: string;
  timestamp: number;
  originalString: string;
  identifications: Record<string, number>;
  shinyStat?: {                   // ← new optional field
    key: string;
    displayName: string;
    value: number;
  };
  ironman?: boolean;
}

interface Weight {
  weight_name: string;
  weight_id: string;
  identifications: Record<string, number>;
}

interface IdentificationRange {
  min: number;
  raw: number;
  max: number;
}

interface ItemWeightedLBProps {
  item: Item;
  open?: boolean; // Optional for embedded mode
  onClose?: () => void; // Optional for embedded mode
  isEmbedded?: boolean;
}

export default function ItemWeightedLB({ item, open, onClose, isEmbedded = false }: ItemWeightedLBProps) {
  const [verifiedItems, setVerifiedItems] = useState<VerifiedItem[]>([]);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [idRanges, setIdRanges] = useState<Record<string, IdentificationRange>>({});
  const [selectedItem, setSelectedItem] = useState<CombatItem>();
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [shinyOnly, setShinyOnly] = useState(false);

  // Only fetch if the internalName string actually changes
  const [lastInternalName, setLastInternalName] = useState<string | null>(null);
  useEffect(() => {
    if (!item.internalName || item.internalName === lastInternalName) return;
    setLastInternalName(item.internalName);
    setLoading(true);

    fetch(api(`/item/${item.internalName}/weight`))
      .then((res) => res.json())
      .then(setWeights)
      .catch(console.error);

    fetch(api(`/item/database/${item.internalName}`))
      .then((res) => res.json())
      .then((data) => {
        setVerifiedItems(data.filter((e: VerifiedItem) => e.itemName === item.internalName));
      })
      .catch(console.error);

    fetch(api(`/item/${item.internalName}`))
      .then((res) => res.json())
      .then((full) => {
        setSelectedItem(full);
        setIdRanges(full.identifications || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [item.internalName]);

  function calculateScore(entry: VerifiedItem, weight?: Weight): number {
    // If no weight passed, compute average of all IDs
    const keys = Object.keys(entry.identifications).filter(k => !!idRanges[k]);
    if (!weight) {
      const sum = keys.reduce((acc, key) => {
        const { formattedPercentage } = calculateIdentificationRoll(key, idRanges[key], entry.identifications[key]);
        return acc + formattedPercentage;
      }, 0);
      return Math.trunc(sum / keys.length * 100) / 10000
    }
    // const total = ids.reduce((sum, id) => sum + id.percentage, 0);
    // return total / ids.length;
    // weighted
    return keys.reduce((acc, key) => {
      const inputVal = entry.identifications[key];
      const { formattedPercentage } = calculateIdentificationRoll(key, idRanges[key], inputVal);
      if (weight.identifications[key] < 0) {
        // If the weight is negative, we need to invert the percentage
        const invertedPercentage = 100 - formattedPercentage;
        return acc + Math.abs((invertedPercentage / 100) * (weight.identifications[key] || 0));
      } else {
        return acc + (formattedPercentage / 100) * (weight.identifications[key] || 0);
      }
    }, 0);
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-xl">
          <DialogTitle><p className="text-center">Loading data...</p></DialogTitle>
        </DialogContent>
      </Dialog>
    );
  }

  // Build tabs array: first "Overall", then each weight
  const tabs = [
    { weight_id: "overall", weight_name: "Overall" },
    ...weights.map(w => ({ weight_id: w.weight_id, weight_name: w.weight_name })),
  ];

  const LeaderboardContent = () => (
    <>
      {tabs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No weight data available.</p>
      ) : (
        <Tabs defaultValue={tabs[0].weight_id} className="w-full">
          <div className="flex flex-col items-center space-y-1">
            <TabsList className="flex flex-wrap">
              {tabs.map(tab => {
                const weightObj = weights.find(w => w.weight_id === tab.weight_id);
                return (
                  <TabsTrigger key={tab.weight_id} value={tab.weight_id}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span>{tab.weight_name}</span>
                      </PopoverTrigger>
                      {tab.weight_id !== "overall" && weightObj && ( // Added weightObj check
                        <PopoverContent className="w-80">
                          <h4 className="font-medium mb-1">Weight Info</h4>
                          <ul className="text-xs space-y-1">
                            {Object.entries(weightObj.identifications).map(([key, factor]) => (
                              <li key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                                <span>{(factor * 100).toFixed(1)}%</span>
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      )}
                    </Popover>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="p-2 text-sm rounded-lg bg-muted hover:bg-muted/60 transition-colors duration-150"
              >
                {sortOrder === "desc" ? <ArrowDownWideNarrow className="w-5 h-5" /> : <ArrowUpNarrowWide className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShinyOnly(!shinyOnly)}
                className={`p-2 text-sm font-sans rounded-lg transition-colors duration-150 ${shinyOnly ? "bg-yellow-300 text-black" : "bg-muted hover:bg-muted/60"}`}
              >
                Shiny Only
              </button>
            </div>
          </div>

          {tabs.map(tab => {
            const weightObj = weights.find(w => w.weight_id === tab.weight_id);
            const ranked = verifiedItems
              .filter(v => !shinyOnly || v.shinyStat)
              .map(v => ({ ...v, score: calculateScore(v, weightObj) }))
              .sort((a, b) => sortOrder === "desc" ? b.score - a.score : a.score - b.score)
              .slice(0, 10);

            return (
              <TabsContent key={tab.weight_id} value={tab.weight_id}>
                <div className="space-y-3">
                  {ranked.map((entry, i) => {
                    if (!selectedItem) return null;
                    const demoData = { input: entry, original: selectedItem };
                    return (
                      <Popover key={entry.originalString}>
                        <PopoverTrigger asChild>
                          <div className="border rounded p-2 text-sm flex justify-between items-center cursor-pointer">
                            <div className="flex space-x-2 items-center text-md">
                              <img
                                src={`https://www.mc-heads.net/avatar/${entry.owner}`}
                                alt={entry.owner}
                                className="w-6 h-6"
                              />
                              <span><strong>#{i + 1}</strong> {entry.owner}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {entry.shinyStat && <span className="text-yellow-300 mr-2">✦</span>}
                              {entry.ironman && <img src={`/ironman.svg`} alt='ironman icon' className={'h-4'} />}
                              <span className="font-mono">{(entry.score * 100).toFixed(2)}%</span>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit">
                          <RolledItemDisplay data={demoData} withCard={false} />
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                  {ranked.length === 0 && <p className="text-muted-foreground text-sm text-center">No items match the current criteria.</p>}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );

  if (isEmbedded) {
    // Render directly for embedding, potentially without Dialog chrome
    // Using Card for consistent styling with other embedded elements if desired
    return (
      // <Card>
      //   <CardHeader>
      //     <CardTitle>Ranking for {item.internalName}</CardTitle>
      //   </CardHeader>
      //   <CardContent>
      //     <LeaderboardContent />
      //   </CardContent>
      // </Card>
      // For now, let's render without Card wrapper to give more flexibility to parent
      // Parent component (analyze page) already wraps it in a Card.
       <LeaderboardContent />
    );
  }

  // Original Dialog implementation
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Ranking for {item.internalName}</DialogTitle>
        </DialogHeader>
        <LeaderboardContent />
      </DialogContent>
    </Dialog>
  );
}
