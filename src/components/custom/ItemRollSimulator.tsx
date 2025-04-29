"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CombatItem } from "@/types/itemType"
import { Dice1Icon as Dice } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { AnotherRolledIdentifications, AnotherRolledIdentificationsProps } from "../wynncraft/item/Identifications"
import { ItemHeader } from "../wynncraft/item/RolledItemDisplay"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"

interface ItemRollSimulatorProps {
    item: CombatItem
    trigger?: React.ReactNode
}

const ItemRollSimulator: React.FC<ItemRollSimulatorProps> = ({ item, trigger }) => {
    const [RolledIdentifications, setRolledIdentifications] = useState<AnotherRolledIdentificationsProps>({})
    const [ampTier, setAmpTier] = useState<number>(0)
    const [itemOverall, setItemOverall] = useState<number>(0)
    const [isRolling, setIsRolling] = useState(false)

    // Initialize rolled identifications
    useEffect(() => {
        simulateRoll()
    }, [item])

    const simulateRoll = () => {
        if (!item.identifications) return

        const result: AnotherRolledIdentificationsProps = {};
        const amp = 0.05 * ampTier;
        const IDs = item.identifications;

        let statCount = 0;;
        let overall = 0;

        for (const [stat, value] of Object.entries(IDs)) {
            if (typeof value === 'object' && 'raw' in value) {
                let id_rolled;
                let max_val, min_val, percentage, amp_roll;

                let positive_roll = (Math.ceil((Math.random() * 101) - 1) / 100) + 0.3;
                let negative_roll = (Math.ceil((Math.random() * 61) - 1) / 100) + 0.7;
                let star = 0;
                amp_roll = parseFloat((positive_roll + (1.3 - positive_roll) * amp).toFixed(2));
                if (value.raw > 0) {
                    max_val = Math.round(value.raw * 1.3);
                    if (!stat.toLowerCase().includes('spellcost')) {
                        if (amp_roll >= 1.0 && amp_roll < 1.25) star = 1;
                        else if (amp_roll >= 1.25 && amp_roll < 1.3) star = 2;
                        else if (amp_roll === 1.3) star = 3;
                    }

                    if (stat.toLowerCase().includes('spellcost')) {
                        id_rolled = Math.round(value.raw * negative_roll);

                        min_val = Math.round(value.raw * 0.7);
                        percentage = min_val !== max_val ? ((max_val - id_rolled) / (max_val - min_val)) * 100 : 100;
                    } else {
                        id_rolled = Math.round(value.raw * amp_roll);

                        min_val = Math.round(value.raw * 0.3);
                        percentage = min_val !== max_val ? ((id_rolled - min_val) / (max_val - min_val)) * 100 : 100;
                    }

                    overall += percentage;
                    statCount++;
                    result[stat] = { raw: id_rolled, percentage: Number(percentage.toFixed(1)), star: star };
                } else {
                    max_val = Math.round(value.raw * 1.3);

                    if (stat.toLowerCase().includes('spellcost')) {
                        id_rolled = Math.round(value.raw * amp_roll);
                        min_val = Math.round(value.raw * 0.3);
                        percentage = min_val !== max_val ? ((id_rolled - min_val) / (max_val - min_val)) * 100 : 100;
                    } else {
                        id_rolled = Math.round(value.raw * negative_roll);
                        min_val = Math.round(value.raw * 0.7);
                        percentage = min_val !== max_val ? ((max_val - id_rolled) / (max_val - min_val)) * 100 : 100;
                    }

                    overall += percentage;
                    statCount++;
                    result[stat] = { raw: id_rolled, percentage: Number(percentage.toFixed(1)), star: star };
                }
            } else {
                result[stat] = value;
            }
            statCount > 0 && setItemOverall(Number((overall / statCount).toFixed(2)));
        }

        return setRolledIdentifications(result)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Dice className="h-4 w-4" /> Roll Simulator
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <span>Item Roll Simulator</span>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="amp-tier" className="text-sm">Amplifier Tier</Label>
                                <Select value={ampTier.toString()} onValueChange={(value) => setAmpTier(Number(value))}>
                                    <SelectTrigger className="w-[80px] h-8 text-sm" id="amp-tier">
                                        <SelectValue placeholder="0" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0, 1, 2, 3].map((tier) => (
                                            <SelectItem key={tier} value={tier.toString()}>
                                                {tier}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" className="gap-1" onClick={simulateRoll} disabled={isRolling}>
                                <Dice className="h-4 w-4" /> Roll All
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="md:col-span-3 space-y-6 font-ascii">
                        <ItemHeader item={item} overall={itemOverall} />

                        <div className="flex justify-center">
                            <div className="flex flex-col items-start space-y-4">
                                <AnotherRolledIdentifications {...RolledIdentifications} />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ItemRollSimulator

