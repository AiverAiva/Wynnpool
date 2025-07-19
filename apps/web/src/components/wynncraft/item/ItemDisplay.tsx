
import '@/assets/css/wynncraft.css'
import { Badge } from "@/components/ui/badge"
import { Card, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getFormattedIdNumber, getIdentificationColor, getIdentificationInfo } from "@/lib/itemUtils"
import { Item } from "@/types/itemType"
import Image from 'next/image'
import Link from "next/link"
import { ItemIcon } from "../../custom/WynnIcon"
import AttackSpeed from "./AttackSpeed"
import BaseStats from "./BaseStats"
import { Identifications } from "./Identifications"
import MajorIds from "./MajorIds"
import PowderSlots from "./PowderSlots"
import Requirements from "./Requirements"

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
  return (
    <Card className="w-full max-w-2xl mx-auto h-fit font-ascii text-[#AAAAAA]">
      <ItemHeader item={item} />
      <ItemContent item={item} embeded={embeded} />
    </Card>
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
      {item.type == 'weapon' && <AttackSpeed attackSpeed={item.attackSpeed} />}
      <BaseStats {...item.base} />
      {item.type === "weapon" && (
        <div className="flex ml-6 gap-1 -mt-4 h-4 items-center text-sm">
          <span className="text-primary/80">Average DPS</span> {item.averageDps}
        </div>
      )}
      {isCombatItem && item.requirements && <Requirements {...item.requirements} />}
      {item.identifications && <Identifications {...item.identifications} />}
      {item.type == 'ingredient' && (
        <>
          {Object.entries(item.ingredientPositionModifiers).some(([key, value]) => value !== 0) && (
            <div className="flex flex-col text-sm text-gray-400">
              {Object.entries(item.ingredientPositionModifiers).map(([key, value]) => (value !== 0 && (
                <div key={key} className="flex flex-col">
                  <span><span className={getIdentificationColor(value)}>{value > 0 && '+'}{value}{getIdentificationInfo(key)?.unit}</span> Ingredient Effectiveness</span>
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
                    <span className={getIdentificationColor(value * -1)}>{value > 0 && '+'}{value} {getIdentificationInfo(key.replace('Requirement', ''))?.displayName}</span>
                  </div>
                )
              ))}
            </div>
          )}
          {(item.itemOnlyIDs.durabilityModifier !== 0 || item.consumableOnlyIDs.duration !== 0) && (
            <div className="flex flex-col text-[13.5px]">
              <div className="flex">
                {item.itemOnlyIDs.durabilityModifier !== 0 && (
                  <span className={getIdentificationColor(item.itemOnlyIDs.durabilityModifier)}>
                    {getFormattedIdNumber(item.itemOnlyIDs.durabilityModifier / 1000)} Durability
                  </span>
                )}
                {item.itemOnlyIDs.durabilityModifier !== 0 &&
                  item.consumableOnlyIDs.duration !== 0 && (
                    <span className="text-gray-400">&ensp;or&ensp;</span>
                  )}
                {item.consumableOnlyIDs.duration !== 0 && (
                  <span className={getIdentificationColor(item.consumableOnlyIDs.duration)}>
                    {getFormattedIdNumber(item.consumableOnlyIDs.duration)}s Duration
                  </span>
                )}
              </div>
              {item.consumableOnlyIDs.charges != 0 && (
                <span className={getIdentificationColor(item.consumableOnlyIDs.charges)}>
                  {getFormattedIdNumber(item.consumableOnlyIDs.charges)} Charges
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

      <MajorIds majorIds={item.majorIds} />
      <PowderSlots powderSlots={item.powderSlots} />
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

export { ItemContent, ItemDisplay, ItemHeader, SmallItemCard }
