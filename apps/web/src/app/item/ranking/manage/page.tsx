'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Search, User, Sword, Shield, Sparkles, Clock, RefreshCw, ChevronDown, Check, AlertCircle, Database } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import api from '@/lib/api'
import { ItemIcon } from '@/components/custom/WynnIcon'
import type { Item } from '@wynnpool/shared';
import SubmitRankingModal from '../submit-ranking-modal'

interface ItemEntry {
    _id: string
    itemName: string
    originalString: string
    owner: string
    timestamp: number
    identifications: Record<string, number>
    powderSlots?: number
    powders?: Array<{ element: number; tier: number }>
    rerollCount?: number
    shinyStat?: {
        key: string
        displayName: string
        value: number
        rerollCount: number
    }
    uuid: string
}

type ItemList = [string, Item][]

export default function ManagePage() {
    const [searchOwner, setSearchOwner] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [itemData, setItemData] = useState<ItemEntry[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const displayedItems = itemData.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    const [availableItems, setAvailableItems] = useState<Record<string, ItemList>>({})
    const [loading, setLoading] = useState(false)
    const [itemsLoading, setItemsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [permissionAlloewd, setPermissionAlloewd] = useState(false)
    const [modalOpen, setModalOpen] = useState(false);

    // Fetch available items on component mount
    useEffect(() => {
        fetch(api("/user/roles"), { credentials: "include" })
            .then(res => res.json())
            .then(data => setPermissionAlloewd(data.roles.includes("ITEM_DATABASE")))
            .catch(() => setPermissionAlloewd(false));

        const fetchAvailableItems = async () => {
            try {
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
                }

                const response = await fetch(api("/item/search"), {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(query),
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch items')
                }

                const data = await response.json()
                const categorized: Record<string, ItemList> = {}

                for (const [key, item] of Object.entries(data) as [string, Item][]) {
                    if (item.type === "weapon") {
                        const weaponCategory = item.weaponType || "other"
                        if (!categorized[weaponCategory]) categorized[weaponCategory] = []
                        categorized[weaponCategory].push([key, item])
                    } else if (item.type === "armour") {
                        if (!categorized["armour"]) categorized["armour"] = []
                        categorized["armour"].push([key, item])
                    }
                }

                setAvailableItems(categorized)
            } catch (err) {
                console.error("Error fetching items:", err)
                setError("Failed to load available items")
            } finally {
                setItemsLoading(false)
            }
        }

        fetchAvailableItems()
    }, [])

    // Load initial data on page load
    useEffect(() => {
        searchDatabase()
    }, [])

    const searchDatabase = async () => {
        setLoading(true)
        setError(null)

        try {
            const body: { owner?: string; itemName?: string } = {}
            if (searchOwner.trim()) body.owner = searchOwner.trim()
            if (selectedItem.trim()) body.itemName = selectedItem.trim()

            const response = await fetch(api("/item/database/search"), {
                method: "POST",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
            })

            if (!response.ok) {
                throw new Error('Failed to search database')
            }

            const data = await response.json()
            setItemData(Array.isArray(data) ? data : [])
            setPage(1)
        } catch (err) {
            console.error("Error searching database:", err)
            setError("Failed to search database. Please try again.")
            setItemData([])
        } finally {
            setLoading(false)
        }
    }

    const deleteDatabaseItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item from the database?')) return
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(api(`/item/database/${id}`), {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                const text = await response.text().catch(() => '')
                throw new Error(text || 'Failed to delete item')
            }

            const data = await response.json().catch(() => ({ success: true }))
            if (data && data.success === false) {
                throw new Error(data.message || 'Failed to delete item')
            }

            // remove locally without re-fetching
            setItemData((prev) => prev.filter((it) => it._id !== id))
        } catch (err) {
            console.error('Delete error:', err)
            setError((err as Error).message || 'Failed to delete item')
        } finally {
            setLoading(false)
        }
    }


    if (!permissionAlloewd) return (
        <div className="min-h-screen bg-background container mx-auto p-6 max-w-screen-lg ">
            <div className="mt-[80px]" />
            <div className="container mx-auto p-4 max-w-screen-xl">
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>You do not have permission to access this page.</AlertDescription>
                </Alert>
            </div>
        </div>
    )

    const clearFilters = () => {
        setSearchOwner('')
        setSelectedItem('')
        setPage(1)
        searchDatabase()
    }

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Keep page in range when data or pageSize changes
    // useEffect(() => {
    //     const maxPage = Math.max(1, Math.ceil(itemData.length / pageSize))
    //     if (page > maxPage) setPage(maxPage)
    // }, [itemData.length, pageSize])

    return (
        <div className="min-h-screen bg-background container mx-auto p-6 max-w-screen-lg ">
            <SubmitRankingModal open={modalOpen} onClose={() => setModalOpen(false)} />
            <div className="mt-[80px]" />
            <div className="container mx-auto p-4 max-w-screen-xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <Database className="h-8 w-8 text-primary" />
                        Item Database Manager
                    </h1>
                    <p className="text-muted-foreground">
                        Search and manage player item collections
                    </p>
                </div>

                {/* Search Controls */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search Filters
                        </CardTitle>
                        <CardDescription>
                            Filter items by player name and/or specific item type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Player Name Search */}
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    Player Name
                                </label>
                                <Input
                                    placeholder="Enter player name..."
                                    value={searchOwner}
                                    onChange={(e) => setSearchOwner(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchDatabase()}
                                />
                            </div>

                            {/* Item Selection */}
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                                    <Sword className="h-4 w-4" />
                                    Item Type
                                </label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between"
                                            disabled={itemsLoading}
                                        >
                                            {selectedItem
                                                ? selectedItem
                                                : "Select item..."}
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search items..." />
                                            <CommandList>
                                                <CommandEmpty>No items found.</CommandEmpty>
                                                {Object.entries(availableItems).map(([category, items]) => (
                                                    <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                                                        {items.map(([key, item]) => (
                                                            <CommandItem
                                                                key={key}
                                                                value={item.internalName}
                                                                onSelect={(currentValue) => {
                                                                    // console.log()
                                                                    setSelectedItem(item.internalName)
                                                                    setOpen(false)
                                                                }}
                                                            >
                                                                <ItemIcon item={item} size={30} />
                                                                {item.internalName}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                ))}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 sm:flex-col sm:justify-end">
                                <Button onClick={() => setModalOpen(true)}>
                                    + Submit Item
                                </Button>
                                <Button onClick={searchDatabase} disabled={loading} className="flex-1 sm:flex-none">
                                    {loading ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="mr-2 h-4 w-4" />
                                    )}
                                    Search
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none"
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="w-full p-0">
                            <div className="w-full flex flex-row items-center justify-between gap-2">
                                {/* Search Results (left/top) */}
                                <div className="order-1">
                                    <div className="flex items-center gap-3">
                                        <span>Search Results</span>
                                        <Badge variant="secondary">{loading ? "Loading..." : `${itemData.length} items found`}</Badge>
                                    </div>
                                </div>



                                {/* Refresh (right/top) */}
                                <div className="order-3 flex items-center justify-end">
                                    <Button onClick={searchDatabase} disabled={loading} size="sm" variant="ghost">
                                        {loading ? (
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                            {/* Paginator (center/top) */}
                            <div className="order-2 flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Prev
                                    </Button>
                                    <div className="text-sm text-muted-foreground">Page {itemData.length === 0 ? 0 : page} of {Math.max(1, Math.ceil(itemData.length / pageSize))}</div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.min(Math.ceil(itemData.length / pageSize) || 1, p + 1))}
                                        disabled={page >= Math.ceil(itemData.length / pageSize) || itemData.length === 0}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : itemData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No items found matching your search criteria.</p>
                                <p className="text-sm">Try adjusting your filters or clearing them to see all items.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Owner</TableHead>
                                                <TableHead>Date Added</TableHead>
                                                <TableHead>Operation</TableHead>

                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayedItems.map((item) => (
                                                <TableRow key={item._id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                <div className="font-medium flex items-center gap-1">
                                                                    {item.itemName}
                                                                    {item.shinyStat && (
                                                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                                                    )}
                                                                </div>
                                                                {item.shinyStat && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {item.shinyStat.displayName}: {item.shinyStat.value}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className='flex gap-2 items-center'>
                                                        <img
                                                            src={`https://www.mc-heads.net/avatar/${item.owner}`}
                                                            alt={item.owner}
                                                            className="w-6 h-6 rounded-sm"
                                                        />
                                                        {item.owner}
                                                        {/* <Badge variant="outline"></Badge> */}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            {formatTimestamp(item.timestamp)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className='space-x-2'>
                                                        <TooltipProvider delayDuration={0}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button className='h-6' variant="secondary" disabled={loading}>
                                                                        View
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="max-w-xl p-2">
                                                                    <pre className="max-h-64 overflow-auto text-xs whitespace-pre-wrap">
                                                                        {JSON.stringify(item, null, 2)}
                                                                    </pre>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <Button className='h-6' variant="destructive" onClick={() => deleteDatabaseItem(item._id)} disabled={loading}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}