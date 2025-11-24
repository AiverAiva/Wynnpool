import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Licensing — Wynnpool",
    description: "Open-source licensing information for Wynnpool."
}

export default function LicensePage() {
    return (
        <main className="min-h-screen max-w-screen-md mx-auto px-6 py-36 prose prose-neutral dark:prose-invert">
            <h1 className="mb-6">Software License</h1>
            <p>
                Wynnpool includes open-source components released under the MIT License.
                Below is the full legal text, followed by a plain-language explanation of
                what you are permitted to do and what restrictions apply.
            </p>

            <h2>MIT License</h2>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/40 p-4 rounded-lg border border-border">
                {`MIT License

Copyright (c) 2024 AiverAiva

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </pre>

            <h2>What You Are Allowed to Do</h2>
            <p>
                The MIT License is one of the most permissive open-source licenses.
                Under this license, you are allowed to:
            </p>
            <ul>
                <li><strong>Use</strong> the software for any purpose, including commercial use</li>
                <li><strong>Modify</strong> the source code to suit your needs</li>
                <li><strong>Copy</strong> the software freely</li>
                <li><strong>Distribute</strong> original or modified versions</li>
                <li><strong>Include</strong> it in proprietary or closed-source projects</li>
                <li><strong>Sublicense or resell</strong> the software as part of your product</li>
            </ul>
            <p>
                In short: you can use Wynnpool’s open-source components in almost any way you want.
            </p>

            <h2>What You Cannot Do</h2>
            <p>
                Although MIT is permissive, there are still a few requirements:
            </p>
            <ul>
                <li>
                    You <strong>must include</strong> the original copyright notice and license text
                    in any copies or distributions.
                </li>
                <li>
                    You <strong>cannot remove attribution</strong> from redistributed or modified copies.
                </li>
                <li>
                    You <strong>cannot hold the author liable</strong> for damages, issues, or losses caused
                    by the software.
                </li>
                <li>
                    The software is provided <strong>“as is”</strong> without warranty—you may not imply otherwise.
                </li>
            </ul>

            <p>
                Beyond these points, the MIT License imposes no additional restrictions.
            </p>

            <h2>Additional Notes</h2>
            <ul>
                <li>
                    Only Wynnpool’s <strong>open-source code components</strong> fall under the MIT License.
                </li>
                <li>
                    Wynnpool’s <strong>website content, UI, and proprietary assets</strong> may be subject to additional copyright protection.
                </li>
                <li>
                    This page summarizes the license, but the MIT License text above is the legally binding version.
                </li>
            </ul>

            <h2>Contact</h2>
            <p>
                For licensing questions, you may reach us at:{" "}
                <Link href="mailto:contact@wynnpool.com">contact@wynnpool.com</Link>
            </p>

        </main>
    )
}
