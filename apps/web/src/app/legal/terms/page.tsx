import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Terms of Service — Wynnpool",
    description: "Legal Terms of Service for Wynnpool."
}

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen max-w-screen-md mx-auto px-6 py-36 prose prose-neutral dark:prose-invert">
            <h1 className="mb-6">Terms of Service</h1>
            <p><strong>Last Updated:</strong> {new Date("2025-11-14").toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing or using Wynnpool (“Service”), you agree to be bound by these Terms of Service (“Terms”).
                If you do not agree, you may not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
                Wynnpool is an independent, third-party tool that provides information, analytics, and utilities related
                to the Wynncraft MMORPG community. Wynnpool is <strong>not affiliated</strong> with Wynncraft, Mojang, Microsoft,
                or any associated entities. All trademarks belong to their respective owners.
            </p>

            <h2>3. User Accounts</h2>
            <p>
                Users may authenticate using Discord OAuth and may optionally link a Minecraft
                account. By signing in, you authorize Wynnpool to retrieve your public Discord
                profile information under the <code>identify</code> and <code>email</code> scopes.
            </p>
            <p>
                Wynnpool stores your Discord user ID, username, avatar, banner, public profile
                metadata, and email address (if provided). Wynnpool also stores a Discord OAuth
                access token for the limited purpose of refreshing your public profile data.
            </p>
            <p>
                No privileged Discord permissions are requested or used. For a full explanation
                of what information is collected and what OAuth access tokens can and cannot do,
                please see our <Link href="/legal/privacy">Privacy Policy</Link>.
            </p>

            <h2>4. Acceptable Use</h2>
            <p>Users agree not to:</p>
            <ul>
                <li>Flood, attack, or disrupt the Service</li>
                <li>Bypass or manipulate rate limits</li>
                <li>Redistribute Wynnpool data commercially without permission</li>
                <li>Use bots or automation to overload APIs</li>
                <li>Attempt unauthorized access, scraping, or reverse-engineering</li>
            </ul>

            <h2>5. API Usage and Rate Limiting</h2>
            <p>
                Wynnpool may provide public or semi-public API endpoints. The default rate limit is
                <strong>60 requests per minute</strong> unless stated otherwise.
            </p>
            <p>Users may not:</p>
            <ul>
                <li>Abuse the API or generate excessive load</li>
                <li>Scrape or batch-collect data beyond reasonable personal use</li>
                <li>Redistribute or mirror API responses at scale</li>
            </ul>
            <p>
                For extended usage, features, or suggestions, contact:{" "}
                <Link href="mailto:contact@wynnpool.com">contact@wynnpool.com</Link>.
            </p>

            <h2>6. Infrastructure Disclosure</h2>
            <p>
                Wynnpool’s backend infrastructure, database storage, and API processing are hosted on{" "}
                <strong>Railway</strong>. Railway may collect logs such as IP addresses and request metadata for
                operational, security, and debugging purposes.
            </p>

            <h2>7. Accuracy of Data</h2>
            <p>
                Game data and calculations may be inaccurate or outdated. Wynnpool provides all data
                <strong>“AS IS”</strong> without warranties. Features may change or be removed at any time.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
                Wynnpool owns all website code, design, and original content. Third-party game assets are owned
                by their respective rights holders. Wynnpool does not claim ownership over Wynncraft or Mojang assets.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
                Wynnpool is not liable for any damages arising from use of the Service, including
                data loss, account issues, or incorrect game information.
            </p>

            <h2>10. Indemnification</h2>
            <p>
                You agree to indemnify Wynnpool, its owners, and contributors from claims arising from your use
                of the Service or violation of these Terms.
            </p>

            <h2>11. Modifications to Terms</h2>
            <p>
                Wynnpool may update these Terms at any time. Continued use of the Service constitutes
                acceptance of the revised Terms.
            </p>

            <h2>12. Contact</h2>
            <p>
                For legal inquiries:{" "}
                <Link href="mailto:contact@wynnpool.com">contact@wynnpool.com</Link>.
            </p>
        </main>
    )
}
