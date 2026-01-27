import { getRarityStyles } from "@/lib/colorUtils"
import { cn } from "@/lib/utils"
import { Sword, Gem, BookOpen, Zap, Sparkles, CircleDot, Package } from "lucide-react"
import Image from "next/image"

export interface Item {
  name: string
  amount: number
  itemType: string
  rarity: string
  subtype: string
  icon: { format: string; value: string } | null
  region?: string
}

function getItemIcon(itemType: string, subtype?: string) {
  switch (itemType) {
    case "GearItem":
      return <Sword className="h-5 w-5" />
    case "AspectItem":
      const className = subtype?.split('Aspect')[0].toLowerCase()
      return <Image
        unoptimized
        src={`/icons/aspects/${className}.png`}
        alt={`${className} aspect icon`}
        width={16}
        height={16}
        className="w-8 h-8 [image-rendering:pixelated]"
      />
    case "TomeItem":
      return <BookOpen className="h-5 w-5" />
    case "AmplifierItem":
      return <Zap className="h-5 w-5" />
    case "EmeraldItem":
      return <Gem className="h-5 w-5" />
    case "PowderItem":
      return <CircleDot className="h-5 w-5" />
    default:
      return <Package className="h-5 w-5" />
  }
}

function getItemTypeLabel(itemType: string) {
  switch (itemType) {
    case "GearItem":
      return "Gear"
    case "AspectItem":
      return "Aspect"
    case "TomeItem":
      return "Tome"
    case "AmplifierItem":
      return "Amplifier"
    case "EmeraldItem":
      return "Currency"
    case "PowderItem":
      return "Powder"
    case "MiscItem":
      return "Misc"
    default:
      return itemType.replace("Item", "")
  }
}

export function LootItem({ item }: { item: Item }) {
  const styles = getRarityStyles(item.rarity)
  const typeLabel = getItemTypeLabel(item.itemType)
  // const [openTooltip, setOpenTooltip] = useState<string | null>(null)

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-3 border rounded-xl transition-all duration-300 cursor-default group",
        styles.border,
        styles.bg,
        "hover:shadow-xl hover:shadow-black/20",
      )}
    >
      {/* Icon with hover effect */}
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          styles.icon,
        )}
      >
        {getItemIcon(item.itemType, item.subtype)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-[15px] leading-tight truncate mb-1", styles.text)} title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{typeLabel}</span>
          {item.rarity !== "Common" && (
            <>
              <span className={cn("w-1 h-1 rounded-full", styles.icon.split(" ")[1])} />
              <span className={cn("text-[10px] font-mono uppercase tracking-widest", styles.text)}>{item.rarity}</span>
            </>
          )}
          {item.region && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary ml-2">
              {item.region}
            </span>
          )}
        </div>
      </div>

      {/* Amount Badge - positioned for player utility */}
      {item.amount > 1 && (
        <div className="absolute -top-2 -right-2 bg-zinc-950 border border-white/10 px-2 py-0.5 rounded-lg text-[11px] font-bold text-white shadow-lg">
          ×{item.amount}
        </div>
      )}
    </div>
  )
}
