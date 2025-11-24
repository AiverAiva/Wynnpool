import { NextResponse } from "next/server"

export async function GET() {
    try {
        const response = await fetch("https://api.github.com/repos/AiverAiva/Wynnpool/contributors?per_page=100", {
            headers: {
                "Content-Type": "application/json",
            },
            // Cache for 1 day
            next: { revalidate: 86400 },
        })

        if (!response.ok) {
            throw new Error("Failed to fetch contributors")
        }

        const contributors = await response.json()

        const filteredContributors = Array.isArray(contributors)
            ? contributors.filter((contributor) => {
                if (contributor?.type === "Bot") {
                    return false
                }

                if (typeof contributor?.login === "string" && contributor.login.toLowerCase().endsWith("[bot]")) {
                    return false
                }

                return true
            })
            : contributors

        return NextResponse.json(filteredContributors)
    } catch (error) {
        console.error("Error fetching contributors:", error)
        return NextResponse.json({ error: "Failed to fetch contributors" }, { status: 500 })
    }
}
