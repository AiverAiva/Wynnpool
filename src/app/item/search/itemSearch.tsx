'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronsUpDown, Loader2, RotateCcw, X } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ItemTypeIcon } from '@/components/custom/WynnIcon'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { DualSlider } from '@/components/ui/dual-slider'
import { getIdentificationInfo } from '@/types/itemType'

const itemTypes = {
    weapon: ['bow', 'spear', 'wand', 'relik', 'dagger'],
    misc: ['tome', 'charm'],
    armour: ['helmet', 'chestplate', 'leggings', 'boots'],
    accessory: ['ring', 'bracelet', 'necklace'],
}

const tiersColors = {
    common: '#e2e8f0',
    set: '#55ff55',
    unique: '#ffff55',
    rare: '#ff55ff',
    legendary: '#55ffff',
    fabled: '#ff5555',
    mythic: '#aa00aa'
}

const tiers = Object.keys(tiersColors);

interface MultiSelectTabsProps {
    options: string[]
    selectedOptions: string[]
    onChange: (selected: string[]) => void
}

function MultiSelectTabs({ options, selectedOptions, onChange }: MultiSelectTabsProps) {
    return (
        <div className="flex flex-wrap gap-2 p-1 bg-secondary rounded-md w-fit">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => {
                        const newSelected = selectedOptions.includes(option)
                            ? selectedOptions.filter(item => item !== option)
                            : [...selectedOptions, option]
                        onChange(newSelected)
                    }}
                    className={cn(
                        "px-1 py-1 rounded-md text-sm font-medium transition-colors",

                        selectedOptions.includes(option)
                            ? "bg-background text-primary-foreground"
                            : "bg-accent text-secondary-foreground hover:dark:bg-background/30 hover:bg-primary/10"
                    )}
                >
                    <ItemTypeIcon type={option} />
                </button>
            ))}
        </div>
    )
}

function RarityTabs({ options, selectedOptions, onChange }: MultiSelectTabsProps) {
    return (
        <div className="flex flex-wrap gap-2 p-2 bg-secondary rounded-md w-fit">
            {options.map((option) => {
                const isSelected = selectedOptions.includes(option);
                const color = tiersColors[option as keyof typeof tiersColors] || '#ccc'; // Default to #ccc if color not found

                return (
                    <button
                        key={option}
                        onClick={() => {
                            const newSelected = isSelected
                                ? selectedOptions.filter(item => item !== option)
                                : [...selectedOptions, option];
                            onChange(newSelected);
                        }}
                        className={`p-1 rounded-md text-sm font-medium transition-all`}
                        style={{
                            backgroundColor: color,
                            filter: isSelected ? 'brightness(1.3)' : 'brightness(0.3)', // Lighter when active, darker when inactive
                            color: color, // Dark text color
                            // mixBlendMode: 'multiply', // Ensures dark text color blends well over light or bright backgrounds
                        }}
                    >
                        {/* + option.slice(1).toLowerCase() */}
                        <div className="px-3 py-1 bg-background rounded">{option.charAt(0).toUpperCase()}</div>
                    </button>
                );
            })}
        </div>
    );
}

interface ItemSearchProps {
    results: Record<string, any> | null;
    setResults: (results: Record<string, any> | null) => void;
    error: string | null;
    setError: (error: string | null) => void;
}

export default function ItemSearch({
    results,
    setResults,
    error,
    setError,
}: ItemSearchProps) {
    const [query, setQuery] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTiers, setSelectedTiers] = useState<string[]>(tiers)
    const [levelRange, setLevelRange] = useState<number[]>([1, 106])
    const [isLoading, setIsLoading] = useState(false)
    const [identifications, setIdentifications] = useState<string[]>([])
    const [selectedIdentifications, setSelectedIdentifications] = useState<string[]>([]);
    const [majorIds, setMajorIds] = useState<string[]>([])
    const [selectedMajorId, setselectedMajorId] = useState<string>('');

    useEffect(() => {
        fetch('/api/item/metadata')
            .then((response) => response.json())
            .then((data) => {
                const identificationsLabeled: any = {};
                const majorsIdsLabeled: any = Object.fromEntries(data.majorIds.map((m: string) => [m, m]));

                data.identifications.forEach((identification: string) => {
                    const identificationInfo = getIdentificationInfo(identification);
                    identificationsLabeled[identification] = (identificationInfo?.detailedName || identificationInfo?.displayName) ?? identification;
                })

                setIdentifications(identificationsLabeled)
                setMajorIds(majorsIdsLabeled)
            })
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        setError(null)
        setResults(null)

        // Check if at least one type or tier is selected
        if (selectedTypes.length === 0 || selectedTiers.length === 0) {
            setError('Please select at least one type and tier.')
            setIsLoading(false)
            return
        }

        const payload: any = {}
        if (query) payload.query = query
        if (selectedTypes.length > 0) payload.type = selectedTypes
        if (selectedTiers.length > 0) payload.tier = selectedTiers
        payload.levelRange = levelRange
        payload.identifications = selectedIdentifications.filter(id => id !== '');
        if (selectedMajorId !== '') payload.majorIds = [selectedMajorId];

        try {
            const response = await fetch('/api/item/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error('Failed to fetch results')
            }

            const data = await response.json()
            setResults(data)
        } catch (err) {
            setError('An error occurred while searching for items.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const clearFilters = () => {
        setQuery('');
        setSelectedTypes([]);
        setSelectedTiers([]);
        setLevelRange([1, 106]);
        setResults(null);
        setError(null);
    };

    return (
        <div className=' gap-4 w-full space-y-6 lg:space-y-0'>
            <div className='flex flex-col md:flex-row gap-6 mb-6'>
                <div className='lg:w-2/5 space-y-6'>
                    <div className='w-auto grid gap-2'>
                        <Label htmlFor="query">Item Name</Label>
                        <Input
                            id="query"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter item name..."
                        />
                    </div>

                    <div className='flex flex-wrap gap-4'>
                        {Object.entries(itemTypes).map(([category, types]) => (
                            <div key={category} className='grid gap-2'>
                                <Label>{category[0].toUpperCase() + category.slice(1)}</Label>
                                <MultiSelectTabs
                                    options={types}
                                    selectedOptions={selectedTypes}
                                    onChange={setSelectedTypes}
                                />
                            </div>
                        ))}
                    </div>

                    <div className='grid gap-2 w-fit'>
                        <div className='flex items-center justify-between'>
                            <Label>Rarity</Label>

                            <Button onClick={() => (selectedTiers.length === tiers.length ? setSelectedTiers([]) : setSelectedTiers(tiers))} variant="secondary" className='h-6 w-24'>
                                {selectedTiers.length === tiers.length ? 'None' : 'All'}
                            </Button>
                        </div>

                        <RarityTabs
                            options={tiers}
                            selectedOptions={selectedTiers}
                            onChange={setSelectedTiers}
                        />
                    </div>

                    <div className='grid gap-2'>
                        <Label>Level Range</Label>
                        <DualSlider
                            min={1}
                            max={106}
                            step={1}
                            value={levelRange}
                            onValueChange={setLevelRange}
                        />
                    </div>
                </div>
            
                <div className='lg:w-3/5 space-y-6'>
                    <div className='grid gap-2'>
                        <Label htmlFor="query">Major id</Label>
                        <div className='flex items-center gap-4'>
                            <ResponsiveComboBox
                                availableOptions={majorIds}
                                value={selectedMajorId}
                                currentLabel='Select a Major id...'
                                onChange={(val) => setselectedMajorId(val)}
                            />
                            <Button
                                variant="outline"
                                disabled={selectedMajorId == ''}
                                onClick={() => setselectedMajorId('')}
                            >
                                <RotateCcw />
                            </Button>
                        </div>
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor="query">Identifications</Label>
                        <IdentificationBox
                            availableIdentifications={identifications}
                            selectedIdentifications={selectedIdentifications}
                            setSelectedIdentifications={setSelectedIdentifications}
                        />
                    </div>
                </div>
            </div>

            <div>
                <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Search
                </Button>

                <Button onClick={clearFilters} className="ml-2" variant="outline">
                    Clear Filters
                </Button>
            </div>
        </div>
    )
}

interface IdentificationBoxProps {
    availableIdentifications: string[]
    selectedIdentifications: string[]
    setSelectedIdentifications: React.Dispatch<React.SetStateAction<string[]>>
}

const IdentificationBox: React.FC<IdentificationBoxProps> = ({
    availableIdentifications,
    selectedIdentifications,
    setSelectedIdentifications,
}) => {
    const [identificationBoxes, setIdentificationBoxes] = useState<string[]>([''])

    const addBox = () => {
        setIdentificationBoxes((prev) => [...prev, ''])
    }

    const removeBox = (index: number) => {
        setIdentificationBoxes((prev) => {
            const updated = [...prev]
            const removed = updated.splice(index, 1)[0]
            if (removed) {
                setSelectedIdentifications((prevSelected) =>
                    prevSelected.filter((id) => id !== removed)
                )
            }
            return updated
        })
    }

    const updateBox = (value: string, index: number) => {
        setIdentificationBoxes((prev) => {
            const updated = [...prev];
            const oldValue = updated[index];
            updated[index] = value;
        
            setSelectedIdentifications((prevSelected) => {
                const newSelection = prevSelected.filter((id) => id !== oldValue);
                return value && !newSelection.includes(value) ? [...newSelection, value] : newSelection;
            });
        
            return updated;
        });
        
    }

    return (
        <div className="space-y-4">
            {identificationBoxes.map((value, index) => (
                <div key={index} className="flex items-center gap-4">
                    <ResponsiveComboBox
                        availableOptions={Object.entries(availableIdentifications).filter(([id, label]) => (
                            !selectedIdentifications.includes(id) || id === value
                        )).reduce((acc, [id, label]) => ({ ...acc, [id]: label }), {})}
                        value={availableIdentifications[value]}
                        currentLabel='Select an Identification...'
                        onChange={(val) => updateBox(val, index)}
                    />
                    <Button
                        variant="destructive"
                        onClick={() => removeBox(index)}
                    >
                        <X className='h-8 w-8'/>
                    </Button>
                </div>
            ))}
            {identificationBoxes.length < 5 && (
                <Button variant="ghost" onClick={addBox} className='w-full'>
                    + Add Identification
                </Button>
            )}
        </div>
    )
}

interface ResponsiveComboBoxProps {
    availableOptions: any
    value: string
    currentLabel?: string
    onChange: (value: string) => void
}

const ResponsiveComboBox: React.FC<ResponsiveComboBoxProps> = ({
    availableOptions,
    value,
    currentLabel,
    onChange,
}) => {
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery('(min-width: 768px)')

    if (!currentLabel) currentLabel = 'Select an option...'

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between w-full">
                        {value ? (
                            <p>{value}</p>
                        ) : (
                            <p>{currentLabel}</p>
                        )}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search identification..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {Object.entries(availableOptions).map(([id, label]) => (
                                    <CommandItem
                                        key={id}
                                        value={label}
                                        onSelect={() => {
                                            onChange(id)
                                            setOpen(false)
                                        }}
                                    >
                                        {label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" className='w-full'>
                    {currentLabel}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mt-4 border-t">
                    <Command>
                        <CommandInput placeholder="Search identification..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {Object.entries(availableOptions).map((value, label) => (
                                    <CommandItem
                                        key={value}
                                        value={value}
                                        onSelect={() => {
                                            onChange(value)
                                            setOpen(false)
                                        }}
                                    >
                                        {label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            </DrawerContent>
        </Drawer>
    )
}