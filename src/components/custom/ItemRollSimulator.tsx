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
        if (!item.identifications) return;

        const result: AnotherRolledIdentificationsProps = {};
        const ampMultiplier = 0.05 * ampTier;
        const IDs = item.identifications;

        let identificationCount = 0;
        let overall = 0;

        const getRoll = (isNegative: boolean) =>
            isNegative
                ? (Math.ceil(Math.random() * 61) - 1) / 100 + 0.7
                : (Math.ceil(Math.random() * 101) - 1) / 100 + 0.3;

        const getStarLevel = (roll: number) => {
            if (roll >= 1.3) return 3;
            if (roll >= 1.25) return 2;
            if (roll >= 1.0) return 1;
            return 0;
        };

        for (const [stat, value] of Object.entries(IDs)) {
            if (typeof value === 'object' && 'raw' in value) {
                const isSpellCost = stat.toLowerCase().includes('spellcost');
                const base = value.raw;
                const isPositive = base > 0;

                let roll = getRoll(!isPositive); // negative if stat is positive
                let ampRoll = parseFloat((roll + (1.3 - roll) * ampMultiplier).toFixed(2));

                let finalRoll = isSpellCost
                    ? Math.round(base * (isPositive ? getRoll(true) : ampRoll))
                    : Math.round(base * (isPositive ? ampRoll : getRoll(true)));

                let maxVal = Math.round(base * 1.3);
                let minVal = Math.round(base * (isSpellCost ? 0.7 : 0.3));

                // Calculate percentage
                let percentage = minVal !== maxVal
                    ? isPositive
                        ? isSpellCost
                            ? ((maxVal - finalRoll) / (maxVal - minVal)) * 100
                            : ((finalRoll - minVal) / (maxVal - minVal)) * 100
                        : isSpellCost
                            ? ((finalRoll - minVal) / (maxVal - minVal)) * 100
                            : ((maxVal - finalRoll) / (maxVal - minVal)) * 100 * 5 / 3
                    : 100;

                // Assign star level if applicable
                let star = !isSpellCost && isPositive ? getStarLevel(ampRoll) : 0;

                overall += percentage;
                identificationCount++;

                result[stat] = {
                    raw: finalRoll,
                    percentage: Number(percentage.toFixed(1)),
                    star,
                };
            } else {
                result[stat] = value;
            }
        }

        if (identificationCount > 0) {
            setItemOverall(Number((overall / identificationCount).toFixed(2)));
        }

        return setRolledIdentifications(result);
    };

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
                                <Dice className="h-4 w-4" /> Roll
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