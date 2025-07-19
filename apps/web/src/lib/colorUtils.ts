import { bannerColorMap } from "@/map/colorMap";

export const getBannerColorHex = (color: string) => {
    return bannerColorMap[color.toUpperCase()]
};