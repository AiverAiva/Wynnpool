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
        case "Rare":
            return {
                border: "border-rare/40 hover:border-rare/70",
                bg: "bg-rare/5 hover:bg-rare/10",
                icon: "bg-rare/20 text-rare",
                text: "text-rare",
                glow: "shadow-rare/10",
                badge: "text-rare border-rare/50"
            }
        case "Unique":
            return {
                border: "border-unique/40 hover:border-unique/70",
                bg: "bg-unique/5 hover:bg-unique/10",
                icon: "bg-unique/20 text-unique",
                text: "text-unique",
                glow: "shadow-unique/10",
                badge: "text-unique border-unique/50"
            }
        case "Set":
            return {
                border: "border-set/40 hover:border-set/70",
                bg: "bg-set/5 hover:bg-set/10",
                icon: "bg-set/20 text-set",
                text: "text-set",
                glow: "shadow-set/10",
                badge: "text-set border-set/50"
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
