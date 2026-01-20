import { bannerColorMap } from "@/map/colorMap";

export const getBannerColorHex = (color: string) => {
    return bannerColorMap[color.toUpperCase()]
};


export const getRarityStyles = (rarity: string) => {
    switch (rarity) {
        case "Mythic":
            return {
                border: "border-mythic/40 hover:border-mythic/70",
                bg: "bg-mythic/5 hover:bg-mythic/10",
                icon: "bg-mythic/20 text-mythic",
                text: "text-mythic",
                glow: "shadow-mythic/10",
                badge: "text-mythic border-mythic/50"
            }
        case "Fabled":
            return {
                border: "border-fabled/40 hover:border-fabled/70",
                bg: "bg-fabled/5 hover:bg-fabled/10",
                icon: "bg-fabled/20 text-fabled",
                text: "text-fabled",
                glow: "shadow-fabled/10",
                badge: "text-fabled border-fabled/50",
            }
        case "Legendary":
            return {
                border: "border-legendary/40 hover:border-legendary/70",
                bg: "bg-legendary/5 hover:bg-legendary/10",
                icon: "bg-legendary/20 text-legendary",
                text: "text-legendary",
                glow: "shadow-legendary/10",
                badge: "text-legendary border-legendary/50"
            }
        default:
            return {
                border: "border-zinc-700/50 hover:border-zinc-600",
                bg: "bg-zinc-800/30 hover:bg-zinc-800/50",
                icon: "bg-zinc-700/50 text-zinc-400",
                text: "text-zinc-300",
                glow: "",
                badge: "text-muted-foreground border-muted-foreground/50"
            }
    }
}
