// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import { ScrollArea } from "@/components/ui/scroll-area"

// interface ItemData {
//   internalName: string
//   type: string
//   attackSpeed?: string
//   averageDps?: number
//   requirements: {
//     level: number
//     classRequirement?: string
//     [key: string]: number | string | undefined
//   }
//   majorIds: {
//     [key: string]: string
//   }
//   lore?: string
//   identifications: {
//     [key: string]: number | { min: number; raw: number; max: number }
//   }
//   base: {
//     baseDamage: {
//       min: number
//       raw: number
//       max: number
//     }
//   }
//   rarity: string
// }

// interface ItemDisplayProps {
//   item: ItemData
// }

// export function ItemDisplay({ item }: ItemDisplayProps) {
//   const getRarityColor = (rarity: string) => {
//     const colors: { [key: string]: string } = {
//       normal: "bg-gray-500",
//       unique: "bg-yellow-500",
//       rare: "bg-blue-500",
//       legendary: "bg-purple-500",
//       fabled: "bg-red-500",
//       mythic: "bg-pink-500"
//     }
//     return colors[rarity.toLowerCase()] || "bg-gray-500"
//   }

//   return (
//     <Card className="w-full max-w-2xl mx-auto">
//       <CardHeader>
//         <div className="flex justify-between items-center">
//           <CardTitle className="text-2xl font-bold">{item.internalName}</CardTitle>
//           <Badge className={`${getRarityColor(item.rarity)} text-white`}>
//             {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
//           </Badge>
//         </div>
//         <CardDescription>
//           {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
//           {item.attackSpeed && ` - ${item.attackSpeed.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ScrollArea className="h-[600px] pr-4">
//           <div className="space-y-4">
//             {item.averageDps && (
//               <div>
//                 <h3 className="font-semibold">Average DPS</h3>
//                 <p>{item.averageDps}</p>
//               </div>
//             )}

//             <div>
//               <h3 className="font-semibold">Requirements</h3>
//               <ul className="list-disc list-inside">
//                 {Object.entries(item.requirements).map(([key, value]) => (
//                   <li key={key}>
//                     {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {Object.keys(item.majorIds).length > 0 && (
//               <div>
//                 <h3 className="font-semibold">Major IDs</h3>
//                 {Object.entries(item.majorIds).map(([key, value]) => (
//                   <div key={key} dangerouslySetInnerHTML={{ __html: value }} />
//                 ))}
//               </div>
//             )}

//             <div>
//               <h3 className="font-semibold">Lore</h3>
//               <p className="italic text-muted-foreground">{item.lore}</p>
//             </div>

//             <Separator />

//             <div>
//               <h3 className="font-semibold">Identifications</h3>
//               <ul className="list-disc list-inside">
//                 {Object.entries(item.identifications).map(([key, value]) => (
//                   <li key={key}>
//                     {key.replace(/([A-Z])/g, ' $1').trim()}:{' '}
//                     {typeof value === 'number' 
//                       ? value 
//                       : `${value.min} to ${value.max} (Base: ${value.raw})`}
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h3 className="font-semibold">Base Damage</h3>
//               <p>{item.base.baseDamage.min} to {item.base.baseDamage.max} (Base: {item.base.baseDamage.raw})</p>
//             </div>
//           </div>
//         </ScrollArea>
//       </CardContent>
//     </Card>
//   )
// }
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getIdentificationInfo, IngredientItem, Item } from "@/types/itemType"
import Image from 'next/image'
import '@/assets/css/wynncraft.css'
import { FC } from "react"

interface ItemDisplayProps {
  item: Item
}

const SmallItemCard: React.FC<ItemDisplayProps> = ({ item }) => {
  return (
    <Card className='w-full flex h-12 items-center gap-4 hover:bg-accent/60 transition-colors cursor-pointer p-1.5 px-3 rounded-md mb-2'>
      <ItemIcon item={item} />
      <span key={item.internalName} className='text-md font-mono'>{item.internalName}</span>
    </Card>
  )
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item }) => {
  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      common: "bg-common",
      set: "bg-set",
      unique: "bg-unique",
      rare: "bg-rare",
      legendary: "bg-legendary",
      fabled: "bg-fabled",
      mythic: "bg-mythic",
    };
    return colors[rarity.toLowerCase()] || "bg-gray-500";
  };

  const rarityTextColor = {
    common: 'text-common',
    set: 'text-set',
    unique: 'text-unique',
    rare: 'text-rare',
    legendary: 'text-legendary',
    fabled: 'text-fabled',
    mythic: 'text-mythic',
  };

  if (item.type == 'ingredient') {
    return <span className="text-3xl">incompleted atm :D</span>
  }
  if (item.type == 'weapon' || item.type === 'armour') {
    return (
      <Card className="w-full max-w-2xl mx-auto h-fit">
        <CardHeader>
          <div className="flex justify-center items-center">
            <ItemIcon item={item} size={64} />
          </div>
          <div className="flex justify-center items-center">
            <CardTitle className={`text-xl font-bold ${rarityTextColor[item.rarity]}`}>{item.internalName}</CardTitle>
          </div>
          <div className="flex justify-center items-center">
            <Badge className={`${getRarityColor(item.rarity)}`}>
              <p className={`${rarityTextColor[item.rarity]} brightness-[.3]`}>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} Item</p>
            </Badge>
          </div>

          {item.attackSpeed && (
            <CardDescription>
              <div className="flex justify-center items-center">
                {`${item.attackSpeed.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Attack Speed`}
              </div>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* <ScrollArea className="h-[600px] pr-4"> */}
          <div className="space-y-4">
            {/* {item.averageDps && (
                <div>
                  <h3 className="font-semibold">Average DPS</h3>
                  <p>{item.averageDps}</p>
                </div>
              )} */}
            {item.base && (
              <ul className="list-disc list-inside">
                {Object.entries(item.base).map(([key, value]) => (
                  <div key={key} className="flex">
                    {typeof value === 'number' ? (
                      <>
                        <h4 className="font-semibold">{getIdentificationInfo(key)?.displayName}</h4>{value}
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold">{getIdentificationInfo(key)?.displayName}</h4>{value.min}~{value.max}
                      </>
                    )}

                  </div>
                ))}
              </ul>
            )}
            {item.requirements && (
              <ul className="list-disc list-inside">
                {Object.entries(item.requirements).map(([key, value]) => {
                  let displayValue;
                  if (typeof value === 'string' || typeof value === 'number') {
                    displayValue = value;
                  } else if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  } else if (typeof value === 'object' && value !== null) {
                    displayValue = `${value.min} - ${value.max}`;
                  } else {
                    displayValue = 'Unknown value';
                  }

                  return (
                    <div key={key}>
                      {getIdentificationInfo(key) ? (
                        <>{getIdentificationInfo(key)?.displayName}: {displayValue}</>
                      ) : (
                        <>{key}: {displayValue}</>
                      )}
                    </div>
                  );
                })}
              </ul>
            )}

            {item.identifications && (
              <ul className="list-disc list-inside">
                {Object.entries(item.identifications).map(([key, value]) => {
                  // Determine the text color based on the value
                  const getColorClass = (val: number) => {
                    const isCost = key.toLowerCase().includes('cost');
                    if (isCost) {
                      return val < 0 ? 'text-green-500' : 'text-red-500'; // Cost keys are inverted
                    }
                    return val > 0 ? 'text-green-500' : 'text-red-500'; // Regular keys
                  };

                  return (
                    <div key={key} className="flex items-center justify-between">
                      {typeof value === 'number' ? (
                        <>
                          <span style={{ flex: '1', textAlign: 'left' }}></span>
                          <span className="flex-grow text-center">{getIdentificationInfo(key)?.displayName}</span>
                          <span className={`${getColorClass(value)}`} style={{ flex: '1', textAlign: 'right' }}>{value}{getIdentificationInfo(key)?.unit}</span>
                        </>
                      ) : (
                        <>
                          <span className={getColorClass(value.min)} style={{ flex: '1', textAlign: 'left' }}>{value.min}{getIdentificationInfo(key)?.unit}</span>
                          <span className="flex-grow text-center">{`${getIdentificationInfo(key)?.displayName}`}</span>
                          <span className={getColorClass(value.max)} style={{ flex: '1', textAlign: 'right' }}>{value.max}{getIdentificationInfo(key)?.unit}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </ul>
            )}
            {item.majorIds && (
              <ul className="list-disc list-inside">
                {Object.entries(item.majorIds).map(([key, value]) => (
                  <div className="text-sm" key={key} dangerouslySetInnerHTML={{ __html: value }} />
                ))}
              </ul>
            )}
            {item.powderSlots && (
              <p className="text-sm font-bold">
                Powder Slots:{' '}
                <span className="text-lg text-primary/50">
                  {Array.from({ length: item.powderSlots }, () => '○').join('')}
                </span>
              </p>
            )}
            {item.lore && (
              <>
                <Separator />
                <p className="text-sm italic text-muted-foreground">{item.lore}</p>
              </>
            )}
            {item.restrictions && (
              <p className="text-red-500 capitalize">{item.restrictions}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
}

const ItemIcon: FC<{ item: Item, size?: number }> = ({ item, size = 32 }) => {
  const getImageSrc = (): string => {
    if (item.icon) {
      if (item.icon.format === 'attribute' || item.icon.format === 'legacy') {
        const iconValue =
          typeof item.icon.value === 'object'
            ? item.icon.value.name
            : item.icon.value.replace(':', '_');
        return `https://cdn.wynncraft.com/nextgen/itemguide/3.3/${iconValue}.webp`;
      }
      if (item.icon.format === 'skin') {
        return `https://mc-heads.net/head/${item.icon.value}`;
      }
    } else if (item.type === 'armour') {
      return `https://cdn.wynncraft.com/nextgen/itemguide/3.3/${item.armourMaterial}_${item.armourType}.webp`;
    }
    return `/icons/items/barrier.webp`;
  };

  const src = getImageSrc();

  return (
    <Image
      src={src}
      alt={item.internalName || 'none'}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated', // Preserve pixel art look
      }}
    />
  );
};

export { ItemDisplay, SmallItemCard }