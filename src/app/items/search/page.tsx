'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ItemTypeIcon } from '@/components/custom/WynnIcon'
import { ItemDisplay } from '@/components/custom/item-display'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import React from 'react'

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
        // <div className=' 
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

export default function ItemSearch() {
    const [query, setQuery] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTiers, setSelectedTiers] = useState<string[]>([])
    const [levelRange, setLevelRange] = useState<number[]>([1, 106])
    const [results, setResults] = useState<Record<string, any> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [identifications, setIdentifications] = useState<string[]>([])
    const [selectedIdentifications, setSelectedIdentifications] = useState<string[]>([]);
    const [majorIds, setMajorIds] = useState<string[]>([])
    const [selectedMajorId, setselectedMajorId] = useState<string>('');

    useEffect(() => {
        fetch('/api/items/metadata')
            .then((response) => response.json())
            .then((data) => {
                setIdentifications(data.identifications)
                setMajorIds(data.majorIds)
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
            const response = await fetch('/api/items/search', {
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
            console.log(data)
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

    const toggleAllRarities = () => {
        if (selectedTiers.length === tiers.length) {
            setSelectedTiers([]);
        } else {
            setSelectedTiers(tiers);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-screen-xl duration-150">
            <div className='w-full'>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Item Search (WIP)</CardTitle>
                        <CardDescription>Search for items using various criteria</CardDescription>
                    </CardHeader>
                    <CardContent className='lg:flex gap-4 w-full space-y-6 lg:space-y-0'>
                        <div className='w-[360px] md:w-full lg:w-2/5'>
                            <div className="space-y-6">
                                <div className='w-auto'>
                                    <Label htmlFor="query">Item Name</Label>
                                    <Input
                                        id="query"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Enter item name..."
                                    />
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    {Object.entries(itemTypes).map(([category, types]) => (
                                        <div key={category} className="mt-2">
                                            <h4 className="font-semibold mb-2 capitalize">{category}</h4>
                                            <MultiSelectTabs
                                                options={types}
                                                selectedOptions={selectedTypes}
                                                onChange={setSelectedTypes}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className='relative w-fit'>
                                    <div className="absolute right-0 top-0">
                                        <Button onClick={toggleAllRarities} variant="secondary" className='h-6 w-24'>
                                            {selectedTiers.length === tiers.length ? 'None' : 'All'}
                                        </Button>
                                    </div>
                                    <h4 className="font-semibold mb-2 capitalize">Rarity</h4>
                                    <RarityTabs
                                        options={tiers}
                                        selectedOptions={selectedTiers}
                                        onChange={setSelectedTiers}
                                    />
                                </div>
                                {/* <div>
                                    <Label>Level Range: {levelRange[0]} - {levelRange[1]}</Label>
                                    <Slider
                                        min={1}
                                        max={100}
                                        step={1}
                                        value={levelRange}
                                        onValueChange={setLevelRange}
                                    />
                                </div> */}
                            </div>
                        </div>
                        <div className='w-[360px] md:w-full lg:w-3/5 lg:flex-grow space-y-4'>
                            <div>
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
                                        onClick={() => setselectedMajorId('')}
                                        className="h-8 w-8"
                                    >
                                        ↻
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="query">Identifications</Label>
                                <IdentificationBox
                                    availableIdentifications={identifications}
                                    selectedIdentifications={selectedIdentifications}
                                    setSelectedIdentifications={setSelectedIdentifications}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Search
                        </Button>
                        <Button onClick={clearFilters} className="ml-2" variant="outline">
                            Clear Filters
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            {results && (
                <Card className="mt-4">
                    <CardHeader className='relative'>
                        <CardTitle>Search Results

                        </CardTitle>
                        <div className='absolute top-4 right-4'>
                            {Object.keys(results).length != 0 && (
                                <p className="text-center text-foreground/40 texts">{Object.keys(results).length} results found.</p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* <ScrollArea className="h-[400px]"> */}
                        {Object.keys(results).length == 0 && (
                            <p className="text-center">No results found.</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(results).map(([name, item]) => (
                                <ItemDisplay key={name} item={item} />
                            ))}
                        </div>
                        {/* <pre>{JSON.stringify(results, null, 2)}</pre> */}
                        {/* </ScrollArea> */}
                    </CardContent>
                </Card>
            )}
            {error && (
                <Card className="w-full max-w-4xl mx-auto mt-4 border-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-500">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            )}
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
            const updated = [...prev]
            const oldValue = updated[index]
            updated[index] = value

            if (oldValue) {
                setSelectedIdentifications((prevSelected) =>
                    prevSelected.filter((id) => id !== oldValue)
                )
            }

            if (value) {
                setSelectedIdentifications((prevSelected) => [...prevSelected, value])
            }

            return updated
        })
    }

    return (
        <div className="space-y-4">
            {identificationBoxes.map((value, index) => (
                <div key={index} className="flex items-center gap-4">
                    <ResponsiveComboBox
                        availableOptions={availableIdentifications.filter(
                            (id) => !selectedIdentifications.includes(id) || id === value
                        )}
                        value={value}
                        currentLabel='Select an Identification...'
                        onChange={(val) => updateBox(val, index)}
                    />
                    <Button
                        variant="destructive"
                        onClick={() => removeBox(index)}
                        className="h-8 w-8"
                    >
                        ✕
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
    availableOptions: string[]
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
                                {availableOptions.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => {
                                            onChange(option)
                                            setOpen(false)
                                        }}
                                    >
                                        {option}
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
                                {availableOptions.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => {
                                            onChange(option)
                                            setOpen(false)
                                        }}
                                    >
                                        {option}
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