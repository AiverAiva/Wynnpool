'use client'

import { Card, CardTitle } from "@/components/ui/card";
import { getRollPercentageColor, getRollPercentageString, processIdentification } from '@/lib/itemUtils';
import type { CombatItem, ItemIconObject } from "@wynnpool/shared"
import React from 'react';
import { ItemIcon } from "@/components/custom/WynnIcon";
import { Badge } from "@/components/ui/badge";
import '@/assets/css/wynncraft.css'
import { RolledIdentifications } from "./Identifications";
import PowderSlots from "./PowderSlots";
import { Powder } from "@/types/itemType";

interface ItemDisplayProps {
    data: ItemAnalyzeData;
}

interface ShinyStatType {
    key: string;
    displayName: string;
    value: number;
    rerollCount: number;
}

interface Input {
    itemName: string;
    identifications: {
        [key: string]: number;
    };
    powderSlots?: number;
    powders?: Powder[];
    shinyStat?: ShinyStatType;
    rerollCount?: number;
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
    weights?: Weight[];
}

export interface IdentificationStat {
    name: string;
    value: number;
    stars: number;
    percentage: number;
    displayValue: number;
}

export function calculateOverallPercentage(ids: IdentificationStat[]): number {
    if (ids.length === 0) return 0;
    const total = ids.reduce((sum, id) => sum + id.percentage, 0);
    return total / ids.length;
}

interface ItemDisplayPropsWithWrapper extends ItemDisplayProps {
    withCard?: boolean;
}

const RolledItemDisplay: React.FC<ItemDisplayPropsWithWrapper> = ({ data, withCard = true }) => {
    const { original, input, weights } = data;
    const processedIdentifications = processIdentification(data)

    const content = (
        <>
            <ItemHeader
                item={original}
                shinyStat={input.shinyStat}
                overall={calculateOverallPercentage(processedIdentifications)}
            />
            <span className="text-red-500 text-orange-500 text-amber-400 text-yellow-300 text-green-500 text-cyan-500" />
            {/* <ItemContent item={item} /> */}
            <div className="flex justify-center">
                <div className="flex flex-col items-start text-center space-y-4">
                    <RolledIdentifications stats={processedIdentifications} />
                    <div className="flex flex-col items-start justify-start">
                        {input.powderSlots && (
                            <PowderSlots
                                powderSlots={input.powderSlots}
                                powders={input.powders || []}
                            />
                        )}
                        <div className={`flex text-${original.rarity} text-sm font-thin space-x-2`}>
                            <p>{original.rarity!.charAt(0).toUpperCase() + original.rarity!.slice(1)} Item</p>
                            {input.rerollCount && <span>[{input.rerollCount}]</span>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    if (withCard) {
        return (
            <Card className="w-full max-w-sm h-fit font-ascii p-6 text-[#AAAAAA] space-y-6">
                {content}
            </Card>
        );
    }
    return (
        <div className="w-full max-w-sm h-fit font-ascii p-6 text-[#AAAAAA] space-y-6">
            {content}
        </div>
    );
}

interface ItemHeaderProps {
    item: CombatItem
    shinyStat?: ShinyStatType;
    overall?: number;
    icon?: ItemIconObject;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({ item, shinyStat, overall, icon }) => {
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
                    {overall !== undefined && overall !== null && (
                        <h2 className={`ml-2 tracking-wide ${getRollPercentageColor(overall)}`}>
                            [{getRollPercentageString(overall)}]
                        </h2>
                    )}
                </CardTitle>
            </div>
            {shinyStat && (
                <div className="flex justify-center items-center">
                    <div className="text-yellow-300 text-sm mt-1">
                        ✦ {shinyStat.displayName}: {shinyStat.value.toLocaleString()} {shinyStat.rerollCount && <span className="text-gray-400/80">[{shinyStat.rerollCount}]</span>}
                    </div>
                </div>
            )}
            <div className="flex justify-center items-center">
                <Badge className={`bg-${item.rarity}`}>
                    <p className={`text-${item.rarity} brightness-[.3] font-thin`}>{item.rarity!.charAt(0).toUpperCase() + item.rarity!.slice(1)} Item</p>
                </Badge>
            </div>
        </div>

    );
};

export { RolledItemDisplay };
