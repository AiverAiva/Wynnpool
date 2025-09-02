'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronsUpDown, Loader2, RotateCcw, X, GripVertical, Triangle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ItemTypeIcon } from '@/components/custom/WynnIcon'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { DualSlider } from '@/components/ui/dual-slider'
import { DndContext, closestCenter } from "@dnd-kit/core"
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities";
import api from '@/lib/api'
import { getIdentificationInfo } from '@/lib/itemUtils'

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

const restrictionOptions = [
    { value: 'untradable', label: 'Untradable' },
    { value: 'quest item', label: 'Quest Item' },
]

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
    const [nameQuery, setNameQuery] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTiers, setSelectedTiers] = useState<string[]>(tiers)
    const [levelRange, setLevelRange] = useState<[number, number]>([1, 106]);
    const [isLoading, setIsLoading] = useState(false)
    const [identifications, setIdentifications] = useState<string[]>([])
    const [selectedIdentifications, setSelectedIdentifications] = useState<string[]>([]);
    const [majorIds, setMajorIds] = useState<string[]>([])
    const [selectedMajorId, setselectedMajorId] = useState<string>('');
    const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
    const [identificationSortOrders, setIdentificationSortOrders] = useState<Record<string, 'asc' | 'desc'>>({});

    useEffect(() => {
        fetch('/api/item/metadata')
            .then((response) => response.json())
            .then((data) => {
                // console.log(data)
                const identificationsLabeled: any = {};
                setMajorIds(data.filters.majorIds || []);
                data.filters.identifications.forEach((identification: string) => {
                    const identificationInfo = getIdentificationInfo(identification);
                    let name = identificationInfo?.detailedName || identificationInfo?.displayName || identification;
                    identificationsLabeled[identification] = name;
                })
                setIdentifications(identificationsLabeled)
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

        const query: any = {
            $and: []
        };

        if (nameQuery.trim()) {
            query.$and.push({ id: { $regex: nameQuery.trim(), $options: 'i' } }); // Case-insensitive search for item name
        }

        const typeFilters = selectedTypes.map((selectedType) => {
            for (const [mainType, subTypes] of Object.entries(itemTypes)) {
                if (subTypes.includes(selectedType)) {
                    return { type: mainType, [`${mainType}Type`]: selectedType };
                }
            }
            return null;
        }).filter(Boolean); // Remove null values

        if (typeFilters.length > 0) {
            query.$and.push({ $or: typeFilters });
        }

        if (selectedTiers.length > 0) {
            query.$and.push({ rarity: { $in: selectedTiers } });
        }

        if (levelRange) {
            query.$and.push({ 'requirements.level': { $gte: levelRange[0], $lte: levelRange[1] } });
        }

        if (selectedMajorId) {
            query.$and.push({ [`majorIds.${selectedMajorId}`]: { $exists: true } });
        }

        if (selectedIdentifications.length > 0) {
            const identificationQueries = selectedIdentifications.map((id) => ({
                $or: [
                    { [`identifications.${id}`]: { $exists: true } }, // For numbers
                    { [`identifications.${id}.raw`]: { $exists: true } } // For objects with "raw"
                ]
            }));

            query.$and.push({ $or: identificationQueries });
        }

        if (selectedRestrictions.includes('untradable')) {
            query.$and.push({ restrictions: 'untradable' });
        }
        if (selectedRestrictions.includes('quest item')) {
            query.$and.push({ restrictions: 'quest item' });
        }

        console.log(query)
        try {
            const response = await fetch(api('/item/search'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(query),
            })

            if (!response.ok) {
                throw new Error('Failed to fetch results')
            }

            let data = await response.json()

            // Sort results by selectedIdentifications order and their sort order
            if (selectedIdentifications.length > 0 && Array.isArray(data)) {
                data = data.map((item: any) => {
                    item._identificationSort = selectedIdentifications.map(id => {
                        // Use .raw if available, else value
                        const val = item.identifications?.[id];
                        if (val && typeof val === 'object' && 'raw' in val) return val.raw;
                        return val ?? -Infinity;
                    });
                    return item;
                }).sort((a: any, b: any) => {
                    for (let i = 0; i < selectedIdentifications.length; i++) {
                        const id = selectedIdentifications[i];
                        const order = identificationSortOrders[id] || 'desc';
                        if (a._identificationSort[i] !== b._identificationSort[i]) {
                            return order === 'desc'
                                ? (b._identificationSort[i] - a._identificationSort[i])
                                : (a._identificationSort[i] - b._identificationSort[i]);
                        }
                    }
                    return 0;
                });
            }

            setResults(data)
        } catch (err) {
            setError('An error occurred while searching for items.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const clearFilters = () => {
        setNameQuery('');
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
                            value={nameQuery}
                            onChange={(e) => setNameQuery(e.target.value)}
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
                                <Button
                                    onClick={() => {
                                        const allSelected = types.every(type => selectedTypes.includes(type));
                                        setSelectedTypes(allSelected
                                            ? selectedTypes.filter(type => !types.includes(type))
                                            : [...selectedTypes, ...types.filter(type => !selectedTypes.includes(type))]
                                        );
                                    }}
                                    variant="secondary"
                                    className="h-6 w-full"
                                >
                                    {types.every(type => selectedTypes.includes(type)) ? 'None' : 'All'}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className='grid gap-2 w-fit'>
                        <div className='flex items-center justify-between'>
                            <Label>Rarity</Label>
                        </div>
                        <RarityTabs
                            options={tiers}
                            selectedOptions={selectedTiers}
                            onChange={setSelectedTiers}
                        />
                        <Button onClick={() => (selectedTiers.length === tiers.length ? setSelectedTiers([]) : setSelectedTiers(tiers))} variant="secondary" className='h-6 w-full'>
                            {selectedTiers.length === tiers.length ? 'None' : 'All'}
                        </Button>
                    </div>

                    {/* Restriction Tabs */}
                    <div className='grid gap-2 w-fit'>
                        <Label>Restriction</Label>
                        <RestrictionTabs
                            options={restrictionOptions}
                            selectedOptions={selectedRestrictions}
                            onChange={setSelectedRestrictions}
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
                        <Label className='text-xs text-muted-foreground'>currently not working due to breaking change of api, will be fixed</Label>
                        <div className='flex items-center gap-2'>
                            <ResponsiveComboBox
                                availableOptions={majorIds.reduce((acc: any, id: string) => {
                                    acc[id] = id;
                                    return acc;
                                }, {})}
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
                            identificationSortOrders={identificationSortOrders}
                            setIdentificationSortOrders={setIdentificationSortOrders}
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
    identificationSortOrders: Record<string, 'asc' | 'desc'>;
    setIdentificationSortOrders: React.Dispatch<React.SetStateAction<Record<string, 'asc' | 'desc'>>>;
}

const IdentificationBox: React.FC<IdentificationBoxProps> = ({
    availableIdentifications,
    selectedIdentifications,
    setSelectedIdentifications,
    identificationSortOrders,
    setIdentificationSortOrders,
}) => {
    const [identificationBoxes, setIdentificationBoxes] = useState<string[]>(['']);

    const addBox = () => {
        setIdentificationBoxes((prev) => [...prev, '']);
    };

    const removeBox = (index: number) => {
        setIdentificationBoxes((prev) => {
            const updated = [...prev];
            const removed = updated.splice(index, 1)[0];
            if (removed) {
                setSelectedIdentifications((prevSelected) =>
                    prevSelected.filter((id) => id !== removed)
                );
            }
            return updated;
        });
    };

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
    };

    const onDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = identificationBoxes.indexOf(active.id);
        const newIndex = identificationBoxes.indexOf(over.id);
        const reorderedBoxes = arrayMove(identificationBoxes, oldIndex, newIndex);

        setIdentificationBoxes(reorderedBoxes);
        setSelectedIdentifications((prev) => arrayMove(prev, oldIndex, newIndex));
    };

    return (
        <div className="space-y-4">
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={identificationBoxes} strategy={verticalListSortingStrategy}>
                    {identificationBoxes.map((value, index) => (
                        <IdentificationSortableItem
                            key={value || `box-${index}`}
                            id={value || `box-${index}`}
                            value={value}
                            index={index}
                            availableIdentifications={availableIdentifications}
                            selectedIdentifications={selectedIdentifications}
                            updateBox={updateBox}
                            removeBox={removeBox}
                            sortOrder={identificationSortOrders[value] || 'desc'}
                            toggleSortOrder={() => {
                                if (!value) return;
                                setIdentificationSortOrders(prev => ({
                                    ...prev,
                                    [value]: prev[value] === 'asc' ? 'desc' : 'asc',
                                }));
                            }}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {identificationBoxes.length < 5 && (
                <Button variant="ghost" onClick={addBox} className='w-full'>
                    + Add Identification
                </Button>
            )}
        </div>
    );
};

const IdentificationSortableItem = ({ id, value, index, availableIdentifications, selectedIdentifications, updateBox, removeBox, sortOrder, toggleSortOrder }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            <Button variant='ghost' {...attributes} {...listeners} className="px-2 cursor-grab" disabled={value == ''}>
                <GripVertical className="h-5 w-5 text-gray-500" />
            </Button>

            <ResponsiveComboBox
                availableOptions={Object.entries(availableIdentifications)
                    .filter(([id, label]) => !selectedIdentifications.includes(id) || id === value)
                    .reduce((acc, [id, label]) => ({ ...acc, [id]: label }), {})}
                value={availableIdentifications[value]}
                currentLabel="Select an Identification..."
                onChange={(val) => updateBox(val, index)}
            />

            {value && (
                <Button variant="outline" className="px-2" size="icon" onClick={toggleSortOrder}>
                    <Triangle className={cn("h-4 w-4", sortOrder === 'desc' ? 'rotate-180 text-primary' : 'text-primary')} />
                </Button>
            )}

            <Button variant="destructive" className="px-2" onClick={() => removeBox(index)}>
                <X className="h-8 w-8" />
            </Button>
        </div>
    );
};

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
                                        value={String(label)}
                                        onSelect={() => {
                                            onChange(id)
                                            setOpen(false)
                                        }}
                                    >
                                        {String(label)}
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
                    {value || currentLabel}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mt-4 border-t">
                    <Command>
                        <CommandInput placeholder="Search identification..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {Object.entries(availableOptions).map(([id, label]) => (
                                    <CommandItem
                                        key={id}
                                        value={String(label)}
                                        onSelect={() => {
                                            onChange(id)
                                            setOpen(false)
                                        }}
                                    >
                                        {String(label)}
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

interface RestrictionTabsProps {
    options: { value: string, label: string }[];
    selectedOptions: string[];
    onChange: (selected: string[]) => void;
}

function RestrictionTabs({ options, selectedOptions, onChange }: RestrictionTabsProps) {
    return (
        <div className="flex flex-wrap gap-2 p-1 bg-secondary rounded-md w-fit">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => {
                        const newSelected = selectedOptions.includes(option.value)
                            ? []
                            : [option.value];
                        onChange(newSelected)
                    }}
                    className={cn(
                        "px-2 py-1 rounded-md text-sm font-medium transition-colors",
                        selectedOptions.includes(option.value)
                            ? "bg-background text-primary"
                            : "bg-accent text-primary hover:dark:bg-background/30 hover:bg-primary/10"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}