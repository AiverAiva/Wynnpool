import DeprecatedRedirect from "@/components/page/deprecated-redirect";

export default function Page() {
  return <DeprecatedRedirect redirectTo="/raidpool/" />
}

// 'use client'

// import { useState, useEffect } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Spinner } from "@/components/ui/spinner"
// import Image from 'next/image'
// import Countdown from '@/components/custom/countdown'
// import { Button } from '@/components/ui/button'
// import Link from 'next/link'
// import api from '@/lib/api'
// import { Aspect } from '@/types/aspectType'

// type LootCategory = 'Mythic' | 'Fabled' | 'Legendary'
// type LootSection = 'TNA' | 'TCC' | 'NOL' | 'NOTG'

// interface LootData {
//   Loot: Record<LootSection, Record<LootCategory, string[]>>
//   Icon: Record<string, string>
//   Timestamp: number
// }

// function renderTierHighlight(aspect: Aspect, currentTierKey?: string, showHint = true) {
//   const tierKeys = Object.keys(aspect.tiers || {}).sort((a, b) => Number(a) - Number(b))

//   if (!tierKeys.length) {
//     return null
//   }

//   const effectiveTierKey = currentTierKey && tierKeys.includes(currentTierKey)
//     ? currentTierKey
//     : tierKeys[0]
//   const currentTier = aspect.tiers[effectiveTierKey]

//   if (!currentTier) {
//     return null
//   }

//   return (
//     <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2 text-xs">
//       <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
//         <span>Tier {effectiveTierKey} of {tierKeys.length}</span>
//         <span className="text-[10px]">Threshold: {currentTier.threshold}</span>
//       </div>
//       <div className="space-y-1">
//         {currentTier.description.map((desc, idx) => (
//           <div
//             key={idx}
//             className="leading-snug text-[12px]"
//             dangerouslySetInnerHTML={{ __html: desc }}
//           />
//         ))}
//       </div>
//       {showHint && tierKeys.length > 1 && (
//         <p className="text-[11px] text-muted-foreground mt-2 italic">Click to switch tier</p>
//       )}
//     </div>
//   )
// }


// export default function AspectPool() {
//   const [lootData, setLootData] = useState<LootData | null>(null)
//   const [aspectData, setAspectData] = useState<Record<string, Aspect[]>>({})
//   const [aspectLookup, setAspectLookup] = useState<Record<string, Aspect>>({})
//   const [countdown, setCountdown] = useState<number | null>(null);
//   const [isLoading, setIsLoading] = useState(true)
//   const [selectedClass, setSelectedClass] = useState<string>('Archer')
//   const [sortBy, setSortBy] = useState<'rarity' | 'raid'>('rarity')
//   const [openTooltips, setOpenTooltips] = useState<{ [key: string]: boolean }>({});
//   const [filterTooltips, setFilterTooltips] = useState<{ [key: string]: boolean }>({});
//   const [hoveredRowAspect, setHoveredRowAspect] = useState<Aspect | null>(null);
//   const [aspectTierSelection, setAspectTierSelection] = useState<Record<string, number>>({})
//   const formatClassLabel = (value: string) => value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : value

//   useEffect(() => {
//     setIsLoading(true)
//     Promise.all([
//       fetch(api('/aspect-pool')).then(response => response.json()),
//       fetch(api('/aspect/list')).then(response => response.json())
//     ])
//       .then(([lootData, aspects]: [LootData, Aspect[]]) => {
//         const grouped = aspects.reduce<Record<string, Aspect[]>>((acc, aspect) => {
//           const className = aspect.requiredClass || 'Unknown'
//           if (!acc[className]) acc[className] = []
//           acc[className].push(aspect)
//           return acc
//         }, {})
//         const lookup = aspects.reduce<Record<string, Aspect>>((acc, aspect) => {
//           acc[aspect.name] = aspect
//           return acc
//         }, {})

//         setLootData(lootData)
//         setAspectData(grouped)
//         setAspectLookup(lookup)
//         setIsLoading(false)
//       })
//       .catch(error => {
//         console.error('Error fetching data:', error)
//         setIsLoading(false)
//       })
//   }, [])

//   const getSortedTierKeys = (aspect: Aspect) => Object.keys(aspect.tiers || {}).sort((a, b) => Number(a) - Number(b))

//   const getAspectTierKey = (aspect: Aspect) => {
//     const tierKeys = getSortedTierKeys(aspect)
//     if (!tierKeys.length) return undefined
//     const storedIndex = aspectTierSelection[aspect.name] ?? 0
//     const normalizedIndex = storedIndex % tierKeys.length
//     return tierKeys[normalizedIndex]
//   }

//   const cycleTier = (aspect: Aspect) => {
//     const tierKeys = getSortedTierKeys(aspect)
//     if (!tierKeys.length) return
//     setAspectTierSelection((prev) => {
//       const currentIndex = prev[aspect.name] ?? 0
//       const nextIndex = (currentIndex + 1) % tierKeys.length
//       return {
//         ...prev,
//         [aspect.name]: nextIndex,
//       }
//     })
//   }

//   const handleAspectClick = (aspect: Aspect, source: 'grid' | 'filter' = 'grid') => {
//     const tierKeys = getSortedTierKeys(aspect)
//     if (!tierKeys.length) return
//     cycleTier(aspect)
//     if (source === 'filter') {
//       setOpenTooltips((prevState) => ({
//         ...prevState,
//         [aspect.name]: false,
//       }))
//       setFilterTooltips((prevState) => ({
//         ...prevState,
//         [aspect.name]: true,
//       }))
//     } else {
//       setOpenTooltips((prevState) => ({
//         ...prevState,
//         [aspect.name]: true,
//       }))
//       setFilterTooltips((prevState) => ({
//         ...prevState,
//         [aspect.name]: false,
//       }))
//     }
//   }

//   useEffect(() => {
//     const classes = Object.keys(aspectData)
//     if (classes.length && !classes.includes(selectedClass)) {
//       setSelectedClass(classes[0])
//     }
//   }, [aspectData, selectedClass])

//   useEffect(() => {
//     if (lootData) {
//       // Calculate next Friday 17:00 GMT+0 after lootData.Timestamp
//       const timestampDate = new Date(lootData.Timestamp * 1000);
//       let nextFriday = new Date(timestampDate);
//       nextFriday.setUTCHours(17, 0, 0, 0); // 17:00:00 GMT+0
//       const dayOfWeek = nextFriday.getUTCDay();
//       let daysToAdd = (5 - dayOfWeek + 7) % 7;
//       if (daysToAdd === 0 && timestampDate.getUTCHours() >= 17) {
//         daysToAdd = 7; // If it's already Friday after 5PM, go to next week
//       }
//       nextFriday.setUTCDate(nextFriday.getUTCDate() + daysToAdd);
//       const nextUpdate = Math.floor(nextFriday.getTime() / 1000);
//       setCountdown(nextUpdate);
//     }
//   }, [lootData]);

//   const aspectToClassName = Object.entries(aspectData).reduce((acc, [className, aspects]) => {
//     aspects.forEach((aspect) => {
//       acc[aspect.name] = className;
//     });
//     return acc;
//   }, {} as { [aspectName: string]: string });

//   if (isLoading) return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
//   if (!lootData || Object.keys(aspectData).length === 0) return <div>Error loading data. Please try again later.</div>

//   const rarityOrder: LootCategory[] = ['Mythic', 'Fabled', 'Legendary']
//   const raidOrder: LootSection[] = ['TNA', 'TCC', 'NOL', 'NOTG']

//   const availableAspects = Object.entries(lootData.Loot).reduce((acc, [section, categories]) => {
//     const aspectNamesSet = new Set(acc.map(aspect => aspect.name)); // Create a Set from existing aspect names

//     Object.entries(categories).forEach(([rarity, aspects]) => {
//       aspects.forEach((aspect) => {
//         const matchedAspect = aspectLookup[aspect];
//         if (matchedAspect?.requiredClass === selectedClass && !aspectNamesSet.has(aspect)) {
//           aspectNamesSet.add(aspect);
//           acc.push({
//             name: aspect,
//             section: section as LootSection,
//             rarity: rarity as LootCategory,
//             description: matchedAspect.description,
//             className: matchedAspect.requiredClass,
//           });
//         }
//       });
//     });

//     return acc;
//   }, [] as { name: string; section: LootSection; rarity: LootCategory; description?: string; className: string }[]);

//   // Sort the list based on the selected sort criteria
//   availableAspects.sort((a, b) => {
//     if (sortBy === 'rarity') {
//       return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
//     } else {
//       return raidOrder.indexOf(a.section) - raidOrder.indexOf(b.section)
//     }
//   })

//   const hoveredTierKey = hoveredRowAspect ? getAspectTierKey(hoveredRowAspect) : undefined

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="mt-[80px]" />
//       <main className="container mx-auto p-6 max-w-screen-lg duration-150">
//         {lootData && aspectData && (
//           <>
//             <h1 className="text-4xl font-bold mb-4">Aspect Pool</h1>
//             <Card className="mb-4 relative">
//               <CardHeader className="flex justify-center items-center">
//                 <CardTitle>Next Update In</CardTitle>
//               </CardHeader>
//               <CardContent className="flex justify-center items-center">
//                 <Countdown targetTimestamp={countdown} endText="Data outdated, waiting for update..." />
//               </CardContent>
//               <Link href="/aspects/history" legacyBehavior passHref>
//                 <Button className="absolute top-4 right-4 rounded-full">
//                   History
//                 </Button>
//               </Link>
//             </Card>
//             <Tabs defaultValue="TNA">
//               <TabsList className="grid w-full grid-cols-4">
//                 {Object.keys(lootData.Loot).map((section) => (
//                   <TabsTrigger key={section} value={section}>{section}</TabsTrigger>
//                 ))}
//               </TabsList>
//               {Object.entries(lootData.Loot).map(([section, categories]) => (
//                 <TabsContent key={section} value={section}>
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>{section} Loot</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       {Object.entries(categories).map(([category, items]) => (
//                         <div key={category} className="mb-4">
//                           <h3 className="text-xl font-semibold mb-2">{category}</h3>
//                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             <TooltipProvider delayDuration={50}>
//                               {items.map((item) => {
//                                 const aspectInfo = Object.values(aspectData).flat().find(aspect => aspect.name === item);
//                                 const className = aspectToClassName[item] || aspectInfo?.requiredClass;
//                                 const currentTierKey = aspectInfo ? getAspectTierKey(aspectInfo) : undefined;

//                                 return (
//                                   <Tooltip key={item} open={openTooltips[item]} onOpenChange={(isOpen) => setOpenTooltips((prev) => ({ ...prev, [item]: isOpen }))}>
//                                     <TooltipTrigger asChild>
//                                       <button
//                                         type="button"
//                                         onClick={() => aspectInfo && handleAspectClick(aspectInfo, 'grid')}
//                                         className="flex items-center justify-start space-x-2 rounded-lg bg-card/50 text-sm font-medium hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
//                                       >
//                                         {className ? (
//                                           <Image
//                                             unoptimized
//                                             src={`/icons/aspects/${className.toLowerCase()}.png`}
//                                             alt={`${className} aspect icon`}
//                                             width={16}
//                                             height={16}
//                                             className="w-8 h-8 [image-rendering:pixelated]"
//                                           />
//                                         ) : (
//                                           <Image
//                                             unoptimized
//                                             src="/icons/items/barrier.webp"
//                                             alt={item}
//                                             width={16}
//                                             height={16}
//                                             className="w-8 h-8 [image-rendering:pixelated]"
//                                           />
//                                         )}

//                                         <span>{item}</span>
//                                       </button>
//                                     </TooltipTrigger>
//                                     {aspectInfo && (
//                                       <TooltipContent side="top" align="center" sideOffset={10} className="p-0">
//                                         <div className="bg-popover rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px]">
//                                           <p className="font-bold text-base mb-2">{aspectInfo.name}</p>
//                                           {renderTierHighlight(aspectInfo, currentTierKey)}
//                                         </div>
//                                       </TooltipContent>
//                                     )}
//                                   </Tooltip>
//                                 );
//                               })}
//                             </TooltipProvider>
//                           </div>
//                         </div>
//                       ))}
//                     </CardContent>
//                   </Card>
//                 </TabsContent>
//               ))}
//             </Tabs>
//           </>
//         )}
//         <Card className="mt-4">
//           <TooltipProvider delayDuration={50}>
//             <table className="min-w-full divide-y">
//               <thead>
//                 <tr>
//                   <th className='hidden md:block'></th>
//                   <th className="py-2">
//                     <div className='flex gap-4 flex-wrap items-center justify-center'>
//                       <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'rarity' | 'raid')}>
//                         <TabsList>
//                           <TabsTrigger value="rarity">Sort by Rarity</TabsTrigger>
//                           <TabsTrigger value="raid">Sort by Raid</TabsTrigger>
//                         </TabsList>
//                       </Tabs>
//                       <Tabs value={selectedClass} onValueChange={setSelectedClass}>
//                         <TabsList>
//                           {Object.keys(aspectData).map((className) => (
//                             <TabsTrigger key={className} value={className}>
//                               {formatClassLabel(className)}
//                             </TabsTrigger>
//                           ))}
//                         </TabsList>
//                       </Tabs>
//                     </div>
//                   </th>
//                   <th className="px-4 py-2">Raid</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y">
//                 {availableAspects.map(({ name, section, rarity, description, className }) => {
//                   const tableAspect = aspectLookup[name] ?? null
//                   const tableTierKey = tableAspect ? getAspectTierKey(tableAspect) : undefined

//                   return (
//                     <tr key={`${name}-${section}`}>
//                       <td className="px-4 py-2 hidden md:block">
//                         <Image
//                           unoptimized
//                           src={`/icons/aspects/${className.toLowerCase()}.png`}
//                           alt={`${className} aspect icon`}
//                           width={16}
//                           height={16}
//                           className="w-12 h-12 [image-rendering:pixelated]"
//                         />
//                       </td>
//                       <td className="px-4 py-1">
//                         <Tooltip
//                           key={`${name}-tooltip`}
//                           open={filterTooltips[name]}
//                           onOpenChange={(isOpen) => setFilterTooltips((prev) => ({ ...prev, [name]: isOpen }))}
//                         >
//                           <TooltipTrigger asChild>
//                             <Badge
//                               onClick={() => tableAspect && handleAspectClick(tableAspect, 'filter')}
//                               onMouseEnter={() => tableAspect && setHoveredRowAspect(tableAspect)}
//                               onMouseLeave={() => setHoveredRowAspect(null)}
//                               onTouchStart={() => tableAspect && setHoveredRowAspect(tableAspect)}
//                               onTouchEnd={() => setHoveredRowAspect(null)}
//                               onTouchCancel={() => setHoveredRowAspect(null)}
//                               className={`ml-2 mt-2 ${rarity === 'Fabled' ? 'bg-rose-500' :
//                                 rarity === 'Legendary' ? 'bg-cyan-400' :
//                                   'bg-fuchsia-700'
//                                 } text-white text-sm font-thin cursor-pointer`}
//                             >
//                               {name}
//                             </Badge>
//                           </TooltipTrigger>
//                           {tableAspect && (
//                             <TooltipContent side="top" align="center" sideOffset={10} className="p-0">
//                               <div className="bg-popover rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px]">
//                                 <p className="font-bold text-base mb-2">{tableAspect.name}</p>
//                                 {renderTierHighlight(tableAspect, tableTierKey)}
//                               </div>
//                             </TooltipContent>
//                           )}
//                         </Tooltip>
//                         <br />
//                         <p className="px-4 py-1 text-sm">{description}</p>
//                       </td>
//                       <td className="px-4 py-2 text-center">
//                         {section}
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </TooltipProvider>
//         </Card>
//       </main>
//     </div>
//   )
// }