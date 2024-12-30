
//             {item.averageDps && (
//                 <h3 className="font-semibold">Average DPS</h3>
//                 <p>{item.averageDps}</p>
//               <h3 className="font-semibold">Base Damage</h3>
//               <p>{item.base.baseDamage.min} to {item.base.baseDamage.max} (Base: {item.base.baseDamage.raw})</p>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getIdentificationInfo, IngredientItem, Item } from "@/types/itemType"
import Image from 'next/image'
import '@/assets/css/wynncraft.css'
import { FC } from "react"
import { getClassInfo } from "@/types/classType"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface ItemDisplayProps {
  item: Item
  embeded?: boolean
}

const SmallItemCard: React.FC<ItemDisplayProps> = ({ item }) => {
  return (
    <Card className='w-full flex h-12 items-center gap-4 hover:bg-accent/60 transition-colors cursor-pointer p-1.5 px-3 rounded-md mb-2'>
      <ItemIcon item={item} />
      <span key={item.internalName} className='text-md font-mono'>{item.internalName}</span>
    </Card>
  )
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, embeded = false }) => {
  const isCombatItem = item.type == 'weapon' || item.type === 'armour' || item.type === 'accessory'

  return (
    <Card className="w-full max-w-2xl mx-auto h-fit font-ascii">
      <CardHeader>
        <div className="flex justify-center items-center">
          <ItemIcon item={item} size={64} />
        </div>

        <div className="flex justify-center items-center">
          <CardTitle className={`text-lg ${isCombatItem && `text-${item.rarity}`} font-thin ${item.type == 'ingredient' && 'text-[#AAAAAA]'}`}>
            {item.internalName}
            {item.type == 'ingredient' && (
              <StarFormatter tier={item.tier} />
            )}
          </CardTitle>
        </div>
        {isCombatItem && (
          <div className="flex justify-center items-center">
            <Badge className={`bg-${item.rarity}`}>
              <p className={`text-${item.rarity} brightness-[.3] font-thin`}>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} Item</p>
            </Badge>
          </div>
        )}
        {item.type == 'ingredient' && (
          <div className="flex justify-center items-center">
            <span className="text-[#555555] text-xs -mt-2">Crafting Ingredient</span>
          </div>
        )}
        {item.type == 'weapon' && item.attackSpeed && (
          <CardDescription>
            <div className="flex justify-center items-center text-xs">
              {`${item.attackSpeed.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Attack Speed`}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* {item.averageDps && (
            <div>
              <h3 className="font-semibold">Average DPS</h3>
              <p>{item.averageDps}</p>
            </div>
          )} */}
          {item.base && (
            <ul className="list-disc list-inside text-sm">
              {Object.entries(item.base).map(([name, value]) => (
                <BaseStatsFormatter value={value} name={name} key={name} />
              ))}
            </ul>
          )}

          {isCombatItem && item.requirements && (
            <ul className="list-disc list-inside text-sm text-gray-400">
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
                      key == 'classRequirement' ? (
                        <>{getIdentificationInfo(key)?.displayName}: {getClassInfo(value as string)!.displayName}</>
                      ) : (
                        <>{getIdentificationInfo(key)?.displayName}: {displayValue}</>
                      )
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
                const getColorClass = (val: number) => {
                  const isCost = key.toLowerCase().includes('cost');
                  if (isCost) {
                    return val < 0 ? 'text-green-500' : 'text-red-500'; // Cost keys are inverted
                  }
                  return val > 0 ? 'text-green-500' : 'text-red-500'; // Regular keys
                };

                return (
                  <div key={key} className="flex items-center justify-between text-sm">
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
            <p className="text-sm">
              Powder Slots&ensp;
              <span className="text-primary/50">
                [<span className="font-five">{Array.from({ length: item.powderSlots }, () => 'O').join('')}</span>]
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

          {item.type == 'ingredient' && (
            <div className="mt-6 text-gray-400">
              <span className="text-sm">Crafting Lv. Min: {item.requirements.level}</span>
              <div className="flex flex-col ml-4">
                {Object.entries(item.requirements.skills).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Image
                      src={`/icons/profession/${value}.webp`}
                      alt={item.internalName}
                      width={32}
                      height={32}
                      className="h-4 w-4"
                    />
                    <span className="text-sm capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {embeded && (
            <div className="flex justify-end">
              <Link href={`/item/${item.internalName}`}>
                <span className="font-mono text-sm italic hover:underline text-gray-500 cursor-pointer transition trasition-all">more details...</span>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
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
      alt={item.internalName}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated', // Preserve pixel art look
      }}
    />
  );
};

const BaseStatsFormatter: React.FC<any> = ({ name, value }) => {
  return (
    <div className="flex items-center">
      <span className="font-common text-lg h-6">{getIdentificationInfo(name)?.symbol}</span>
      <span className={getIdentificationInfo(name)?.symbol && "ml-2"}>{getIdentificationInfo(name)?.displayName}</span>
      {typeof value === 'number' ? (
        <span className="ml-1">{value}</span>
      ) : (
        <span className="ml-1">{value.min}-{value.max}</span>
      )
      }
    </div>
  )

}

const StarFormatter: React.FC<any> = ({ tier }) => {
  switch (tier) {
    case 0:
      return (
        <span className="text-[#555555] ml-2">
          [✫✫✫]
        </span>
      )
    case 1:
      return (
        <span className="text-[#FFAA00] ml-2">
          [<span className="text-[#FFFF55]">✫</span><span className="text-[#555555]">✫✫</span>]
        </span>
      )
    case 2:
      return (
        <span className="text-[#AA00AA] ml-2">
          [<span className="text-[#FF55FF]">✫✫</span><span className="text-[#555555]">✫</span>]
        </span>
      )
    case 3:
      return (
        <span className="text-[#00AAAA] ml-2">
          [<span className="text-[#55FFFF]">✫✫✫</span>]
        </span>
      )
  }
}

export { ItemDisplay, SmallItemCard }