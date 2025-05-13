import api from "@/lib/api";
import { getBannerColorHex } from "@/lib/colorUtils";
import { Metadata } from "next";

export default function GuildLayout({
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

export async function generateMetadata({ params }: { params: Promise<{ guildName: string }> }): Promise<Metadata> {
    const { guildName } = await params;

    const res = await fetch(api(`/guild/${guildName}`))
    if (!res.ok) {
        return {
            title: 'Guild Not Found',
            description: `The guild "${guildName}" could not be found.`,
        };
    }

    const guildData = await res.json();

    const color = guildData.banner?.base
        ? getBannerColorHex(guildData.banner.base)
        : undefined;

    const stats = [
        `View detailed statistics for ${guildData.name} on our platform.`,
        ``,
        `• 🏰 Level: ${guildData.level}`,
        `• 🎯 Wars: ${guildData.wars}`,
        `• 👥 Members: ${guildData.members.total}`,
    ];

    return {
        title: `[${guildData.prefix}] ${guildData.name} - Guild Stats`,
        description: stats.join('\n'),
        openGraph: {
            title: `[${guildData.prefix}] ${guildData.name} - Guild Stats`,
            description: stats.join('\n'),
            url: `https://wynnpool.com/stats/guild/${guildData.name}`,
        },
        twitter: {
            card: 'summary',
            title: `[${guildData.prefix}] ${guildData.name} - Guild Stats`,
            description: stats.join('\n'),
        },
        themeColor: color
    };
}