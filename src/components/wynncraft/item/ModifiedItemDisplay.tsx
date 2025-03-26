"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formattedAttackSpeed, getIdentificationInfo, type Item } from "@/types/itemType"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClassInfo } from "@/types/classType"
import { ItemIcon } from "../../custom/WynnIcon"
import { cn } from "@/lib/utils"
import { diffChars, diffWords } from "diff";
import { MoveRight, TrendingDown, TrendingUp } from "lucide-react"
import { mapEasingToNativeEasing } from "framer-motion"
import { ItemContent, ItemHeader } from "./ItemDisplay"

interface ModifiedItemDisplayProps {
  modifiedItem: {
    itemName: string
    status: string
    timestamp: number
    before: Item
    after: Item
  }
}

const getColorClass = (val: number, key: string) => {
  const isCost = key.toLowerCase().includes('cost');
  if (isCost) {
    return val < 0 ? 'text-green-500' : 'text-red-500'; // Cost keys are inverted
  }
  return val > 0 ? 'text-green-500' : 'text-red-500'; // Regular keys
};

function getFormattedText(number: number) {
  if (number > 0) return "+" + number
  if (number < 0) return number
}

const getTrendIcon = (diff: number, key: string) => {
  const isCost = key.toLowerCase().includes('cost');
  if (isCost) {
    return diff < 0 ? <TrendingUp className="inline text-green-600 w-4 h-4" /> : <TrendingDown className="inline text-red-600 w-4 h-4" />; // Cost keys are inverted
  }
  return diff > 0 ? <TrendingUp className="inline text-green-600 w-4 h-4" /> : <TrendingDown className="inline text-red-600 w-4 h-4" />; // Regular keys
};

const ModifiedItemDisplay: React.FC<ModifiedItemDisplayProps> = ({ modifiedItem }) => {
  const { before, after } = modifiedItem
  const isCombatItem =
    before.type && after.type === "weapon" ||
    before.type && after.type === "armour" ||
    before.type && after.type === "accessory" ||
    before.type && after.type === "tome" ||
    before.type && after.type === "charm"
  const itemNameLength = isCombatItem ? before.internalName.length - 8 : before.internalName.length
  let itemNameSize = "text-lg"

  if (itemNameLength >= 13) itemNameSize = "text-md"
  if (itemNameLength >= 16) itemNameSize = "text-sm"
  if (itemNameLength >= 19) itemNameSize = "text-xs flex-col"

  // Function to compare values and highlight differences
  const compareValues = (beforeVal: any, afterVal: any) => {
    if (JSON.stringify(beforeVal) === JSON.stringify(afterVal)) {
      return { changed: false, value: beforeVal }
    }
    return { changed: true, before: beforeVal, after: afterVal }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-fit font-ascii text-[#AAAAAA]">
      <CardHeader>
        <div className="flex justify-center items-center">
          <div className="relative">
            <ItemIcon item={after} size={64} className="w-16 h-16" />
            {/* <Badge className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs px-1.5 py-0.5">Modified</Badge> */}
          </div>
        </div>

        <div className="flex justify-center items-center">
          <CardTitle
            className={`flex justify-center items-center font-thin 
                ${itemNameSize} 
                ${isCombatItem && `text-${after.rarity}`}
                ${after.type === "ingredient" && "text-[#AAAAAA]"}
              `}
          >
            {after.internalName}
          </CardTitle>
        </div>

        {isCombatItem && (
          <div className="flex justify-center items-center">
            <Badge className={`bg-${after.rarity}`}>
              <p className={`text-${after.rarity} brightness-[.3] font-thin`}>
                {after.rarity.charAt(0).toUpperCase() + after.rarity.slice(1)} Item
              </p>
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="changes">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="changes">Changes</TabsTrigger>
            <TabsTrigger value="before">Before</TabsTrigger>
            <TabsTrigger value="after">After</TabsTrigger>
          </TabsList>

          <TabsContent value="changes" className="space-y-4 pt-4">
            <h3 className="font-semibold text-center">Item Modifications</h3>

            {/* TODO requirement, dropdata, base stats for armor and accessory */}
            {/* Base Stats Changes */}

            {after.type === "weapon" && before.type === "weapon" && after.attackSpeed !== before.attackSpeed && (
              <div className="space-y-2">
                <h4 className="font-medium">Attack Speed</h4>
                <div className="flex justify-center items-center text-xs gap-3">
                  <span className="opacity-50">{formattedAttackSpeed(before.attackSpeed)}</span>
                  <MoveRight />
                  {formattedAttackSpeed(after.attackSpeed)}
                </div>
              </div>
            )}


            {before.base && after.base && JSON.stringify(before.base) !== JSON.stringify(after.base) && (
              <div className="space-y-2">
                <h4 className="font-medium">Base Stats</h4>

                <ul className="list-disc list-inside text-sm">
                  {Object.keys({ ...before.base, ...after.base })
                    .map((key) => {
                      const beforeValue = before.base?.[key]
                      const afterValue = after.base?.[key]
                      const name = getIdentificationInfo(key)?.displayName ?? key

                      const matchedKey = Object.keys(colorMap).find((colorkey) => key.includes(colorkey))
                      const color = matchedKey ? colorMap[matchedKey] : ""
                      const text = matchedKey ? <span className={color}>{textMap[matchedKey]}&ensp;</span> : null
                      const type = name.includes("Damage") ? "Damage" : name.includes("Defence") ? "Defence" : ""

                      if (!beforeValue && afterValue) {
                        // Added stat
                        return (
                          <div key={key} className="bg-green-500/30 px-1 rounded">
                            <span className={cn("font-common text-lg h-4 -mt-3", color)}>{getIdentificationInfo(key)?.symbol}</span>
                            <span className={getIdentificationInfo(key)?.symbol && "ml-2"}>
                              {text}
                              {type}
                            </span>
                            <span className="ml-1 h-4">
                              {afterValue.min}-{afterValue.max}
                            </span>
                          </div>
                        )
                      } else if (!afterValue && beforeValue) {
                        // Removed stat
                        return (
                          <div key={key} className="bg-red-500/30 px-1 rounded">
                            <span className={cn("font-common text-lg h-4 -mt-3", color)}>{getIdentificationInfo(key)?.symbol}</span>
                            <span className={getIdentificationInfo(key)?.symbol && "ml-2"}>
                              {text}
                              {type}
                            </span>
                            <span className="ml-1 h-4">
                              {beforeValue.min}-{beforeValue.max}
                            </span>
                          </div>
                        )
                      } else if (beforeValue && afterValue && (
                        beforeValue.min !== afterValue.min ||
                        beforeValue.max !== afterValue.max ||
                        beforeValue.raw !== afterValue.raw)
                      ) {
                        // Changed stat
                        return (
                          <div key={key}>
                            <span className={cn("font-common text-lg h-4 -mt-3", color)}>{getIdentificationInfo(key)?.symbol}</span>
                            <span className={getIdentificationInfo(key)?.symbol && "ml-2"}>
                              {text}
                              {type}
                            </span>
                            <span className="ml-1 h-4 opacity-50">
                              {beforeValue.min}-{beforeValue.max}
                            </span>
                            {getTrendIcon(afterValue.raw - beforeValue.raw, key)}
                            <span className="ml-1 h-4">
                              {afterValue.min}-{afterValue.max}
                            </span>
                          </div>
                        )
                      }
                      return null
                    })
                    .filter(Boolean)}
                  {after.type === "weapon" && before.type === "weapon" && after.attackSpeed !== before.attackSpeed && (
                    <div className="flex ml-6 mt-2 h-4 items-center text-sm">
                      <span className="text-primary/80">Average DPS</span>
                      <span className="opacity-50 ml-1">{before.averageDps}</span>
                      {getTrendIcon(after.averageDps - before.averageDps, '')}
                      <span className="ml-1">{after.averageDps}</span>
                    </div>
                  )}
                  {/* <div className="flex ml-5 gap-1 mt-3 h-4 items-center text-sm">
                    <span className="text-primary/80">Average</span> Damage {item.averageDps}
                  </div> */}
                </ul>
              </div>
            )}

            {/* // bg-green-500/30 px-1 rounded */}
            {before.requirements && after.requirements && JSON.stringify(before.requirements) !== JSON.stringify(after.requirements) && (
              <div className="space-y-2">
                <h4 className="font-medium">Requirements</h4>
                <div className="list-disc list-inside text-sm space-y-1">
                  {(
                    Object.keys({ ...before.requirements, ...after.requirements }) as (keyof Item["requirements"])[]
                  )
                    .filter((key) => JSON.stringify(before.requirements?.[key]) !== JSON.stringify(after.requirements?.[key])) // ✅ Only show modified requirements
                    .map((key) => {
                      const beforeValue = before.requirements?.[key];
                      const afterValue = after.requirements?.[key];

                      // Convert different types of values to readable format
                      const formatValue = (value: unknown) => {
                        if (typeof value === "string") return getClassInfo(value)?.displayName ?? value;
                        if (typeof value === "number") return value;
                        if (Array.isArray(value)) return value.join(", ");
                        if (typeof value === "object" && value !== null) {
                          const range = value as { min: number; max: number };
                          return `${range.min} - ${range.max}`;
                        }
                        return "Unknown";
                      };

                      return (
                        <>
                          {beforeValue && !afterValue && (
                            <div key={`${key}-before`} className="bg-red-500/30 px-1 rounded  text-red-500">
                              {getIdentificationInfo(key)?.displayName || key}: {formatValue(beforeValue)}
                            </div>
                          )}
                          {afterValue && !beforeValue && (
                            <div key={`${key}-after`} className="bg-green-500/30 px-1 rounded text-green-500">
                              {getIdentificationInfo(key)?.displayName || key}: {formatValue(afterValue)}
                            </div>
                          )}
                          {beforeValue && afterValue && (
                            <div key={key} className="">
                              {getIdentificationInfo(key)?.displayName || key}:{" "}
                              {formatValue(beforeValue)}
                              {beforeValue && afterValue && " → "}
                              {formatValue(afterValue)}
                            </div>
                          )}
                        </>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Identifications Changes */}
            {(before.identifications || after.identifications) && JSON.stringify(before.identifications) !== JSON.stringify(after.identifications) && (
              <div className="space-y-2">
                <h4 className="font-medium">Identifications</h4>
                <ul className="list-disc list-inside">
                  {Object.keys({ ...before.identifications, ...after.identifications })
                    .map((key) => {
                      const beforeValue = before.identifications?.[key]
                      const afterValue = after.identifications?.[key]
                      const displayName = getIdentificationInfo(key)?.displayName ?? key
                      const unit = getIdentificationInfo(key)?.unit ?? ""

                      if (!beforeValue && afterValue) {
                        // Added identification
                        return (
                          <div key={key} className="flex items-center justify-between text-sm bg-green-500/30 px-1 rounded">
                            {/* <span className="text-green-500">
                              + {displayName}:{" "}
                              {typeof afterValue === "number" ? afterValue : `${afterValue.min}-${afterValue.max}`}
                              {unit}
                            </span> */}
                            {typeof afterValue === 'number' ? (
                              <>
                                <span style={{ flex: '1', textAlign: 'left' }}></span>
                                <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
                                <span className={`${getColorClass(afterValue, key)}`} style={{ flex: '1', textAlign: 'right' }}>{afterValue}{getIdentificationInfo(key)?.unit}</span>
                              </>
                            ) : (
                              <>
                                <span className={getColorClass(afterValue.min, key)} style={{ flex: '1', textAlign: 'left' }}>{afterValue.min}{getIdentificationInfo(key)?.unit}</span>
                                <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
                                <span className={getColorClass(afterValue.max, key)} style={{ flex: '1', textAlign: 'right' }}>{afterValue.max}{unit}</span>
                              </>
                            )}
                          </div>
                        )
                      } else if (!afterValue && beforeValue) {
                        // Removed identification
                        return (
                          <div key={key} className="flex items-center justify-between text-sm bg-red-500/30 px-1 rounded">
                            {/* <span className="text-red-500">
                              - {displayName}:{" "}
                              {typeof beforeValue === "number" ? beforeValue : `${beforeValue.min}-${beforeValue.max}`}
                              {unit}
                            </span> */}
                            {typeof beforeValue === 'number' ? (
                              <>
                                <span style={{ flex: '1', textAlign: 'left' }}></span>
                                <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
                                <span className={`${getColorClass(beforeValue, key)}`} style={{ flex: '1', textAlign: 'right' }}>{beforeValue}{unit}</span>
                              </>
                            ) : (
                              <>
                                <span className={getColorClass(beforeValue.min, key)} style={{ flex: '1', textAlign: 'left' }}>{beforeValue.min}{unit}</span>
                                <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
                                <span className={getColorClass(beforeValue.max, key)} style={{ flex: '1', textAlign: 'right' }}>{beforeValue.max}{unit}</span>
                              </>
                            )}
                          </div>
                        )
                      } else if (afterValue && beforeValue && JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
                        // Changed identification
                        var diff = 0
                        if (typeof afterValue === "number" && typeof beforeValue === "number") {
                          diff = afterValue - beforeValue
                        } else if (typeof afterValue === "object" && typeof beforeValue === "object") {
                          diff = (afterValue.min + afterValue.max) / 2 - (beforeValue.min + beforeValue.max) / 2
                        }

                        return (
                          <div key={key} className="flex items-center justify-between text-sm">
                            {typeof beforeValue === 'number' && typeof afterValue === 'number' && (
                              <>
                                <span style={{ flex: '1', textAlign: 'left' }}></span>
                                <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
                                <div style={{ flex: '1', textAlign: 'right' }}>
                                  <span className={`${cn(getColorClass(beforeValue, key), 'opacity-50')}`}>{beforeValue}{unit}</span>
                                  {getTrendIcon(diff, key)}
                                  <span className={`${getColorClass(afterValue, key)}`}>{afterValue}{unit}</span>
                                </div>
                              </>
                            )}
                            {typeof beforeValue === 'object' && typeof afterValue === 'object' && (
                              <>
                                <div style={{ flex: '1', textAlign: 'left' }}>
                                  <span className={cn(getColorClass(beforeValue.min, key), 'opacity-50')}>{beforeValue.min}{unit}</span>
                                  {getTrendIcon(diff, key)}
                                  <span className={`${getColorClass(afterValue.min, key)}`}>{afterValue.min}{unit}</span>
                                </div>
                                <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
                                <div style={{ flex: '1', textAlign: 'right' }}>
                                  <span className={cn(getColorClass(beforeValue.max, key), 'opacity-50')}>{beforeValue.max}{unit}</span>
                                  {getTrendIcon(diff, key)}
                                  <span className={getColorClass(afterValue.max, key)}>{afterValue.max}{unit}</span>
                                </div>
                              </>
                            )}
                          </div>
                        );

                      }
                      return null
                    })
                    .filter(Boolean)}
                </ul>
              </div>
            )}

            {/* Icon Changes */}
            {before.icon && after.icon && (
              (before.icon.format !== after.icon.format ||
                JSON.stringify(
                  before.icon.format === "attribute" && typeof before.icon.value === "object"
                    ? { id: before.icon.value.id, name: before.icon.value.name }
                    : before.icon.value
                ) !==
                JSON.stringify(
                  after.icon.format === "attribute" && typeof after.icon.value === "object"
                    ? { id: after.icon.value.id, name: after.icon.value.name }
                    : after.icon.value
                )
              ) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Icon</h4>
                  <div className="text-sm flex flex-col">
                    <span>Icon changed: </span>
                    <span className="text-red-500 line-through">
                      {before.icon.format === "attribute" && typeof before.icon.value === "object"
                        ? `${before.icon.value.id}#${before.icon.value.name}`
                        : String(before.icon.value)}
                    </span>
                    <span className="text-green-500">
                      {after.icon.format === "attribute" && typeof after.icon.value === "object"
                        ? `${after.icon.value.id}#${after.icon.value.name}`
                        : String(after.icon.value)}
                    </span>
                  </div>
                </div>
              )
            )}



            {/* Other Changes */}
            {before.powderSlots !== after.powderSlots && (
              <div className="space-y-2">
                <h4 className="font-medium">Powder Slots</h4>
                <div className="text-sm">
                  <span>Powder Slots: </span>
                  <span className="text-red-500 line-through">{before.powderSlots}</span>
                  <span className="text-green-500 ml-1">{after.powderSlots}</span>
                </div>
              </div>
            )}
            {/* Lore  */}
            {before.lore !== after.lore && (
              <div className="space-y-2">
                <h4 className="font-medium">Lore</h4>
                <div className="text-sm">
                  {HighlightLoreChanges(before.lore || '', after.lore || '')}
                </div>
              </div>
            )}

            {JSON.stringify(before.majorIds) !== JSON.stringify(after.majorIds) && (
              <div className="space-y-2">
                <h4 className="font-medium">Major ID</h4>
                <div className="text-sm space-y-2">
                  {/* Get all unique Major IDs from both before & after */}
                  {[...new Set([...Object.keys(before.majorIds || {}), ...Object.keys(after.majorIds || {})])].map((majorId) => (
                    HighlightMajorIdChanges(before.majorIds?.[majorId] || "", after.majorIds?.[majorId] || "")
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="before" className="space-y-4 pt-4">
            <ItemContent item={before} />
          </TabsContent>

          <TabsContent value="after" className="space-y-4 pt-4">
            <ItemContent item={after} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function HighlightLoreChanges(before: string, after: string) {
  const diffResult = diffWords(before, after);

  return (
    <p className="text-sm">
      {diffResult.map((part: any, index: any) => (
        <span
          key={index}
          className={
            part.removed
              ? "text-red-600 line-through bg-red-500/30 px-1 rounded"
              : part.added
                ? "text-green-600 bg-green-500/30 px-1 rounded"
                : ""
          }
        >
          {part.value}
        </span>
      ))}
    </p>
  );
}

function stripHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function HighlightMajorIdChanges(beforeHtml: string, afterHtml: string) {
  const beforeText = stripHtml(beforeHtml);
  const afterText = stripHtml(afterHtml);

  const diffResult = diffWords(beforeText, afterText);

  const highlightedHtml = diffResult
    .map((part) => {
      if (part.removed) {
        return `<span class="text-red-500 line-through bg-red-500/30 px-1 rounded">${part.value}</span>`;
      } else if (part.added) {
        return `<span class="text-green-500 bg-green-500/30 px-1 rounded">${part.value}</span>`;
      }
      return part.value;
    })
    .join("");

  return <div className="text-sm" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
}

const colorMap: Record<string, string> = {
  baseHealth: "text-[#AA0000]",
  baseDamage: "text-[#FFAA00]",
  Earth: "text-[#00AA00]",
  Thunder: "text-[#FFFF55]",
  Water: "text-[#55FFFF]",
  Fire: "text-[#FF5555]",
  Air: "text-[#FFFFFF]",
}

const textMap: Record<string, string> = {
  baseHealth: "Health",
  baseDamage: "Neutral",
  Earth: "Earth",
  Thunder: "Thunder",
  Water: "Water",
  Fire: "Fire",
  Air: "Air",
}

export default ModifiedItemDisplay

