"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import ItemModal from "./item-modal";
import Link from "next/link";
import { ItemIcon } from "@/components/custom/WynnIcon";
import type { Item } from "@wynnpool/shared";
import api from "@/lib/api";

type ItemEntry = [string, any];

export default function MythicItemsPage() {
    const [groupedItems, setGroupedItems] = useState<Record<string, [string, Item][]>>({});
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        fetch(api("/user/me/quick"), { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error('Authentication failed');
                return res.json();
            })
            .then(data => {
                setUser(data);
                setIsAllowed(data.roles?.includes("ITEM_WEIGHT"));
            })
            .catch((err) => {
                console.error('Auth error:', err);
                setIsAllowed(false);
            });
    }, []);

    useEffect(() => {
        const query = {
            $and: [
                { rarity: { $in: ["mythic"] } },
                {
                    $or: [
                        { type: "weapon" },
                        { type: "armour" }
                    ]
                }
            ]
        };

        fetch(api("/item/search"), {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query),
        })
            .then((res) => res.json())
            .then((data) => {
                const categorized: Record<string, ItemEntry[]> = {};
                for (const [key, item] of Object.entries(data) as [string, Item][]) {
                    if (item.type === "weapon") {
                        const weaponCategory = item.weaponType || "other";
                        if (!categorized[weaponCategory]) categorized[weaponCategory] = [];
                        categorized[weaponCategory].push([key, item]);
                    } else if (item.type === "armour") {
                        if (!categorized["armour"]) categorized["armour"] = [];
                        categorized["armour"].push([key, item]);
                    }
                }
                setGroupedItems(categorized);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching items:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="flex min-h-screen w-full items-center justify-center"><p className="font-mono text-2xl">Loading mythic items...</p></div>;

    return (
        <div className="min-h-screen bg-background">
            <div className="mt-[80px]" />
            <main className="container mx-auto p-6 max-w-screen-lg duration-150">
                <h1 className="text-3xl font-bold">If you have any questions about the weighting systems</h1>
                <h1 className="text-3xl font-bold">I encourage you to ask at: <Link className="font-bold cursor-pointer text-blue-500 hover:text-blue-700 transition-color duration-150" href='https://discord.gg/QZn4Qk3mSP'>Wynnpool Discord</Link></h1>
                {/* <h1 className="text-2xl font-bold">Mythic Items</h1> */}

                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="mt-6">
                        <h2 className="text-xl font-semibold capitalize mb-2">{category}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {items.map(([key, item]) => (
                                <div key={key}>
                                    <div
                                        onClick={() => setSelectedItem(item)}
                                        role="button"
                                        className="border p-2 rounded flex items-center gap-3 text-left hover:bg-muted transition w-full cursor-pointer"
                                    >
                                        <ItemIcon item={item} size={40} />
                                        <strong>{item.internalName}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {/* Single modal instance for all items */}
                {selectedItem && (
                    <ItemModal
                        item={selectedItem}
                        open={!!selectedItem}
                        onClose={() => setSelectedItem(null)}
                        user={user}
                        isAllowed={isAllowed}
                    />
                )}
            </main>
        </div>
    );
}
