'use client'

import { notFound, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Item } from '@/types/itemType';
import { ItemDisplay } from '@/components/custom/item-display';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-to-clipboard-button';
import { Copy } from 'lucide-react';

export default function ItemPage() {
    const { itemName } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [itemData, setItemData] = useState<Item | null>(null);


    useEffect(() => {
        async function fetchItemData() {
            try {
                const res = await fetch(`/api/item/${itemName}`)
                if (!res.ok) {
                    throw new Error('Failed to fetch item data')
                }

                const data = await res.json()
                setItemData(data)
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

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <div className='flex justify-between gap-4 mb-4 flex-col sm:flex-row'>
                <div className='md:w-2/5 lg:w-1/3'>
                    <ItemDisplay item={itemData} />
                </div>
                <div className='flex flex-col md:w-3/5 lg:w-2/3 gap-4'>
                    {/* <Card>
                        <div className="flex items-center justify-between p-3 bg-green-500 rounded-lg">
                            <span className="text-white font-semibold">Share this item!</span>
                            <div className="flex items-center gap-2 bg-green-400 px-3 py-1.5 rounded-full">
                                <span className="text-white text-sm">wynnpool.com/{itemData.internalName}</span>
                                <button
                                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                                >
                                    <Copy className='h-4 w-4'/>
                                </button>
                            </div>
                        </div>
                    </Card> */}
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
                            {itemData.dropRestriction == 'never' && (
                                itemData.requirements?.quest || itemData.restrictions == 'quest item' ? (
                                    <div className='flex gap-4'>
                                        <img className='w-10 h-10' src='/icons/dropType/quest.png' />
                                        <div className='flex flex-col'>
                                            <span className='font-bold text-lg'>Quest</span>
                                            <span className='italic text-sm'>This item can be obtained through a quest or by completing one.</span>

                                            {itemData.requirements?.quest && (
                                                <span className='font-mono text-md mt-4'><span className='font-bold'>Quest Name:&ensp;</span>{itemData.requirements?.quest}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : itemData.dropMeta ? (
                                    <div className='flex gap-4'>
                                        <img className='w-10 h-10' src='/icons/dropType/dungeonmerchant.png' />
                                        <div className='flex flex-col'>
                                            <span className='font-bold text-lg'>Dungeon Merchant</span>
                                            <span className='italic text-sm'>This item can be bought from a dungeon merchant.</span>
                                            <span className='font-mono text-md mt-4'><span className='font-bold'>Dungeon Name:&ensp;</span>{itemData.dropMeta.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div>Prob from merchant, Please report this item in Discord thanks :3</div>
                                )
                            )} 
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
