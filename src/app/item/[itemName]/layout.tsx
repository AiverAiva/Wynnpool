import { getImageSrc } from "@/components/custom/WynnIcon";
import { Item } from "@/types/itemType";
import api from "@/lib/api";

export default function PlayerLayout({
    children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) {
    return (
        <section>
            {children}
        </section>
    )
}

export async function generateMetadata({ params }: { params: Promise<{ itemName: string }> }) {
    const { itemName } = await params;

    const res = await fetch(api(`/item/${itemName}`))
    if (!res.ok) {
        return {
            title: 'Item Not Found',
            description: `The item "${itemName}" could not be found.`,
        };
    }

    const itemData: Item = await res.json();
    const iconUrl: string = getImageSrc(itemData)

    return {
        title: `${itemData.internalName} - Item Info`,
        description: `View item information for ${itemData.internalName} on our platform.`,
        openGraph: {
            title: `${itemData.internalName} - Item Info`,
            description: `View item information for ${itemData.internalName}.`,
            url: `https://wynnpool.com/item/${itemData.internalName}`,
            images: [
                {
                    url: iconUrl, 
                    alt: `${itemData.internalName}`,
                },
            ],
        },

        twitter: {
            card: 'summary_large_image',
            title: `${itemData.internalName} - Player Stats`,
            description: `Detailed player statistics for ${itemData.internalName}.`,
            images: [iconUrl], 
        },
    };
}
