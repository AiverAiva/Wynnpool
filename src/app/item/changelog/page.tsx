"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, MinusCircle, RefreshCw, ChevronDown, ChevronRight, Search, X } from "lucide-react"
import api from "@/utils/api"
import { ItemDisplay } from "@/components/wynncraft/item/ItemDisplay"
import { Spinner } from "@/components/ui/spinner"
import ModifiedItemDisplay from "@/components/wynncraft/item/ModifiedItemDisplay"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ChangelogData {
  add?: any[]
  modify?: any[]
  remove?: any[]
}

// Item rarity colors
const tiersColors = {
  common: "#e2e8f0",
  set: "#55ff55",
  unique: "#ffff55",
  rare: "#ff55ff",
  legendary: "#55ffff",
  fabled: "#ff5555",
  mythic: "#aa00aa",
}

const tiers = Object.keys(tiersColors)

// Ingredient tiers
const ingredientTiers = [0, 1, 2, 3]

// Helper function to get the appropriate color for item tier
export default function ChangelogPage() {
  const [changelogTimestamps, setChangelogTimestamps] = useState<number[]>([])
  const [selectedTab, setSelectedTab] = useState<string | null>(null)
  const [changelogData, setChangelogData] = useState<ChangelogData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<"add" | "modify" | "remove", boolean>>({
    add: false,
    modify: false,
    remove: false,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [itemTypeFilter, setItemTypeFilter] = useState<"combat" | "ingredient">("combat")
  const [rarityFilters, setRarityFilters] = useState<string[]>([])

  const toggleSection = (section: "add" | "modify" | "remove") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setItemTypeFilter("combat")
    setRarityFilters([])
  }

  // Toggle a rarity filter
  const toggleRarityFilter = (rarity: string) => {
    setRarityFilters((prev) => (prev.includes(rarity) ? prev.filter((r) => r !== rarity) : [...prev, rarity]))
  }

  // Fetch list of available timestamps
  useEffect(() => {
    const fetchChangelogList = async () => {
      try {
        const response = await fetch(api("/item/changelog/list"))
        if (!response.ok) throw new Error("Failed to fetch changelog timestamps")

        const data: number[] = await response.json()
        setChangelogTimestamps(data)

        if (data.length > 0) {
          setSelectedTab(String(data[0])) // Auto-select latest
        }
      } catch (error) {
        console.error("Error fetching changelog list:", error)
      }
    }

    fetchChangelogList()
  }, [])

  // Fetch changelog data when a timestamp is selected
  useEffect(() => {
    if (!selectedTab) return

    const fetchChangelogData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(api(`/item/changelog/${selectedTab}`))
        if (!response.ok) throw new Error("Failed to fetch changelog data")

        const data: ChangelogData = await response.json()
        setChangelogData(data)
      } catch (error) {
        console.error("Error fetching changelog data:", error)
        setChangelogData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChangelogData()
  }, [selectedTab])

  const formatDate = (timestamp: number, isLatest: boolean) => {
    return `${new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })} ${isLatest ? "(Latest)" : ""}`
  }

  // Filter items based on search term, item type, and rarity
  const filterItems = (items: any[] | undefined) => {
    if (!items) return []

    return items.filter((item) => {
      // Get the item data (either the item itself or the "after" property for modified items)
      const itemData = item.after || item

      // Search filter
      const matchesSearch = searchTerm === "" || itemData.internalName.toLowerCase().includes(searchTerm.toLowerCase())

      // Item type filter
      let matchesType = true
      if (itemTypeFilter === "combat") {
        matchesType = ["weapon", "armour", "accessory", "tome", "charm"].includes(itemData.type)
      } else if (itemTypeFilter === "ingredient") {
        matchesType = itemData.type === "ingredient"
      }

      // Rarity filter - if no rarities selected, show all
      let matchesRarity = rarityFilters.length === 0

      if (!matchesRarity) {
        if (itemTypeFilter === "ingredient" || itemData.type === "ingredient") {
          // For ingredients, filter by tier
          matchesRarity = rarityFilters.includes(String(itemData.tier))
        } else {
          // For combat items, filter by rarity
          matchesRarity = rarityFilters.includes(itemData.rarity)
        }
      }

      return matchesSearch && matchesType && matchesRarity
    })
  }

  // Get filtered items for each section
  const filteredAdd = filterItems(changelogData?.add)
  const filteredModify = filterItems(changelogData?.modify)
  const filteredRemove = filterItems(changelogData?.remove)

  return (
    <div className="container mx-auto p-4 max-w-screen-xl duration-150">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Item Changelog</CardTitle>
          <CardDescription>Track changes to items across game updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab || ""} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap">
              {changelogTimestamps.map((timestamp, index) => (
                <TabsTrigger key={timestamp} value={String(timestamp)}>
                  {formatDate(timestamp, index === 0)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedTab || ""}>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Spinner className="h-16 w-16" />
                </div>
              ) : changelogData ? (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search items..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" onClick={resetFilters} className="gap-1">
                        <X className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Item Type</h3>
                        <div className="flex gap-2">
                          <Button
                            variant={itemTypeFilter === "combat" ? "default" : "outline"}
                            onClick={() => {
                              setItemTypeFilter("combat")
                              setRarityFilters([])
                            }}
                            size="sm"
                          >
                            Combat Items
                          </Button>
                          <Button
                            variant={itemTypeFilter === "ingredient" ? "default" : "outline"}
                            onClick={() => {
                              setItemTypeFilter("ingredient")
                              setRarityFilters([])
                            }}
                            size="sm"
                          >
                            Ingredients
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Rarity</h3>
                        <div className="flex flex-wrap gap-2">
                          {itemTypeFilter === "combat"
                            ? tiers.map((tier) => (
                                <Button
                                  key={tier}
                                  variant={rarityFilters.includes(tier) ? "default" : "outline"}
                                  onClick={() => toggleRarityFilter(tier)}
                                  size="sm"
                                  className="capitalize"
                                  style={{
                                    color: rarityFilters.includes(tier)
                                      ? "white"
                                      : tiersColors[tier as keyof typeof tiersColors],
                                    borderColor: tiersColors[tier as keyof typeof tiersColors],
                                    backgroundColor: rarityFilters.includes(tier)
                                      ? tiersColors[tier as keyof typeof tiersColors]
                                      : "transparent",
                                  }}
                                >
                                  {tier}
                                </Button>
                              ))
                            : ingredientTiers.map((tier) => (
                                <Button
                                  key={`tier-${tier}`}
                                  variant={rarityFilters.includes(String(tier)) ? "default" : "outline"}
                                  onClick={() => toggleRarityFilter(String(tier))}
                                  size="sm"
                                >
                                  Tier {tier}
                                </Button>
                              ))}
                        </div>
                      </div>
                    </div>

                    {rarityFilters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {rarityFilters.map((filter) => (
                          <Badge
                            key={filter}
                            variant="secondary"
                            className="gap-1 cursor-pointer"
                            onClick={() => toggleRarityFilter(filter)}
                          >
                            {itemTypeFilter === "ingredient" ? `Tier ${filter}` : filter}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section Component */}
                  {(["add", "modify", "remove"] as const).map((section) => {
                    const items =
                      section === "add" ? filteredAdd : section === "modify" ? filteredModify : filteredRemove

                    if (!items || items.length === 0) return null

                    const colors = {
                      add: "green",
                      modify: "blue",
                      remove: "red",
                    }

                    const icons = {
                      add: <PlusCircle className={`mr-2 h-5 w-5 text-${colors[section]}-500`} />,
                      modify: <RefreshCw className={`mr-2 h-5 w-5 text-${colors[section]}-500`} />,
                      remove: <MinusCircle className={`mr-2 h-5 w-5 text-${colors[section]}-500`} />,
                    }

                    // Set column layout dynamically
                    const gridClass =
                      section === "modify"
                        ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"

                    // Get total count (before filtering)
                    const totalCount = changelogData?.[section]?.length || 0
                    const filteredCount = items.length

                    return (
                      <div key={section} className="border border-accent rounded-lg overflow-hidden">
                        {/* Header */}
                        <div
                          className="flex items-center justify-between p-4 bg-background hover:bg-accent transition cursor-pointer"
                          onClick={() => toggleSection(section)}
                        >
                          <div className="flex items-center text-lg font-semibold">
                            {expandedSections[section] ? (
                              <ChevronDown className="mr-2 h-5 w-5" />
                            ) : (
                              <ChevronRight className="mr-2 h-5 w-5" />
                            )}
                            {icons[section]}
                            {section.charAt(0).toUpperCase() + section.slice(1)} Items
                            <Badge variant="outline" className="ml-2">
                              {filteredCount}
                              {filteredCount !== totalCount && ` / ${totalCount}`}
                            </Badge>
                          </div>
                        </div>

                        {/* Content (Animated) */}
                        <motion.div
                          initial={false}
                          animate={{ height: expandedSections[section] ? "auto" : 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className={`${gridClass} p-4 bg-background`}>
                            {items.map((item, index) => (
                              <Card key={index} className={`border-l-4 border-${colors[section]}-500`}>
                                {section === "modify" ? (
                                  <ModifiedItemDisplay modifiedItem={item} />
                                ) : (
                                  <ItemDisplay item={item} />
                                )}
                              </Card>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p>No data available for this update.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

