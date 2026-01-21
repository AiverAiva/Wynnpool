"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { CombatItem } from "@wynnpool/shared"
import { Dice1Icon as Dice, AlertTriangle, ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { getIdentificationInfo } from '@/lib/itemUtils';
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
    const [requirements, setRequirements] = useState<{ [key: string]: { value?: number, enabled: boolean, direction?: 'gte' | 'lte' } }>({}); // For individual stat requirements
    const [overallRequirement, setOverallRequirement] = useState<{ value?: number, enabled: boolean, direction?: 'gte' | 'lte' }>({ enabled: false, direction: 'gte' }); // For overall item requirement
    const [isAutoRolling, setIsAutoRolling] = useState(false);
    const [autoRollStatus, setAutoRollStatus] = useState<string | null>(null);
    const autoRollCancelRef = useRef(false);
    const [rollSpeed, setRollSpeed] = useState<number>(1000); // Speed multiplier for normal mode
    const workersRef = useRef<Worker[]>([]);
    const workerUrlRef = useRef<string | null>(null);
    const [rollsPerSecond, setRollsPerSecond] = useState<number>(0);
    const rollStartTimeRef = useRef<number>(0);
    const [useCpuAcceleration, setUseCpuAcceleration] = useState<boolean>(false);
    const totalAttemptsRef = useRef<number[]>([]);


    // Initialize rolled identifications and requirements structure
    useEffect(() => {
        const initialReqs: { [key: string]: { value?: number, enabled: boolean, direction?: 'gte' | 'lte' } } = {};
        if (item.identifications) {
            for (const idKey of Object.keys(item.identifications)) {
                if (typeof item.identifications[idKey] === 'object' && 'raw' in item.identifications[idKey]) {
                    initialReqs[idKey] = { enabled: false, value: undefined, direction: 'gte' };
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

    const toggleRequirementDirection = (statKey: string) => {
        setRequirements(prev => ({
            ...prev,
            [statKey]: {
                ...prev[statKey],
                direction: prev[statKey]?.direction === 'gte' ? 'lte' : 'gte'
            }
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

    const toggleOverallRequirementDirection = () => {
        setOverallRequirement(prev => ({
            ...prev,
            direction: prev.direction === 'gte' ? 'lte' : 'gte'
        }));
    };

    const toggleOverallRequirement = () => {
        setOverallRequirement(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    const checkRequirements = (rolledIds: AnotherRolledIdentificationsProps, currentOverall: number): boolean => {
        if (overallRequirement.enabled && typeof overallRequirement.value === 'number') {
            const direction = overallRequirement.direction || 'gte';
            if (direction === 'gte') {
                if (currentOverall < overallRequirement.value) return false;
            } else {
                if (currentOverall > overallRequirement.value) return false;
            }
        }

        for (const statKey in requirements) {
            if (requirements[statKey].enabled && typeof requirements[statKey].value === 'number') {
                const rolledValue = rolledIds[statKey] as { percentage: number } | undefined;
                const direction = requirements[statKey].direction || 'gte';
                if (!rolledValue) return false;
                if (direction === 'gte') {
                    if (rolledValue.percentage < requirements[statKey].value!) return false;
                } else {
                    if (rolledValue.percentage > requirements[statKey].value!) return false;
                }
            }
        }
        return true;
    };


    const stopAutoRoll = useCallback(() => {
        // Terminate all workers
        workersRef.current.forEach(worker => {
            worker.postMessage('stop');
            worker.terminate();
        });
        workersRef.current = [];
        if (workerUrlRef.current) {
            URL.revokeObjectURL(workerUrlRef.current);
            workerUrlRef.current = null;
        }
        autoRollCancelRef.current = true;
        setIsAutoRolling(false);
        setIsRolling(false);
    }, []);

    // Original non-worker autoRoll function
    const autoRollNormal = useCallback(async () => {
        if (isAutoRolling) return;
        setIsAutoRolling(true);
        setIsRolling(true);
        setAutoRollStatus("Rolling...");
        setRollsPerSecond(0);
        autoRollCancelRef.current = false;
        rollStartTimeRef.current = performance.now();

        let currentAttempt = 0;
        let simResult = { newRolledIDs: RolledIdentifications, overall: itemOverall, idCount: Object.keys(RolledIdentifications).length };

        while (!autoRollCancelRef.current) {
            simResult = stableSimulateRoll();
            if (checkRequirements(simResult.newRolledIDs, simResult.overall)) {
                const elapsed = (performance.now() - rollStartTimeRef.current) / 1000;
                const rps = Math.round((currentAttempt + 1) / elapsed);
                setRollsPerSecond(rps);
                const rollsTaken = selectedAugment === "Corkian Simulator" ? "N/A (Simulator Active)" : currentAttempt + 1;
                setAutoRollStatus(`Requirements met after ${rollsTaken.toLocaleString()} rolls! (${rps.toLocaleString()} rolls/sec)`);
                setIsAutoRolling(false);
                setIsRolling(false);
                return;
            }
            currentAttempt++;
            if (currentAttempt % rollSpeed === 0) {
                const elapsed = (performance.now() - rollStartTimeRef.current) / 1000;
                const rps = Math.round(currentAttempt / elapsed);
                setRollsPerSecond(rps);
                setAutoRollStatus(`Rolling... ${currentAttempt.toLocaleString()} attempts (${rps.toLocaleString()} rolls/sec)`);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        const elapsed = (performance.now() - rollStartTimeRef.current) / 1000;
        const rps = elapsed > 0 ? Math.round(currentAttempt / elapsed) : 0;
        setRollsPerSecond(rps);
        setAutoRollStatus(`Stopped after ${currentAttempt.toLocaleString()} rolls.`);
        setIsAutoRolling(false);
        setIsRolling(false);
    }, [isAutoRolling, stableSimulateRoll, checkRequirements, RolledIdentifications, itemOverall, selectedAugment, rollSpeed]);

    const autoRollWorker = useCallback(() => {
        if (isAutoRolling) return;
        if (!item.identifications) return;

        const numWorkers = navigator.hardwareConcurrency || 4;
        
        setIsAutoRolling(true);
        setIsRolling(true);
        setAutoRollStatus(`Starting ${numWorkers} workers...`);
        setRollsPerSecond(0);
        autoRollCancelRef.current = false;
        rollStartTimeRef.current = performance.now();
        totalAttemptsRef.current = new Array(numWorkers).fill(0);

        // Create Web Worker with inline blob for Next.js compatibility
        const workerCode = `
            function simulateRoll(identifications, ampTier, selectedAugment, lockedIdentification, lockedRolledIDs) {
                const newRolledIDs = {};
                const ampMultiplier = 0.05 * ampTier;
                let identificationCount = 0;
                let currentOverallSum = 0;

                for (const [idName, idValue] of Object.entries(identifications)) {
                    if (typeof idValue === 'object' && idValue !== null && 'raw' in idValue) {
                        if (selectedAugment === "Corkian Insulator" && lockedIdentification === idName && lockedRolledIDs[idName]) {
                            const lockedID = lockedRolledIDs[idName];
                            if (lockedID && typeof lockedID.percentage === 'number') {
                                newRolledIDs[idName] = lockedRolledIDs[idName];
                                currentOverallSum += lockedID.percentage;
                                identificationCount++;
                                continue;
                            }
                        }
                        if (selectedAugment === "Corkian Isolator" && lockedIdentification && lockedIdentification !== idName && lockedRolledIDs[idName]) {
                            const lockedID = lockedRolledIDs[idName];
                            if (lockedID && typeof lockedID.percentage === 'number') {
                                newRolledIDs[idName] = lockedRolledIDs[idName];
                                currentOverallSum += lockedID.percentage;
                                identificationCount++;
                                continue;
                            }
                        }

                        const rollPos = (Math.ceil((Math.random() * 101) - 1) / 100) + 0.3;
                        const rollNeg = (Math.ceil((Math.random() * 61) - 1) / 100) + 0.7;
                        const ampSim = parseFloat((rollPos + (1.3 - rollPos) * ampMultiplier).toFixed(2));

                        let rolledValue, maxRoll, minRoll, percent;
                        let starLevel = 0;

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
                const overall = identificationCount > 0 ? Number((currentOverallSum / identificationCount).toFixed(2)) : 0;
                return { rolledIDs: newRolledIDs, overall };
            }

            function checkRequirements(rolledIDs, overall, requirements, overallRequirement) {
                if (overallRequirement.enabled && typeof overallRequirement.value === 'number') {
                    const direction = overallRequirement.direction || 'gte';
                    if (direction === 'gte') {
                        if (overall < overallRequirement.value) return false;
                    } else {
                        if (overall > overallRequirement.value) return false;
                    }
                }
                for (const statKey in requirements) {
                    if (requirements[statKey].enabled && typeof requirements[statKey].value === 'number') {
                        const rolledValue = rolledIDs[statKey];
                        const direction = requirements[statKey].direction || 'gte';
                        if (!rolledValue || typeof rolledValue.percentage !== 'number') return false;
                        if (direction === 'gte') {
                            if (rolledValue.percentage < requirements[statKey].value) return false;
                        } else {
                            if (rolledValue.percentage > requirements[statKey].value) return false;
                        }
                    }
                }
                return true;
            }

            let shouldStop = false;
            self.onmessage = function(e) {
                if (e.data === 'stop') {
                    shouldStop = true;
                    return;
                }
                shouldStop = false;
                const { identifications, ampTier, selectedAugment, lockedIdentification, lockedRolledIDs, requirements, overallRequirement, batchSize, workerId } = e.data;
                let attempts = 0;
                const progressInterval = Math.max(10000, batchSize);
                let lastResult = null;

                while (!shouldStop) {
                    const result = simulateRoll(identifications, ampTier, selectedAugment, lockedIdentification, lockedRolledIDs);
                    lastResult = result;
                    attempts++;
                    if (checkRequirements(result.rolledIDs, result.overall, requirements, overallRequirement)) {
                        self.postMessage({ type: 'success', attempts, rolledIDs: result.rolledIDs, overall: result.overall, workerId });
                        return;
                    }
                    if (attempts % progressInterval === 0) {
                        self.postMessage({ type: 'progress', attempts, rolledIDs: result.rolledIDs, overall: result.overall, workerId });
                    }
                }
                self.postMessage({ type: 'stopped', attempts, rolledIDs: lastResult?.rolledIDs, overall: lastResult?.overall, workerId });
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        workerUrlRef.current = workerUrl;
        
        let foundResult = false;
        const workers: Worker[] = [];

        const cleanupWorkers = () => {
            workers.forEach(w => {
                w.postMessage('stop');
                w.terminate();
            });
            workersRef.current = [];
            if (workerUrlRef.current) {
                URL.revokeObjectURL(workerUrlRef.current);
                workerUrlRef.current = null;
            }
        };

        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(workerUrl);
            workers.push(worker);

            worker.onmessage = (e) => {
                if (foundResult) return; // Another worker already found the result
                
                const { type, attempts, rolledIDs, overall, workerId } = e.data;
                totalAttemptsRef.current[workerId] = attempts;
                const totalAttempts = totalAttemptsRef.current.reduce((a, b) => a + b, 0);
                const elapsed = (performance.now() - rollStartTimeRef.current) / 1000;
                const rps = Math.round(totalAttempts / elapsed);
                setRollsPerSecond(rps);

                if (type === 'success') {
                    foundResult = true;
                    setRolledIdentifications(rolledIDs);
                    setItemOverall(overall);
                    setRerollCount(prev => prev + totalAttempts);
                    const rollsTaken = selectedAugment === "Corkian Simulator" ? "N/A (Simulator Active)" : totalAttempts;
                    setAutoRollStatus(`Requirements met after ${rollsTaken.toLocaleString()} rolls! (${rps.toLocaleString()} rolls/sec, ${numWorkers} threads)`);
                    setIsAutoRolling(false);
                    setIsRolling(false);
                    cleanupWorkers();
                } else if (type === 'progress') {
                    setRolledIdentifications(rolledIDs);
                    setItemOverall(overall);
                    setAutoRollStatus(`Rolling... ${totalAttempts.toLocaleString()} attempts (${rps.toLocaleString()} rolls/sec, ${numWorkers} threads)`);
                } else if (type === 'stopped') {
                    // Check if all workers are stopped
                    const allStopped = workers.every(w => w.onmessage === null || foundResult);
                    if (!foundResult && allStopped) {
                        if (rolledIDs) {
                            setRolledIdentifications(rolledIDs);
                            setItemOverall(overall);
                        }
                        setRerollCount(prev => prev + totalAttempts);
                        setAutoRollStatus(`Stopped after ${totalAttempts.toLocaleString()} rolls.`);
                        setIsAutoRolling(false);
                        setIsRolling(false);
                        cleanupWorkers();
                    }
                }
            };

            worker.onerror = (error) => {
                console.error('Worker error:', error);
                if (!foundResult) {
                    setAutoRollStatus(`Error: ${error.message}`);
                    setIsAutoRolling(false);
                    setIsRolling(false);
                    cleanupWorkers();
                }
            };

            // Start the worker
            worker.postMessage({
                identifications: item.identifications,
                ampTier,
                selectedAugment,
                lockedIdentification,
                lockedRolledIDs: RolledIdentifications,
                requirements,
                overallRequirement,
                batchSize: rollSpeed,
                workerId: i
            });
        }

        workersRef.current = workers;
    }, [isAutoRolling, item.identifications, ampTier, selectedAugment, lockedIdentification, RolledIdentifications, requirements, overallRequirement, rollSpeed]);

    // Wrapper function that decides which autoRoll to use
    const autoRoll = useCallback(() => {
        if (useCpuAcceleration) {
            autoRollWorker();
        } else {
            autoRollNormal();
        }
    }, [useCpuAcceleration, autoRollWorker, autoRollNormal]);


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
                                    ? stopAutoRoll
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
                                                <span>{getIdentificationInfo(idKey)?.displayName || idKey}</span>
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

                        <div className="mt-6 border-t pt-4 font-sans">
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
                                    <button
                                        type="button"
                                        className={`mx-1 flex items-center justify-center rounded-md border-2 transition-colors duration-150 focus:outline-none focus:ring-2
                                            ${overallRequirement.direction === 'lte'
                                                ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-300 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800'
                                                : 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-300 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800'}
                                            `}
                                        style={{ width: 36, height: 36 }}
                                        title={
                                            overallRequirement.direction === 'lte'
                                                ? 'Click to require ≤ (at most) this value'
                                                : 'Click to require ≥ (at least) this value'
                                        }
                                        aria-label={
                                            overallRequirement.direction === 'lte'
                                                ? 'Set requirement to at most'
                                                : 'Set requirement to at least'
                                        }
                                        onClick={toggleOverallRequirementDirection}
                                    >
                                        {overallRequirement.direction === 'lte'
                                            ? <ChevronDownIcon className="w-6 h-6" />
                                            : <ChevronUpIcon className="w-6 h-6" />}
                                    </button>
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
                                        const displayName = getIdentificationInfo(statKey)?.displayName || statKey;
                                        return (
                                            <div key={statKey} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`${statKey}-req-enabled`}
                                                    checked={requirements[statKey]?.enabled || false}
                                                    onChange={() => toggleRequirement(statKey)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={`${statKey}-req-enabled`} className="text-sm min-w-[150px] truncate" title={displayName}>{displayName} %:</Label>
                                                <button
                                                    type="button"
                                                    className={`mx-1 flex items-center justify-center rounded-md border-2 transition-colors duration-150 focus:outline-none focus:ring-2
                                                        ${requirements[statKey]?.direction === 'lte'
                                                            ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-300 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800'
                                                            : 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-300 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800'}
                                                        `}
                                                    style={{ width: 36, height: 36 }}
                                                    title={
                                                        requirements[statKey]?.direction === 'lte'
                                                            ? 'Click to require ≤ (at most) this value'
                                                            : 'Click to require ≥ (at least) this value'
                                                    }
                                                    aria-label={
                                                        requirements[statKey]?.direction === 'lte'
                                                            ? 'Set requirement to at most'
                                                            : 'Set requirement to at least'
                                                    }
                                                    onClick={() => toggleRequirementDirection(statKey)}
                                                >
                                                    {requirements[statKey]?.direction === 'lte'
                                                        ? <ChevronDownIcon className="w-6 h-6" />
                                                        : <ChevronUpIcon className="w-6 h-6" />}
                                                </button>
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

                        <div className="mt-6 border-t pt-4 font-sans">
                            <h3 className="text-lg font-semibold mb-2 text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Danger Zone
                            </h3>
                            <div className="space-y-3 p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="cpu-acceleration"
                                        checked={useCpuAcceleration}
                                        onChange={(e) => setUseCpuAcceleration(e.target.checked)}
                                        className="h-4 w-4"
                                        disabled={isAutoRolling}
                                    />
                                    <Label htmlFor="cpu-acceleration" className="text-sm font-medium">
                                        🚀 CPU Acceleration (Multi-Thread)
                                    </Label>
                                </div>
                                {useCpuAcceleration && (
                                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-md border border-green-300 dark:border-green-700">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            <strong>Enabled:</strong> Using {typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4} CPU threads in parallel for maximum speed!
                                        </p>
                                    </div>
                                )}
                                {rollsPerSecond > 0 && (
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md border border-blue-300 dark:border-blue-700">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Current speed: <strong>{rollsPerSecond.toLocaleString()}</strong> rolls/sec
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ItemRollSimulator