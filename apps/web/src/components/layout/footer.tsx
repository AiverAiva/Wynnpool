import Link from "next/link"
import { FaGithub, FaDiscord } from "react-icons/fa"

export function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto max-w-7xl px-24 py-12">

                {/* Top Grid */}
                <div className="grid grid-cols-1 md:flex md:justify-between gap-12">
                    {/* Branding Column */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-semibold">Wynnpool</h2>
                        {/* <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            Your all-in-one tool for everything Wynncraft. Player stats,
                            lootpool analysis, loadouts, builds, and more.
                        </p> */}

                        {/* Social Row */}
                        <div className="flex gap-4 mt-2">
                            <SocialLink href="https://github.com/AiverAiva/Wynnpool">
                                <FaGithub className="size-5" />
                            </SocialLink>

                            <SocialLink href="https://discord.gg/QZn4Qk3mSP">
                                <FaDiscord className="size-5" />
                            </SocialLink>
                        </div>
                    </div>

                    {/* Community */}
                    {/* <FooterSection title="Community">
                        <FooterLink href="https://github.com/yourrepo">GitHub</FooterLink>
                        <FooterLink href="https://discord.gg/yourinvite">Discord</FooterLink>
                    </FooterSection> */}

                    <div className="flex flex-col md:flex-row gap-12">
                        <FooterSection title="Support Us">
                            {/* <FooterLink href="https://ko-fi.com/yourlink">Ko-fi</FooterLink> */}
                            <FooterLink href="https://buymeacoffee.com/aiveraiva">Buy me a coffee</FooterLink>
                        </FooterSection>

                        <FooterSection title="Project">
                            <FooterLink href="/project/contributors">Contributors</FooterLink>
                            <FooterLink href="/project/credit">Credits</FooterLink>
                            <FooterLink href="https://status.wynnpool.com">Service Status</FooterLink>

                            {/* <FooterLink href="/sponsor">Sponsors</FooterLink> */}
                        </FooterSection>

                        <FooterSection title="Community">
                            <FooterLink href="https://github.com/AiverAiva/Wynnpool">Github</FooterLink>
                            <FooterLink href="https://discord.gg/QZn4Qk3mSP">Discord</FooterLink>
                        </FooterSection>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-6 border-t border-border text-xs text-muted-foreground gap-4">
                    <div className="flex-col flex text-center md:text-left">
                        <span>Copyright © 2024 - {new Date().getFullYear()} Wynnpool. All rights reserved.</span>
                        <span>Not affiliated with Wynncraft.</span>
                    </div>
                    <div className="flex gap-3 items-center">
                        <FooterLink href="/legal/license">License</FooterLink>
                        <span className="text-muted-foreground">·</span>
                        <FooterLink href="/legal/terms">Terms</FooterLink>
                        <span className="text-muted-foreground">·</span>
                        <FooterLink href="/legal/privacy">Privacy</FooterLink>
                    </div>
                </div>

            </div>
        </footer>
    )
}

/* ---------------------------------- */
/* Sub Components                      */
/* ---------------------------------- */

function FooterSection({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {children}
        </div>
    )
}

function FooterLink({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
            {children}
        </Link>
    )
}

function FooterText({ children }: { children: React.ReactNode }) {
    return <span className="text-sm text-muted-foreground">{children}</span>
}

function SocialLink({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            target="_blank"
            className="text-muted-foreground hover:text-foreground transition-colors"
        >
            {children}
        </Link>
    )
}
