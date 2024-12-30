'use client'

import { notFound, useParams, usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Item } from '@/types/itemType';
import { ItemDisplay } from '@/components/custom/item-display';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ItemPage() {
    const { itemName } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [itemData, setItemData] = useState<Item | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = async () => {
        try {
            navigator.clipboard.writeText(`https://wynnpool.com/item/${itemData?.internalName}`)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1000); 
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    useEffect(() => {
        async function fetchItemData() {
            try {
                const res = await fetch(`/api/item/${itemName}`)
                if (!res.ok) {
                    throw new Error('Failed to fetch item data')
                }

                const data = await res.json()
                setItemData(data)
                console.log(data)
            } catch (err) {
                console.error('An error occurred while fetching the item data.', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchItemData()
    }, [itemName])

    if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
    if (!itemData) return <div className="items-center justify-center h-screen flex"><span className='font-mono text-2xl'>Item Not Found.</span></div>
    const isCombatItem = itemData.type == 'weapon' || itemData.type === 'armour' || itemData.type === 'accessory'

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <div className='flex justify-between gap-4 mb-4 flex-col sm:flex-row'>
                <div className='md:w-2/5 lg:w-1/3'>
                    <ItemDisplay item={itemData} />
                </div>
                <div className='flex flex-col md:w-3/5 lg:w-2/3 gap-4'>
                    <Card className="flex items-center justify-between px-4 py-2 bg-green-500 rounded-lg">
                        <span className="text-white font-semibold">Share this item!</span>
                        <div className="flex items-center gap-2 bg-green-400 px-3 py-1.5 rounded-full">
                            <span className="text-white text-sm font-mono mx-2">wynnpool.com/{itemData.internalName}</span>
                            {/* <button
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                            > */}
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-100"
                                            onClick={handleCopy}
                                            aria-label={copied ? "Copied" : "Copy to clipboard"}
                                            disabled={copied}
                                        >
                                            <div
                                                className={cn(
                                                    "transition-all",
                                                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                                                )}
                                            >
                                                <Check className="stroke-emerald-200" size={16} strokeWidth={2} aria-hidden="true" />
                                            </div>
                                            <div
                                                className={cn(
                                                    "absolute transition-all",
                                                    copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                                                )}
                                            >
                                                <Copy size={16} strokeWidth={2} aria-hidden="true" />
                                            </div>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="px-2 py-1 text-xs">Click to copy</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {/* </button> */}
                        </div>
                    </Card>
                    <Card>
                        <CardHeader>
                            <h2 className='text-2xl font-bold'>How to obtain this item?</h2>
                        </CardHeader>
                        <CardContent className='flex flex-col gap-4'>
                            {itemData.dropRestriction == 'lootchest' && (
                                <div className='flex gap-4'>
                                    <img className='w-10 h-10' src='/icons/dropType/lootchest.png' />
                                    <div className='flex flex-col'>
                                        <span className='font-bold text-lg'>Loot Chest</span>
                                        <span className='italic text-sm'>This item can be found in loot chests tier III or IV within level range of {itemData.requirements?.level && itemData.requirements?.level - 4}-{itemData.requirements?.level && itemData.requirements?.level + 4}.</span>
                                    </div>
                                </div>
                            )}
                            {itemData.dropRestriction == 'normal' && (
                                <>
                                    <div className='flex gap-4'>
                                        <img className='w-10 h-10' src='/icons/dropType/mobs.png' />
                                        <div className='flex flex-col'>
                                            <span className='font-bold text-lg'>Mobs</span>
                                            <span className='italic text-sm'>This item can be dropped from mobs within level range of {itemData.requirements?.level && itemData.requirements?.level - 4}-{itemData.requirements?.level && itemData.requirements?.level + 4}.</span>
                                        </div>
                                    </div>
                                    <div className='flex gap-4'>
                                        <img className='w-10 h-10' src='/icons/dropType/anylootchest.png' />
                                        <div className='flex flex-col'>
                                            <span className='font-bold text-lg'>Loot Chest</span>
                                            <span className='italic text-sm'>This item can be found in any loot chests within level range of {itemData.requirements?.level && itemData.requirements?.level - 4}-{itemData.requirements?.level && itemData.requirements?.level + 4}.</span>
                                        </div>
                                    </div>
                                </>
                            )}
                            {itemData.droppedBy && (
                                <div className='flex gap-4'>
                                    <img className='w-10 h-10' src='/icons/dropType/specialdrop.png' />
                                    <div className='flex flex-col'>
                                        <span className='font-bold text-lg'>Special Drop</span>
                                        <span className='italic text-sm mb-4'>This item can be dropped only by specific mobs or in a specific area.</span>
                                        {itemData.droppedBy.map((drop, index) => (
                                            <Card key={index} className='mt-2 flex flex-col px-4 py-2'>
                                                <span className='font-mono text-md'>
                                                    <span className='font-bold'>Name:&ensp;</span>{drop.name}
                                                </span>
                                                {drop.coords ? (
                                                    <span className='font-mono text-md'>
                                                        <span className='font-bold'>Coordinates:&ensp;</span>{drop.coords.join(' ')}
                                                    </span>
                                                ) : (
                                                    <span className='font-mono text-md'>
                                                        <span className='font-bold'>Coordinates:&ensp;</span>unknown
                                                    </span>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {itemData.dropRestriction == 'never' && (
                                itemData.dropMeta ? (
                                    <>
                                        {itemData.dropMeta.type.includes('quest') && itemData.dropMeta.name === 'The Qira Hive' && (
                                            <div className='flex gap-4'>
                                                <img className='w-10 h-10' src='/icons/dropType/hive.png' />
                                                <div className='flex flex-col'>
                                                    <span className='font-bold text-lg'>Hive</span>
                                                    <span className='italic text-sm'>This item can be bought at Hive Shop.</span>
                                                </div>
                                            </div>
                                        )}
                                        {itemData.dropMeta.type.includes('dungeonMerchant') && (
                                            <div className='flex gap-4'>
                                                <img className='w-10 h-10' src='/icons/dropType/dungeonmerchant.png' />
                                                <div className='flex flex-col'>
                                                    <span className='font-bold text-lg'>Dungeon Merchant</span>
                                                    <span className='italic text-sm'>This item can be bought from a dungeon merchant.</span>
                                                    <span className='font-mono text-md mt-4'><span className='font-bold'>Dungeon Name:&ensp;</span>{itemData.dropMeta.name}</span>
                                                    {itemData.dropMeta.coordinates && (
                                                        <span className='font-mono text-md'><span className='font-bold'>Coordinates:&ensp;</span>{itemData.dropMeta.coordinates.join(' ')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {itemData.dropMeta.type.includes('merchant') && (
                                            <div className='flex gap-4'>
                                                <img className='w-10 h-10' src='/icons/dropType/merchant.png' />
                                                <div className='flex flex-col'>
                                                    <span className='font-bold text-lg'>Merchant</span>
                                                    <span className='italic text-sm'>This item can be bought from a merchant.</span>
                                                    <span className='font-mono text-md mt-4'><span className='font-bold'>Name:&ensp;</span>{itemData.dropMeta.name}</span>
                                                    {itemData.dropMeta.coordinates && (
                                                        <span className='font-mono text-md'><span className='font-bold'>Coordinates:&ensp;</span>{itemData.dropMeta.coordinates.join(' ')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {itemData.dropMeta.type.includes('altar') && (
                                            <div className='flex gap-4'>
                                                <img className='w-10 h-10' src='/icons/dropType/bossaltar.png' />
                                                <div className='flex flex-col'>
                                                    <span className='font-bold text-lg'>Boss altar</span>
                                                    <span className='italic text-sm'>This item can be obtained through a Boss Altar.</span>
                                                    <span className='font-mono text-md mt-4'><span className='font-bold'>Name:&ensp;</span>{itemData.dropMeta.name}</span>
                                                    {itemData.dropMeta.coordinates && (
                                                        <span className='font-mono text-md'><span className='font-bold'>Coordinates:&ensp;</span>{itemData.dropMeta.coordinates.join(' ')}</span>
                                                    )}
                                                    {itemData.dropMeta.event && (
                                                        <span className='font-mono text-md'><span className='font-bold'>Event:&ensp;</span>{itemData.dropMeta.event}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {itemData.dropMeta.type.includes('event') && (
                                            <div className='flex gap-4'>
                                                <div className='flex flex-col'>
                                                    <span className='font-bold text-lg'>Event</span>
                                                    <span className='italic text-sm'>This item can be obtained from a event.</span>
                                                    <span className='font-mono text-md mt-4'><span className='font-bold'>Name:&ensp;</span>{itemData.dropMeta.event}</span>
                                                </div>
                                            </div>
                                        )}
                                        {itemData.dropMeta.type.includes('raid') && (
                                            <div className='flex gap-4'>
                                                <img className='w-10 h-10' src='/icons/dropType/raid.png' />
                                                <div className='flex flex-col'>
                                                    <span className='font-bold text-lg'>Raid</span>
                                                    <span className='italic text-sm'>This item can be obtained through a Raid.</span>
                                                    <span className='font-mono text-md mt-4'><span className='font-bold'>Raid:&ensp;</span>{itemData.dropMeta.name}</span>
                                                    <span className='font-mono text-md'><span className='font-bold'>Location:&ensp;</span>{itemData.dropMeta.coordinates.join(' ')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : isCombatItem && itemData.requirements?.quest || itemData.restrictions == 'quest item' ? (
                                    isCombatItem && itemData.requirements?.quest && (
                                        <div className='flex gap-4'>
                                            <img className='w-10 h-10' src='/icons/dropType/quest.png' />
                                            <div className='flex flex-col'>
                                                <span className='font-bold text-lg'>Quest</span>
                                                <span className='italic text-sm'>This item can be obtained through a quest or by completing one.</span>
                                                <span className='font-mono text-md mt-4'>
                                                    <span className='font-bold'>Quest Name:&ensp;</span>{itemData.requirements?.quest}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div>Prob from merchant, Please report this item in Discord if its not from merchant, thanks :3</div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
