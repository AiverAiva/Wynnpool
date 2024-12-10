import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/custom/navbar";
import { useParams } from "next/navigation";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}

export async function generateMetadata({ params, request }: { params: Promise<{ playerName: string }>, request: Request }) {
    const playerName = (await params).playerName;
    
    // Fetch player data
    const res = await fetch(`${process.env.BASE_URL}/api/stats/player/${playerName}`)
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