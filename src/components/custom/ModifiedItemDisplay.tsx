"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getIdentificationInfo, type Item } from "@/types/itemType"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClassInfo } from "@/types/classType"
import { ItemIcon } from "./WynnIcon"
import { cn } from "@/lib/utils"
import { diffChars, diffWords } from "diff";
import { TrendingDown, TrendingUp } from "lucide-react"
import { mapEasingToNativeEasing } from "framer-motion"

interface ModifiedItemDisplayProps {
  modifiedItem: {
    _id: string
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

        {after.type === "weapon" && after.attackSpeed && (
          <CardDescription>
            <div className="flex justify-center items-center text-xs">
              {`${after.attackSpeed
                .replace("_", " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")} Attack Speed`}
            </div>
          </CardDescription>
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

            {/* TODO attack speed, requirement */}
            {/* Base Stats Changes */}
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
                </ul>
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
            {before.icon && after.icon && JSON.stringify(before.icon) !== JSON.stringify(after.icon) && (
              <div className="space-y-2">
                <h4 className="font-medium">Icon</h4>
                <div className="text-sm">
                  <span>Icon changed: </span>
                  <span className="text-red-500 line-through">
                    {before.icon.format === "attribute" &&
                      typeof before.icon.value === "object" &&
                      before.icon.value.customModelData}
                  </span>
                  <span className="text-green-500 ml-1">
                    {after.icon.format === "attribute" &&
                      typeof after.icon.value === "object" &&
                      after.icon.value.customModelData}
                  </span>
                </div>
              </div>
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
            <DisplayItemState item={before} />
          </TabsContent>

          <TabsContent value="after" className="space-y-4 pt-4">
            <DisplayItemState item={after} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Component to display a single item state (before or after)
const DisplayItemState: React.FC<{ item: Item }> = ({ item }) => {
  const isCombatItem =
    item.type === "weapon" ||
    item.type === "armour" ||
    item.type === "accessory" ||
    item.type === "tome" ||
    item.type === "charm"

  return (
    <div className="space-y-4">
      {item.base && (
        <ul className="list-disc list-inside text-sm">
          {Object.entries(item.base).map(([name, value]) => (
            <BaseStatsFormatter value={value} name={name} key={name} />
          ))}
        </ul>
      )}

      {isCombatItem && item.requirements && (
        <ul className="list-disc list-inside text-sm">
          {Object.entries(item.requirements).map(([key, value]) => {
            let displayValue
            if (typeof value === "string" || typeof value === "number") {
              displayValue = value
            } else if (Array.isArray(value)) {
              displayValue = value.join(", ")
            } else if (typeof value === "object" && value !== null) {
              displayValue = `${value.min} - ${value.max}`
            } else {
              displayValue = "Unknown value"
            }

            return (
              <div key={key}>
                {getIdentificationInfo(key) ? (
                  key === "classRequirement" ? (
                    <>
                      {getIdentificationInfo(key)?.displayName}: {getClassInfo(value as string)!.displayName}
                    </>
                  ) : (
                    <>
                      {getIdentificationInfo(key)?.displayName}: {displayValue}
                    </>
                  )
                ) : (
                  <>
                    {key}: {displayValue}
                  </>
                )}
              </div>
            )
          })}
        </ul>
      )}

      {item.identifications && (
        <ul className="list-disc list-inside">
          {Object.entries(item.identifications).map(([key, value]) => {
            const getColorClass = (val: number) => {
              const isCost = key.toLowerCase().includes("cost")
              if (isCost) {
                return val < 0 ? "text-green-500" : "text-red-500" // Cost keys are inverted
              }
              return val > 0 ? "text-green-500" : "text-red-500" // Regular keys
            }

            const displayName = getIdentificationInfo(key)?.displayName ?? key
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                {typeof value === "number" ? (
                  <>
                    <span style={{ flex: "1", textAlign: "left" }}></span>
                    <span className={cn("flex-grow text-center", displayName.length >= 13 && "text-xs")}>
                      {displayName}
                    </span>
                    <span className={`${getColorClass(value)}`} style={{ flex: "1", textAlign: "right" }}>
                      {value}
                      {getIdentificationInfo(key)?.unit}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={getColorClass(value.min)} style={{ flex: "1", textAlign: "left" }}>
                      {value.min}
                      {getIdentificationInfo(key)?.unit}
                    </span>
                    <span className={cn("flex-grow text-center", displayName.length >= 13 && "text-xs")}>
                      {displayName}
                    </span>
                    <span className={getColorClass(value.max)} style={{ flex: "1", textAlign: "right" }}>
                      {value.max}
                      {getIdentificationInfo(key)?.unit}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </ul>
      )}

      {item.powderSlots && (
        <p className="text-sm">
          Powder Slots&ensp;
          <span className="text-primary/50">
            [<span className="font-five">{Array.from({ length: item.powderSlots }, () => "O").join("")}</span>]
          </span>
        </p>
      )}
      {item.majorIds && (
        <ul className="list-disc list-inside">
          {Object.entries(item.majorIds).map(([key, value]) => (
            <div className="text-sm" key={key} dangerouslySetInnerHTML={{ __html: value }} />
          ))}
        </ul>
      )}
      {item.lore && (
        <>
          <Separator />
          <p className="text-sm italic text-muted-foreground">{item.lore}</p>
        </>
      )}
    </div>
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

const BaseStatsFormatter: React.FC<any> = ({ name, value }) => {
  console.log(name)
  const matchedKey = Object.keys(colorMap).find((key) => name.includes(key))
  const color = matchedKey ? colorMap[matchedKey] : ""
  const text = matchedKey ? <span className={color}>{textMap[matchedKey]}&ensp;</span> : null

  const type = name.includes("Damage") ? "Damage" : name.includes("Defence") ? "Defence" : ""

  return (
    <div className="flex items-center h-5">
      <div>
        <span className={cn("font-common text-lg h-4 -mt-3", color)}>{getIdentificationInfo(name)?.symbol}</span>
        <span className={getIdentificationInfo(name)?.symbol && "ml-2"}>
          {text}
          {type}
        </span>
      </div>
      {typeof value === "number" ? (
        <span className="ml-1 h-4">{getFormattedText(value)}</span>
      ) : (
        <span className="ml-1 h-4">
          {value.min}-{value.max}
        </span>
      )}
    </div>
  )
}


export default ModifiedItemDisplay

