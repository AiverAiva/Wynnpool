import { TeamSection } from "./_components/team-section"
import { CommunitySection } from "./_components/community-section"

export default function TeamPage() {
    return (
        <main className="min-h-screen max-w-screen-md mx-auto px-6 py-36">
            {/* Header */}
            <div className="mb-20 text-center">
                <h1 className="text-4xl tracking-tight font-semibold text-foreground md:text-5xl">About the Team</h1>
                <p className="mt-4 text-lg text-muted-foreground">Meet the people behind our work</p>
            </div>

            {/* Core Team Section */}
            <TeamSection />

            {/* Community Section */}
            <CommunitySection />
        </main>
    )
}
