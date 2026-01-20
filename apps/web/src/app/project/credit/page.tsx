import { Metadata } from "next"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export const metadata: Metadata = {
    title: "Credits — Wynnpool",
    description: "Acknowledgements and credits for resources used in Wynnpool."
}

type CreditCategory = {
    title: string
    description?: string
    credits: Credit[]
}

type Credit = {
    name: string
    description: string
    url?: string
    author?: string
}

const creditCategories: CreditCategory[] = [
    {
        title: "Game & Data",
        description: "Sources of game data and APIs that power Wynnpool.",
        credits: [
            {
                name: "Wynncraft",
                description: "The game that inspired this project. All game data, assets, and content belong to Wynncraft.",
                url: "https://wynncraft.com",
            },
            {
                name: "Wynncraft API",
                description: "Official API providing player, guild, and game data.",
                url: "https://docs.wynncraft.com",
            },
            {
                name: "nori.fish",
                description: "Feature inspiration. Early stage data support, APIs.",
                url: "https://nori.fish",
                author: "Rawfish",
            },
            {
                name: "Wynnventory API",
                description: "Unofficial API used for fetching lootpools, price data, and some other information for analysis.",
                url: "https://www.wynnventory.com/",
            },
        ],
    },
    {
        title: "Icons & Assets",
        description: "Visual resources used throughout the site.",
        credits: [
            {
                name: "Wynncraft",
                description: "Game icons, item sprites, and aspect icons are property of Wynncraft.",
                url: "https://wynncraft.com",
            },
            {
                name: "Wynn Aspects Reskin",
                description: "Aspect icon artwork used in the aspect browser.",
                url: "https://modrinth.com/resourcepack/wynn-aspects-reskin",
                author: "ArrowRobinGood",
            }
        ],
    },
    {
        title: "Community Tools",
        description: "Projects and tools from the Wynncraft community.",
        credits: [
            {
                name: "WynnBuilder",
                description: "Inspiration for build and loadout features.",
                url: "https://hppeng-wynn.github.io/builder",
            },
            {
                name: "Wynndata",
                description: "UI inspiration and a tribute to a beloved community resource.",
            },
        ],
    },
]

export default function CreditPage() {
    return (
        <main className="min-h-screen max-w-screen-md mx-auto px-6 py-36">
            {/* Header */}
            <section className="mb-12">
                <h1 className="text-4xl tracking-tight font-semibold text-foreground md:text-5xl mb-4">
                    Credits
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Wynnpool wouldn't be possible without the amazing work of others.
                    This page acknowledges the projects, resources, and communities that
                    have contributed to making this tool a reality.
                </p>
            </section>

            {/* Credit Categories */}
            <div className="space-y-12">
                {creditCategories.map((category) => (
                    <section key={category.title}>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">
                            {category.title}
                        </h2>
                        {category.description && (
                            <p className="text-muted-foreground mb-6">{category.description}</p>
                        )}
                        <div className="grid gap-4">
                            {category.credits.map((credit) => (
                                <div
                                    key={credit.name}
                                    className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-baseline gap-2">
                                                <h3 className="font-medium text-foreground">
                                                    {credit.name}
                                                </h3>
                                                {credit.author && (
                                                    <span className="text-xs text-muted-foreground">
                                                        by {credit.author}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {credit.description}
                                            </p>
                                        </div>
                                        {credit.url && (
                                            <Link
                                                href={credit.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Footer Note */}
            <section className="mt-16 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    If you believe we've missed crediting something or someone, please{" "}
                    <Link
                        href="https://discord.gg/QZn4Qk3mSP"
                        target="_blank"
                        className="text-primary hover:underline"
                    >
                        reach out on Discord
                    </Link>{" "}
                    and we'll be happy to update this page.
                </p>
            </section>
        </main>
    )
}
