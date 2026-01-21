"use client";

import { useEffect, useState } from "react";
import ItemWeightedLB from "./item-weighted-lb";
import Link from "next/link";
import SubmitRankingModal from "./submit-ranking-modal";
import { Button } from "@/components/ui/button";
import type { Item } from "@wynnpool/shared";
import { ItemIcon } from "@/components/custom/WynnIcon";
import api from "@/lib/api";

type ItemEntry = [string, any];

export default function RankingPage() {
    const [groupedItems, setGroupedItems] = useState<Record<string, [string, Item][]>>({});
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [canSubmit, setCanSubmit] = useState(false);

    useEffect(() => {
        // check permission for submitting
        fetch(api("/user/roles"), { credentials: "include" })
            .then(res => res.json())
            .then(data => setCanSubmit(data.roles.includes("ITEM_DATABASE")))
            .catch(() => setCanSubmit(false));

        // fetch only mythic weapons and armours
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

    if (loading)
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <p className="font-mono text-2xl">Loading rankings...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-background">
            <div className="mt-[80px]" />
            <main className="container mx-auto p-6 max-w-screen-lg duration-150">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Mythic Weapon Rankings</h1>
                        <h2 className="text-lg text-muted-foreground">
                            Join our Discord to discuss or submit: {" "}
                            <Link className="text-blue-500 hover:underline" href="https://discord.gg/QZn4Qk3mSP">
                                Wynnpool Discord
                            </Link>
                        </h2>
                    </div>
                    {canSubmit && (
                        <div className="flex gap-4">
                            <Link href={"/item/ranking/manage"} prefetch={false}>
                                <Button>
                                    Manage Items
                                </Button>
                            </Link>
                            <Button onClick={() => setModalOpen(true)}>
                                + Submit Item
                            </Button>
                        </div>
                    )}
                </div>

                {/* Database warning */}
                <div className="mb-6">
                    <div className="text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 rounded p-3 text-sm">
                        As our database is relatively new, the rankings may be missing a lot of better ranked mythics. Please do not rely on these rankings for now while we collect more data.
                    </div>
                </div>

                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="mt-6">
                        <h2 className="text-xl font-semibold capitalize mb-2">{category}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {items.map(([key, item]) => (
                                <div key={key}>
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="border p-2 rounded flex items-center gap-3 text-left hover:bg-muted transition w-full"
                                    >
                                        <ItemIcon item={item} size={40} />
                                        <strong>{item.internalName}</strong>
                                    </button>
                                    {selectedItem?.internalName === item.internalName && (
                                        <ItemWeightedLB item={item} open={true} onClose={() => setSelectedItem(null)} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {canSubmit && (
                    <SubmitRankingModal open={modalOpen} onClose={() => setModalOpen(false)} />
                )}
            </main>
        </div>
    );
}
