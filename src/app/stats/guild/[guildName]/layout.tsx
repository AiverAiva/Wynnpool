import api from "@/utils/api";

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

export async function generateMetadata({ params }: { params: Promise<{ guildName: string }> }) {
    const { guildName } = await params;

    const res = await fetch(api(`/guild/${guildName}`))
    if (!res.ok) {
        return {
            title: 'Guild Not Found',
            description: `The guild "${guildName}" could not be found.`,
        };
    }

    const guildData = await res.json();

    return {
        title: `[${guildData.prefix}] ${guildData.name} - Guild Stats`,
        description: `View detailed statistics for ${guildData.name} on our platform.`,
        openGraph: {
            title: `[${guildData.prefix}] ${guildData.name} - Guild Stats`,
            description: `Detailed player statistics for ${guildData.name}.`,
            url: `https://wynnpool.com/guild/${guildData.name}`
        },
        twitter: {
            card: 'summary_large_image',
            title: `[${guildData.prefix}] ${guildData.name} - Guild Stats`,
            description: `Detailed player statistics for ${guildData.name}.`
        },
    };
}