'use client'

import { Card, CardTitle } from "@/components/ui/card";
import { getRollPercentageColor, getRollPercentageString, processIdentification } from '@/lib/itemUtils';
import { CombatItem, Item, type ItemIconObject, Powder } from "@/types/itemType";
import React from 'react';
import { ItemContent } from "./ItemDisplay";
import { ItemIcon } from "@/components/custom/WynnIcon";
import { Badge } from "@/components/ui/badge";
import '@/assets/css/wynncraft.css'
import { RolledIdentifications } from "./Identifications";
import PowderSlots from "./PowderSlots";

interface ItemDisplayProps {
    data: ItemAnalyzeData;
}

interface ShinyStatType {
    key: string;
    displayName: string;
    value: number;
}

interface Input {
    itemName: string;
    identifications: {
        [key: string]: number;
    };
    powderSlots: number;
    powders: Powder[];
    shinyStat?: ShinyStatType;
}

interface Weight {
    item_name: string;
    item_id: string;
    weight_name: string;
    weight_id: string;
    type: string;
    author: string;
    timestamp: number;
    identifications: {
        [key: string]: number;
    };
    userId: string;
    description: string;
}

export interface ItemAnalyzeData {
    original: CombatItem;
    input: Input;
    weights: Weight[];
}

export interface IdentificationStat {
    name: string;
    value: number;
    percentage: number;
    displayValue: number;
}

const RolledItemDisplay: React.FC<ItemDisplayProps> = ({ data }) => {
    const { original, input, weights } = data;
    const processedIdentifications = processIdentification(data)

    // Determine if the item has a "shiny" stat
    const shinyStat = input.shinyStat ? {
        displayName: input.shinyStat.displayName,
        value: input.shinyStat.value,
    } : undefined;

    function calculateOverallPercentage(ids: IdentificationStat[]): number {
        if (ids.length === 0) return 0;
        const total = ids.reduce((sum, id) => sum + id.percentage, 0);
        return total / ids.length;
    }

    return (
        <Card className="w-full max-w-sm h-fit font-ascii p-6 text-[#AAAAAA] space-y-6">
            <ItemHeader
                item={original}
                shinyStat={shinyStat}
                overall={calculateOverallPercentage(processedIdentifications)}
            />
            <span className="text-red-500 text-orange-500 text-amber-400 text-yellow-300 text-green-500 text-cyan-500"/>
            {/* <ItemContent item={item} /> */}
            <div className="flex justify-center">
                <div className="flex flex-col items-start text-center space-y-4">
                    <RolledIdentifications stats={processedIdentifications} />
                    {input.powderSlots && (
                        <PowderSlots
                            powderSlots={input.powderSlots}
                            powders={input.powders || []}
                        />
                    )}
                </div>
            </div>
        </Card>
    )
}

interface ItemHeaderProps {
    item: CombatItem
    shinyStat?: {
        displayName: string;
        value: number;
    };
    overall?: number;
    icon?: ItemIconObject;
}

const ItemHeader: React.FC<ItemHeaderProps> = ({ item, shinyStat, overall, icon }) => {
    const itemNameLength = item.internalName.length - 8
    var itemNameSize = 'text-lg'

    if (itemNameLength >= 13) itemNameSize = 'text-md'
    if (itemNameLength >= 16) itemNameSize = 'text-sm'
    if (itemNameLength >= 19) itemNameSize = 'text-xs flex-col'


    return (
        <div className="flex flex-col space-y-1.5">
            <div className="flex justify-center items-center">
                <ItemIcon item={item} size={64} className="w-16 h-16" />
            </div>

            <div className="flex justify-center items-center">
                <CardTitle className={`flex justify-center items-center font-thin ${itemNameSize} text-${item.rarity}`}>
                    {shinyStat && (
                        <span className="text-yellow-300 mr-2">✦</span>
                    )}
                    {item.internalName}
                    {overall && (
                        <h2 className={`ml-2 tracking-wide ${getRollPercentageColor(overall)}`}>
                            [{getRollPercentageString(overall)}]
                        </h2>
                    )}
                </CardTitle>
            </div>
            {shinyStat && (
                <div className="flex justify-center items-center">
                    <div className="text-yellow-300 text-sm mt-1">
                        ✦ {shinyStat.displayName}: {shinyStat.value.toLocaleString()}
                    </div>
                </div>
            )}
            <div className="flex justify-center items-center">
                <Badge className={`bg-${item.rarity}`}>
                    <p className={`text-${item.rarity} brightness-[.3] font-thin`}>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} Item</p>
                </Badge>
            </div>
        </div>

    );
};

export { RolledItemDisplay };
