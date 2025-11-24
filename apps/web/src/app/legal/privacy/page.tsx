import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Privacy Policy — Wynnpool",
    description: "Privacy Policy for Wynnpool."
}

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen max-w-screen-md mx-auto px-6 py-36 prose prose-neutral dark:prose-invert">
            <h1 className="mb-6">Privacy Policy</h1>
            <p><strong>Last Updated:</strong> {new Date("2025-11-14").toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>
                This Privacy Policy explains how Wynnpool (“we”, “us”, “our”) collects, uses, stores,
                and processes your personal information. By using Wynnpool, you agree to the practices
                outlined in this Policy.
            </p>

            <h2>2. Information We Collect</h2>

            <h3>2.1 Discord Account Information</h3>
            <p>
                When you sign in using Discord OAuth, Wynnpool retrieves and stores the following
                information from your Discord profile:
            </p>
            <ul>
                <li>Discord User ID</li>
                <li>Username and discriminator</li>
                <li>Avatar and banner URLs</li>
                <li>Public profile metadata</li>
                <li>Email address (if provided)</li>
                <li>Discord OAuth access token (scoped to <code>identify</code> and <code>email</code>)</li>
            </ul>

            <h3>2.2 Discord OAuth Scope Clarification</h3>
            <p>
                Wynnpool only requests the <code>identify</code> and <code>email</code> scopes. These scopes
                provide access to <strong>public profile information only</strong>, such as username, avatar,
                and email (if shared).
            </p>

            <p>
                These scopes <strong>do not</strong> grant access to any private or sensitive Discord account
                information, <strong>including but not limited to</strong>:
            </p>
            <ul>
                <li>Direct or private message content</li>
                <li>Message history or chat logs</li>
                <li>Friend lists or user connections</li>
                <li>Server memberships, roles, or permissions</li>
                <li>Administrative or moderation capabilities</li>
                <li>Payment methods or billing information</li>
                <li>Phone numbers or identity verification data</li>
                <li>Security settings or authentication credentials</li>
                <li>Any privileged information not explicitly provided by the <code>identify</code> or <code>email</code> scopes</li>
            </ul>

            <h3>2.3 OAuth Token Storage</h3>
            <p>
                Wynnpool stores your Discord OAuth access token solely for the limited purpose of
                refreshing your public profile information. This access token cannot be used to
                perform any privileged action on your Discord account.
            </p>

            <p>
                The stored OAuth token <strong>does not grant access to any private or sensitive account data</strong>,
                and cannot perform <strong>any action listed in Section 2.2</strong>
            </p>

            <p>
                The access token is restricted to the exact permissions granted by the
                <code>identify</code> and <code>email</code> scopes and cannot be used for any additional capabilities.
            </p>

            <h3>2.4 Minecraft Account Information</h3>
            <p>
                If you choose to link a Minecraft account, we may store:
            </p>
            <ul>
                <li>Minecraft username</li>
                <li>Minecraft UUID</li>
            </ul>

            <h3>2.5 Server Logs and IP Addresses</h3>
            <p>
                For security, abuse prevention, debugging, and rate limiting, Wynnpool automatically logs:
            </p>
            <ul>
                <li>IP address</li>
                <li>User agent</li>
                <li>Request timestamps</li>
                <li>API usage metadata</li>
            </ul>

            <h3>2.6 Analytics Data</h3>
            <p>
                Wynnpool uses the following analytics providers, which may collect anonymized or aggregated
                technical data:
            </p>
            <ul>
                <li>Google Analytics</li>
                <li>Vercel Logging</li>
                <li>Cloudflare Analytics</li>
            </ul>
            <p>
                These services collect non-identifying information such as device type, browser, region,
                interactions, and performance metrics.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use collected data to:</p>
            <ul>
                <li>Authenticate user accounts</li>
                <li>Refresh Discord profile data</li>
                <li>Improve website functionality and stability</li>
                <li>Monitor traffic and prevent abuse</li>
                <li>Analyze usage patterns</li>
                <li>Provide personalized or linked features</li>
            </ul>

            <h2>4. Data Storage and Infrastructure</h2>
            <p>
                Wynnpool’s backend, databases, and runtime infrastructure are hosted on{" "}
                <strong>Railway</strong>. Railway may log and process:
            </p>
            <ul>
                <li>Incoming requests</li>
                <li>IP addresses</li>
                <li>Error logs</li>
                <li>Operational diagnostics</li>
            </ul>

            <h2>5. Data Sharing</h2>
            <p>We may share data with:</p>
            <ul>
                <li>Discord (during OAuth flow)</li>
                <li>Analytics providers listed above</li>
                <li>Infrastructure providers (Railway, Vercel, Cloudflare)</li>
            </ul>
            <p>
                We <strong>do not</strong> sell, trade, or transfer your personal data to advertisers
                or external commercial parties.
            </p>

            <h2>6. Data Retention</h2>
            <p>
                We retain account data for as long as your account remains active. Server logs and analytics
                data may be retained according to the policies of our infrastructure providers.
            </p>

            <h2>7. Data Security</h2>
            <p>
                Wynnpool employs reasonable security measures to protect stored data, including:
            </p>
            <ul>
                <li>Encrypted storage of OAuth tokens</li>
                <li>HTTPS-only data transmission</li>
                <li>Restricted internal access</li>
                <li>Audit and debugging controls</li>
            </ul>

            <h2>8. Your Rights</h2>
            <p>You may request to:</p>
            <ul>
                <li>Delete your account</li>
                <li>Unlink your Minecraft profile</li>
                <li>Revoke Discord OAuth permissions</li>
                <li>Request a copy of your stored data</li>
            </ul>
            <p>Contact us at: <Link href="mailto:contact@wynnpool.com">contact@wynnpool.com</Link></p>

            <h2>9. Children’s Privacy</h2>
            <p>
                Wynnpool does not knowingly collect data from children under 13. If such data is discovered,
                it will be promptly removed.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
                Wynnpool may update this Privacy Policy at any time. Continued use of the Service constitutes
                acceptance of the revised Policy.
            </p>

            <h2>11. Contact</h2>
            <p>
                For privacy or legal inquiries, contact:{" "}
                <Link href="mailto:contact@wynnpool.com">contact@wynnpool.com</Link>.
            </p>
        </main>
    )
}
