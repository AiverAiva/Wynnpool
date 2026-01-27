import { cn } from "@/lib/utils"
import { Sword, Gem, BookOpen, Zap, Sparkles, CircleDot, Package, Star, Key } from "lucide-react"
import { getRarityStyles } from "@/lib/colorUtils"
import { ItemIcon, ItemTypeIcon } from "@/components/custom/WynnIcon"
import Image from "next/image"

export interface ShinyStat {
  shinyRerolls: number
  statType: {
    displayName: string
    id: number
    key: string
    statUnit: string
  }
  value: number
}

export interface Item {
  name: string
  amount: number
  itemType: string
  rarity: string
  subtype: string
  icon: { format: string; value: string } | null
  shiny?: boolean
  shinyStat?: ShinyStat | null
}


function getItemIcon(item: Item) {
  // If we have a specific icon from the API, use it
  if (item.icon) {
    const compatibleItem = {
      type: item.itemType === "GearItem" ? (["HELMET", "CHESTPLATE", "LEGGINGS", "BOOTS"].includes(item.subtype) ? "armour" : "weapon") : item.itemType.replace("Item", "").toLowerCase(),
      armourType: item.subtype.toLowerCase(),
      armourMaterial: "leather", // Default to leather for texture lookup if material is missing
      icon: item.icon,
      internalName: item.name
    }
    return <ItemIcon item={compatibleItem as any} size={32} />
  }

  // Fallback to ItemTypeIcon based on subtype
  const subtypeKey = item.subtype?.toLowerCase()
  if (subtypeKey) {
    const validIcons = ["bow", "spear", "wand", "dagger", "relik", "helmet", "chestplate", "leggings", "boots", "ring", "bracelet", "necklace", "tome", "charm"]
    if (validIcons.includes(subtypeKey)) {
      return <ItemTypeIcon type={subtypeKey} size={32} />
    }
  }

  // Special case for types not in validIcons but in WynnIcon logic
  if (item.itemType === "TomeItem") return <ItemTypeIcon type="tome" size={32} />

  // Specific fallbacks for common types
  switch (item.itemType) {
    case "GearItem":
      return <Sword className="h-5 w-5" />
    case "AspectItem":
      const aspectClass = item.subtype?.split("Aspect")[0].toLowerCase()
      if (aspectClass) {
        return (
          <Image
            unoptimized
            src={`/icons/aspects/${aspectClass}.png`}
            alt={`${aspectClass} aspect icon`}
            width={32}
            height={32}
            className="w-8 h-8 [image-rendering:pixelated]"
          />
        )
      }
      return <Sparkles className="h-5 w-5" />
    case "EmeraldItem":
      return <Gem className="h-5 w-5" />
    case "PowderItem":
      return <CircleDot className="h-5 w-5" />
    case "DungeonKeyItem":
      return <Key className="h-5 w-5" />
    case "RuneItem":
      return <Star className="h-5 w-5" />
    case "InsulatorItem":
      return (
        <Image
          unoptimized
          src="/icons/items/insulator.png"
          alt="Insulator icon"
          width={32}
          height={32}
          className="w-8 h-8 [image-rendering:pixelated]"
        />
      )
    case "AmplifierItem":
    case "SimulatorItem":
      return (
        <Image
          unoptimized
          src="/icons/items/simulator.png"
          alt="Simulator icon"
          width={32}
          height={32}
          className="w-8 h-8 [image-rendering:pixelated]"
        />
      )
    default:
      return <Package className="h-5 w-5" />
  }
}

function getItemTypeLabel(itemType: string, subtype?: string) {
  switch (itemType) {
    case "GearItem":
      return subtype ? subtype.charAt(0) + subtype.slice(1).toLowerCase() : "Gear"
    case "AspectItem":
      return "Aspect"
    case "TomeItem":
      return "Tome"
    case "AmplifierItem":
      return "Amplifier"
    case "SimulatorItem":
      return "Simulator"
    case "EmeraldItem":
      return "Currency"
    case "PowderItem":
      return "Powder"
    case "DungeonKeyItem":
      return "Key"
    case "RuneItem":
      return "Rune"
    case "InsulatorItem":
      return "Insulator"
    case "MiscItem":
      return "Misc"
    default:
      return itemType.replace("Item", "")
  }
}

export function LootItem({ item, showShinyDetails = false }: { item: Item; showShinyDetails?: boolean }) {
  const styles = getRarityStyles(item.rarity)
  const typeLabel = getItemTypeLabel(item.itemType, item.subtype)

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-default group",
        styles.border,
        styles.bg,
        item.shiny && "shiny-card-effect",
        "hover:shadow-xl hover:shadow-black/20",
      )}
    >
      {/* Shiny indicator */}
      {item.shiny && (
        <div className="absolute -top-2 -left-2 bg-zinc-950 border border-[#eac2ff] px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#eac2ff] shadow-lg flex items-center gap-1 z-20">
          <Sparkles className="h-3 w-3" />
          SHINY
        </div>
      )}

      {/* Icon with hover effect */}
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          styles.icon,
        )}
      >
        {getItemIcon(item)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-[15px] leading-tight truncate mb-1", styles.text)} title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{typeLabel}</span>
          {item.rarity !== "Common" && (
            <>
              {/* <span className={cn("w-1 h-1 rounded-full", styles.icon.split(" ").find(c => c.startsWith('text-')))} /> */}
              <span className={cn("text-[10px] font-mono uppercase tracking-widest", styles.text)}>{item.rarity}</span>
            </>
          )}

          {showShinyDetails && item.shiny && item.shinyStat && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#eac2ff]">
              {item.shinyStat.statType.displayName}
            </span>
          )}
        </div>

        {/* Shiny stat tracking */}

      </div>

      {/* Amount Badge - positioned for player utility */}
      {item.amount > 1 && (
        <div className="absolute -top-2 -right-2 bg-zinc-950 border border-white/10 px-2 py-0.5 rounded-lg text-[11px] font-bold text-white shadow-lg z-20">
          ×{item.amount}
        </div>
      )}
    </div>
  )
}

export { getItemIcon, getItemTypeLabel }
