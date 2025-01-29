import api from "@/utils/api";

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

export async function generateMetadata({ params }: { params: Promise<{ playerName: string }> }) {
    const { playerName } = await params;

    // Fetch player data
    const res = await fetch(api(`/player/${playerName}`))
    if (!res.ok) {
        return {
            title: 'Player Not Found',
            description: `The player "${playerName}" could not be found.`,
        };
    }

    const playerData = await res.json();

    return {
        title: `${playerData.username} - Player Stats`,
        description: `View detailed statistics for ${playerData.username} on our platform.`,
        openGraph: {
            title: `${playerData.username} - Player Stats`,
            description: `Detailed player statistics for ${playerData.username}.`,
            url: `${process.env.BASE_URL}/player/${playerData.username}`,
            images: [
                {
                    url: `https://vzge.me/bust/512/${playerData.uuid}`,
                    alt: `${playerData.username}'s avatar`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${playerData.username} - Player Stats`,
            description: `Detailed player statistics for ${playerData.username}.`,
            images: [`https://vzge.me/bust/512/${playerData.uuid}`],
        },
    };
}