"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CombatItem } from "@/types/itemType"
import { Dice1Icon as Dice, AlertTriangle } from "lucide-react"
import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
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
    const [rerollCount, setRerollCount] = useState(0);
    const [selectedAugment, setSelectedAugment] = useState<string>("None");
    const [lockedIdentification, setLockedIdentification] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<{ [key: string]: { value?: number, enabled: boolean } }>({}); // For individual stat requirements
    const [overallRequirement, setOverallRequirement] = useState<{ value?: number, enabled: boolean }>({ enabled: false }); // For overall item requirement
    const [isAutoRolling, setIsAutoRolling] = useState(false);
    const [autoRollStatus, setAutoRollStatus] = useState<string | null>(null);
    const autoRollCancelRef = useRef(false);


    // Initialize rolled identifications and requirements structure
    useEffect(() => {
        const initialReqs: { [key: string]: { value?: number, enabled: boolean } } = {};
        if (item.identifications) {
            for (const idKey of Object.keys(item.identifications)) {
                if (typeof item.identifications[idKey] === 'object' && 'raw' in item.identifications[idKey]) {
                    initialReqs[idKey] = { enabled: false, value: undefined };
                }
            }
        }
        setRequirements(initialReqs);
        setOverallRequirement({ enabled: false, value: undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item]); // item is the primary dependency here

    const stableSimulateRoll = useCallback(() => {
        if (!item.identifications) return { newRolledIDs: {}, overall: 0, idCount: 0 };

        const newRolledIDs: AnotherRolledIdentificationsProps = {};
        const ampMultiplier = 0.05 * ampTier;
        const IDs = item.identifications;

        let identificationCount = 0;
        let currentOverallSum = 0;

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

        for (const [idName, idValue] of Object.entries(IDs)) {
            if (typeof idValue === 'object' && 'raw' in idValue) {
                if (selectedAugment === "Corkian Insulator" && lockedIdentification === idName && RolledIdentifications[idName] && RolledIdentifications[idName].hasOwnProperty('percentage')) {
                    newRolledIDs[idName] = RolledIdentifications[idName];
                    currentOverallSum += (RolledIdentifications[idName] as { percentage: number }).percentage;
                    identificationCount++;
                    continue;
                }
                if (selectedAugment === "Corkian Isolator" && lockedIdentification && lockedIdentification !== idName && RolledIdentifications[idName] && RolledIdentifications[idName].hasOwnProperty('percentage')) {
                    newRolledIDs[idName] = RolledIdentifications[idName];
                    currentOverallSum += (RolledIdentifications[idName] as { percentage: number }).percentage;
                    identificationCount++;
                    continue;
                }

                let rolledValue;
                let maxRoll, minRoll, percent, ampSim;
                const rollPos = (Math.ceil((Math.random() * 101) - 1) / 100) + 0.3;
                const rollNeg = (Math.ceil((Math.random() * 61) - 1) / 100) + 0.7;
                let starLevel = 0;
                ampSim = parseFloat((rollPos + (1.3 - rollPos) * ampMultiplier).toFixed(2));

                if (idValue.raw > 0) {
                    maxRoll = Math.round(idValue.raw * 1.3);
                    if (!idName.toLowerCase().includes('spellcost')) {
                        if (ampSim >= 1.0 && ampSim < 1.25) starLevel = 1;
                        else if (ampSim >= 1.25 && ampSim < 1.3) starLevel = 2;
                        else if (ampSim === 1.3) starLevel = 3;
                    }

                    if (idName.toLowerCase().includes('spellcost')) {
                        rolledValue = Math.round(idValue.raw * rollNeg);
                        minRoll = Math.round(idValue.raw * 0.7);
                        percent = minRoll !== maxRoll ? ((maxRoll - rolledValue) / (maxRoll - minRoll)) * 100 : 100;
                    } else {
                        rolledValue = Math.round(idValue.raw * ampSim);
                        minRoll = Math.round(idValue.raw * 0.3);
                        percent = minRoll !== maxRoll ? ((rolledValue - minRoll) / (maxRoll - minRoll)) * 100 : 100;
                    }

                    currentOverallSum += percent;
                    identificationCount++;
                    newRolledIDs[idName] = { raw: rolledValue, percentage: Number(percent.toFixed(1)), star: starLevel };
                } else {
                    maxRoll = Math.round(idValue.raw * 1.3);
                    if (idName.toLowerCase().includes('spellcost')) {
                        rolledValue = Math.round(idValue.raw * ampSim);
                        minRoll = Math.round(idValue.raw * 0.3);
                        percent = minRoll !== maxRoll ? ((rolledValue - minRoll) / (maxRoll - minRoll)) * 100 : 100;
                    } else {
                        rolledValue = Math.round(idValue.raw * rollNeg);
                        minRoll = Math.round(idValue.raw * 0.7);
                        percent = minRoll !== maxRoll ? ((maxRoll - rolledValue) / (maxRoll - minRoll)) * 100 : 100;
                    }
                    currentOverallSum += percent;
                    identificationCount++;
                    newRolledIDs[idName] = { raw: rolledValue, percentage: Number(percent.toFixed(1)), star: starLevel };
                }
            } else {
                newRolledIDs[idName] = idValue;
            }
        }

        const finalOverall = identificationCount > 0 ? Number((currentOverallSum / identificationCount).toFixed(2)) : 0;

        if (selectedAugment !== "Corkian Simulator") {
            setRerollCount((prev) => prev + 1);
        }

        setRolledIdentifications(newRolledIDs);
        setItemOverall(finalOverall);

        return { newRolledIDs, overall: finalOverall, idCount: identificationCount };
    }, [item.identifications, ampTier, selectedAugment, lockedIdentification, RolledIdentifications, setRerollCount, setRolledIdentifications, setItemOverall]);

    // Effect to perform the first roll when the component mounts or item changes
     useEffect(() => {
        stableSimulateRoll();
        setRerollCount(0);
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item]); // stableSimulateRoll is memoized, item is the trigger


    const handleRequirementChange = (statKey: string, value: string) => {
        setRequirements(prev => ({
            ...prev,
            [statKey]: { ...prev[statKey], value: value === "" ? undefined : Number(value) }
        }));
    };  

    const toggleRequirement = (statKey: string) => {
        setRequirements(prev => ({
            ...prev,
            [statKey]: { ...prev[statKey], enabled: !prev[statKey]?.enabled }
        }));
    };

    const handleOverallRequirementChange = (value: string) => {
        setOverallRequirement(prev => ({ ...prev, value: value === "" ? undefined : Number(value) }));
    };

    const toggleOverallRequirement = () => {
        setOverallRequirement(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    const checkRequirements = (rolledIds: AnotherRolledIdentificationsProps, currentOverall: number): boolean => {
        if (overallRequirement.enabled && typeof overallRequirement.value === 'number') {
            if (currentOverall < overallRequirement.value) return false;
        }

        for (const statKey in requirements) {
            if (requirements[statKey].enabled && typeof requirements[statKey].value === 'number') {
                const rolledValue = rolledIds[statKey] as { percentage: number } | undefined;
                if (!rolledValue || rolledValue.percentage < requirements[statKey].value!) {
                    return false;
                }
            }
        }
        return true;
    };


    const autoRoll = useCallback(async () => {
        if (isAutoRolling) return;
        setIsAutoRolling(true);
        setIsRolling(true);
        setAutoRollStatus("Rolling...");
        autoRollCancelRef.current = false;

        let currentAttempt = 0;
        let simResult = { newRolledIDs: RolledIdentifications, overall: itemOverall, idCount: Object.keys(RolledIdentifications).length };

        while (!autoRollCancelRef.current) {
            simResult = stableSimulateRoll();
            if (checkRequirements(simResult.newRolledIDs, simResult.overall)) {
                const rollsTaken = selectedAugment === "Corkian Simulator" ? "N/A (Simulator Active)" : currentAttempt + 1;
                setAutoRollStatus(`Requirements met after ${rollsTaken} auto-roll${currentAttempt === 0 && selectedAugment !== "Corkian Simulator" ? "" : "s"}.`);
                setIsAutoRolling(false);
                setIsRolling(false);
                return;
            }
            currentAttempt++;
            if (currentAttempt % 500 === 0) {
                setAutoRollStatus(`Rolling... Attempt ${currentAttempt + 1}`);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        setAutoRollStatus("Auto-roll stopped by user.");
        setIsAutoRolling(false);
        setIsRolling(false);
    }, [isAutoRolling, stableSimulateRoll, checkRequirements, RolledIdentifications, itemOverall, selectedAugment, requirements, overallRequirement]);


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
                                <Select value={ampTier.toString()} onValueChange={(value) => { setAmpTier(Number(value)); setAutoRollStatus(null); }}>
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
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={isAutoRolling
                                    ? () => { autoRollCancelRef.current = true; setIsAutoRolling(false); }
                                    : () => { stableSimulateRoll(); setAutoRollStatus(null); }
                                }
                                disabled={isAutoRolling ? false : isRolling}
                            >
                                <Dice className="h-4 w-4" /> {isAutoRolling ? "Stop" : "Roll"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={autoRoll}
                                disabled={isRolling || isAutoRolling}
                            >
                                <Dice className="h-4 w-4" /> Roll until Req.
                            </Button>
                            <span className="ml-2 text-xs text-muted-foreground">Rerolls: {rerollCount}</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                {autoRollStatus && (
                    <div className={`p-2 my-2 text-sm rounded-md ${autoRollStatus.includes("met") ? 'bg-green-100 text-green-700' : autoRollStatus.includes("Max") ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {autoRollStatus.includes("Max") && <AlertTriangle className="inline h-4 w-4 mr-1" />}
                        {autoRollStatus}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="augment-select" className="text-sm">Augment</Label>
                        <Select value={selectedAugment} onValueChange={(value) => {
                            setSelectedAugment(value);
                            setLockedIdentification(null); // Reset locked ID when augment changes
                        }}>
                            <SelectTrigger className="w-[180px] h-8 text-sm" id="augment-select">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Corkian Insulator">Corkian Insulator</SelectItem>
                                <SelectItem value="Corkian Isolator">Corkian Isolator</SelectItem>
                                <SelectItem value="Corkian Simulator">Corkian Simulator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(selectedAugment === "Corkian Insulator" || selectedAugment === "Corkian Isolator") && item.identifications && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="locked-id-select" className="text-sm">
                                {selectedAugment === "Corkian Insulator" ? "Lock ID" : "Isolate ID"}
                            </Label>
                            <Select
                                value={lockedIdentification ?? "__none__"}
                                onValueChange={(value) => setLockedIdentification(value === "__none__" ? null : value)}
                            >
                                <SelectTrigger className="w-[180px] h-8 text-sm" id="locked-id-select">
                                    <SelectValue placeholder="Select ID" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {item.identifications ? Object.keys(item.identifications).map((idKey) => (
                                        typeof item.identifications![idKey] === 'object' && 'raw' in item.identifications![idKey] && (
                                            <SelectItem key={idKey} value={idKey}>
                                                {idKey}
                                            </SelectItem>
                                        )
                                    )) : null}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="md:col-span-3 space-y-6 font-ascii">
                        <ItemHeader item={item} overall={itemOverall} />

                        <div className="flex justify-center">
                            <div className="flex flex-col items-start space-y-4">
                                <AnotherRolledIdentifications {...RolledIdentifications} />
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-semibold mb-2">Set Roll Requirements</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="overall-req-enabled"
                                        checked={overallRequirement.enabled}
                                        onChange={toggleOverallRequirement}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="overall-req-enabled" className="text-sm">Overall %:</Label>
                                    <input
                                        type="number"
                                        id="overall-req"
                                        value={overallRequirement.value === undefined ? "" : overallRequirement.value}
                                        onChange={(e) => handleOverallRequirementChange(e.target.value)}
                                        disabled={!overallRequirement.enabled}
                                        className="w-20 h-8 text-sm border rounded px-2 disabled:bg-gray-100"
                                        placeholder="e.g. 80"
                                    />
                                </div>
                                {item.identifications && Object.entries(item.identifications).map(([statKey, statValue]) => {
                                    if (typeof statValue === 'object' && 'raw' in statValue) {
                                        return (
                                            <div key={statKey} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`${statKey}-req-enabled`}
                                                    checked={requirements[statKey]?.enabled || false}
                                                    onChange={() => toggleRequirement(statKey)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={`${statKey}-req-enabled`} className="text-sm min-w-[150px] truncate" title={statKey}>{statKey} %:</Label>
                                                <input
                                                    type="number"
                                                    id={`${statKey}-req`}
                                                    value={requirements[statKey]?.value === undefined ? "" : requirements[statKey]?.value}
                                                    onChange={(e) => handleRequirementChange(statKey, e.target.value)}
                                                    disabled={!requirements[statKey]?.enabled}
                                                    className="w-20 h-8 text-sm border rounded px-2 disabled:bg-gray-100"
                                                    placeholder="e.g. 90"
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ItemRollSimulator