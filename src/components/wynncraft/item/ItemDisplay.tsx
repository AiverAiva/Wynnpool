
//             {item.averageDps && (
//                 <h3 className="font-semibold">Average DPS</h3>
//                 <p>{item.averageDps}</p>
//               <h3 className="font-semibold">Base Damage</h3>
//               <p>{item.base.baseDamage.min} to {item.base.baseDamage.max} (Base: {item.base.baseDamage.raw})</p>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getIdentificationInfo, Item } from "@/types/itemType"
import Image from 'next/image'
import '@/assets/css/wynncraft.css'
import { getClassInfo } from "@/types/classType"
import Link from "next/link"
import { ItemIcon } from "../../custom/WynnIcon"
import { cn } from "@/lib/utils"
import MajorIds from "./MajorIds"

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

function getColor(number: number) {
  if (number > 0) return 'text-green-500'
  if (number < 0) return 'text-red-500'
}

function getFormattedText(number: number) {
  if (number > 0) return '+' + number
  if (number < 0) return number
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, embeded = false }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto h-fit font-ascii text-[#AAAAAA]">
      <ItemHeader item={item} />
      <ItemContent item={item} embeded={embeded} />
    </Card>
  )
}

const BaseStatsFormatter: React.FC<any> = ({ name, value }) => {
  const colorMap: Record<string, string> = {
    baseHealth: 'text-[#AA0000]',
    baseDamage: 'text-[#FFAA00]',
    Earth: 'text-[#00AA00]',
    Thunder: 'text-[#FFFF55]',
    Water: 'text-[#55FFFF]',
    Fire: 'text-[#FF5555]',
    Air: 'text-[#FFFFFF]',
  };

  const textMap: Record<string, string> = {
    baseHealth: 'Health',
    baseDamage: 'Neutral',
    Earth: 'Earth',
    Thunder: 'Thunder',
    Water: 'Water',
    Fire: 'Fire',
    Air: 'Air',
  };

  const matchedKey = Object.keys(colorMap).find((key) => name.includes(key));
  const color = matchedKey ? colorMap[matchedKey] : '';
  const text = matchedKey ? <span className={color}>{textMap[matchedKey]}&ensp;</span> : null;

  const type = name.includes('Damage')
    ? 'Damage'
    : name.includes('Defence')
      ? 'Defence'
      : '';

  return (
    <div className="flex items-center h-5">
      <div>
        <span className={cn('font-common text-lg h-4 -mt-3', color)}>
          {getIdentificationInfo(name)?.symbol}
        </span>
        <span className={getIdentificationInfo(name)?.symbol && 'ml-2'}>
          {text}
          {type}
        </span>
      </div>
      {typeof value === 'number' ? (
        <span className="ml-1 h-4">{getFormattedText(value)}</span>
      ) : (
        <span className="ml-1 h-4">
          {value.min}-{value.max}
        </span>
      )}
    </div>
  );
};

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

interface IdentificationProps {
  id: string
  value: number | {
    min: number
    max: number
    raw: number
  }
}

const Identification: React.FC<IdentificationProps> = ({ id, value }) => {
  const displayName = getIdentificationInfo(id)?.displayName ?? id
  const displayUnit = getIdentificationInfo(id)?.unit ?? ''

  const getColorClass = (val: number) => {
    const isCost = id.toLowerCase().includes('cost');
    if (isCost) {
      return val < 0 ? 'text-green-500' : 'text-red-500'; // Cost keys are inverted
    }
    return val > 0 ? 'text-green-500' : 'text-red-500'; // Regular keys
  };

  return (
    <div className="flex items-center justify-between text-sm">
      {typeof value === 'number' ? (
        <>
          <span style={{ flex: '1', textAlign: 'left' }}></span>
          <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
          <span className={`${getColorClass(value)}`} style={{ flex: '1', textAlign: 'right' }}>{value}{displayUnit}</span>
        </>
      ) : (
        <>
          <span className={getColorClass(value.min)} style={{ flex: '1', textAlign: 'left' }}>{value.min}{displayUnit}</span>
          <span className={cn("flex-grow text-center", (displayName.length >= 13 && 'text-xs'))}>{displayName}</span>
          <span className={getColorClass(value.max)} style={{ flex: '1', textAlign: 'right' }}>{value.max}{displayUnit}</span>
        </>
      )}
    </div>
  );
}

const AttackSpeed: React.FC<{ attackSpeed: string }> = ({ attackSpeed }) => {
  return (
    <div className="flex justify-center items-center text-xs">
      {`${attackSpeed.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Attack Speed`}
    </div>
  );
}

const ItemHeader: React.FC<{ item: Item }> = ({ item }) => {
  const isCombatItem = item.type == 'weapon' || item.type === 'armour' || item.type === 'accessory' || item.type === 'tome' || item.type === 'charm'
  const itemNameLength = isCombatItem ? item.internalName.length - 8 : item.internalName.length
  var itemNameSize = 'text-lg'

  if (itemNameLength >= 13) itemNameSize = 'text-md'
  if (itemNameLength >= 16) itemNameSize = 'text-sm'
  if (itemNameLength >= 19) itemNameSize = 'text-xs flex-col'

  return (
    <div className="flex flex-col space-y-1.5 p-6">
      <div className="flex justify-center items-center">
        <ItemIcon item={item} size={64} className="w-16 h-16" />
      </div>

      <div className="flex justify-center items-center">
        <CardTitle className=
          {`flex justify-center items-center font-thin 
                ${itemNameSize} 
                ${isCombatItem && `text-${item.rarity}`}
                ${item.type == 'ingredient' && 'text-[#AAAAAA]'}
              `}>
          {item.internalName}
          {item.type == 'ingredient' && (
            <StarFormatter tier={item.tier} />
          )}
          {item.type == 'material' && (
            <span className="text-[#FFAA00] ml-2">
              [<span className="text-[#FFFF55]">{Array.from({ length: item.tier }, () => '✫').join('')}</span><span className="text-[#555555]">{Array.from({ length: 3 - item.tier }, () => '✫').join('')}</span>]
            </span>
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
    </div>
  );
}

const ItemContent: React.FC<{ item: Item, embeded?: boolean }> = ({ item, embeded = false }) => {
  const isCombatItem = item.type == 'weapon' || item.type === 'armour' || item.type === 'accessory' || item.type === 'tome' || item.type === 'charm'

  return (
    <div className="space-y-4 p-6 pt-0">
      {item.type == 'weapon' && item.attackSpeed && (
        <AttackSpeed attackSpeed={item.attackSpeed} />
      )}
      {item.base && (
        <ul className="list-disc list-inside text-sm">
          {Object.entries(item.base).map(([name, value]) => (
            <BaseStatsFormatter value={value} name={name} key={name} />
          ))}
          {item.type === "weapon" && (
            <div className="flex ml-6 gap-1 mt-1 h-4 items-center text-sm">
              <span className="text-primary/80">Average DPS</span> {item.averageDps}
            </div>
          )}
        </ul>
      )}

      {isCombatItem && item.requirements && (
        <ul className="list-disc list-inside text-sm">
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
          {Object.entries(item.identifications).map(([key, value]) => (
            <Identification id={key} value={value} />
          ))}
        </ul>
      )}
      {item.type == 'ingredient' && (
        <>
          {Object.entries(item.ingredientPositionModifiers).some(([key, value]) => value !== 0) && (
            <div className="flex flex-col text-sm text-gray-400">
              {Object.entries(item.ingredientPositionModifiers).map(([key, value]) => (value !== 0 && (
                <div key={key} className="flex flex-col">
                  <span><span className={getColor(value)}>{value > 0 && '+'}{value}{getIdentificationInfo(key)?.unit}</span> Ingredient Effectiveness</span>
                  <span>({getIdentificationInfo(key)?.displayName})</span>
                </div>
              )
              ))}
            </div>
          )}
          {Object.entries(item.itemOnlyIDs).some(([key, value]) => key !== 'durabilityModifier' && value !== 0) && (
            <div className="flex flex-col text-sm">
              {Object.entries(item.itemOnlyIDs).map(([key, value]) => (
                key !== 'durabilityModifier' && value !== 0 && (
                  <div key={key} className="flex items-center gap-2">
                    <span className={getColor(value * -1)}>{value > 0 && '+'}{value} {getIdentificationInfo(key.replace('Requirement', ''))?.displayName}</span>
                  </div>
                )
              ))}
            </div>
          )}
          {(item.itemOnlyIDs.durabilityModifier !== 0 || item.consumableOnlyIDs.duration !== 0) && (
            <div className="flex flex-col text-[13.5px]">
              <div className="flex">
                {item.itemOnlyIDs.durabilityModifier !== 0 && (
                  <span className={getColor(item.itemOnlyIDs.durabilityModifier)}>
                    {getFormattedText(item.itemOnlyIDs.durabilityModifier / 1000)} Durability
                  </span>
                )}
                {item.itemOnlyIDs.durabilityModifier !== 0 &&
                  item.consumableOnlyIDs.duration !== 0 && (
                    <span className="text-gray-400">&ensp;or&ensp;</span>
                  )}
                {item.consumableOnlyIDs.duration !== 0 && (
                  <span className={getColor(item.consumableOnlyIDs.duration)}>
                    {getFormattedText(item.consumableOnlyIDs.duration)}s Duration
                  </span>
                )}
              </div>
              {item.consumableOnlyIDs.charges != 0 && (
                <span className={getColor(item.consumableOnlyIDs.charges)}>
                  {getFormattedText(item.consumableOnlyIDs.charges)} Charges
                </span>
              )}
            </div>
          )}
          <div className="text-gray-400">
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
        </>
      )}
      {item.type == 'material' && (
        <span className="text-sm text-gray-400">Use this material to craft: <span className="capitalize text-white">{item.craftable.join(', ')}</span></span>
      )}
      
      {item.majorIds && <MajorIds majorIds={item.majorIds} />}
      
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



      {embeded && (
        <div className="flex justify-end">
          <Link href={`/item/search/${item.internalName}`}>
            <span className="font-mono text-sm italic hover:underline text-gray-500 cursor-pointer transition trasition-all">more details...</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export { ItemHeader, ItemContent, ItemDisplay, SmallItemCard } 