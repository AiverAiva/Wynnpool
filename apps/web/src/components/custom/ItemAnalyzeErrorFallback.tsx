'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISCORD_INVITE = 'https://discord.gg/QZn4Qk3mSP';

interface ItemAnalyzeErrorFallbackProps {
  message: string;
  itemStrings?: string[];
  tab?: 'analyze' | 'compare';
  /** Server diagnostics such as the encoding version, byte offset and decoded blocks. */
  diagnostics?: unknown;
}

export function ItemAnalyzeErrorFallback({
  message,
  itemStrings = [],
  tab = 'analyze',
  diagnostics,
}: ItemAnalyzeErrorFallbackProps) {
  const [copied, setCopied] = useState(false);
  const report = buildDebugReport(message, itemStrings, tab, diagnostics);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = report;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 w-full space-y-3 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
      <p className="break-words text-sm font-medium text-red-600 dark:text-red-400">
        {message}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-background/70 p-2 font-mono text-xs dark:bg-black/30">
        {report}
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="text-green-500" /> : <Copy />}
          {copied ? 'Copied!' : 'Copy Debug Info'}
        </Button>
        <Link
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Paste it in our Discord
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Copy the debug info above and paste it into our Discord server so we can
        reproduce and fix the issue.
      </p>
    </div>
  );
}

function buildDebugReport(
  message: string,
  itemStrings: string[],
  tab: 'analyze' | 'compare',
  diagnostics?: unknown,
): string {
  const url = typeof window !== 'undefined' ? window.location.href : 'unknown';
  const itemLines = itemStrings
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.trim() !== '')
    .map(
      ({ s, i }) =>
        `${itemStrings.length > 1 ? `Item ${i + 1}` : 'Item'}: ${s}`,
    );
  const diagnosticsLine =
    diagnostics === undefined || diagnostics === null
      ? 'Diagnostics: none'
      : `Diagnostics: ${JSON.stringify(diagnostics, null, 2)}`;
  return [
    'Wynnpool Item Analyzer - Debug Report',
    '================================',
    `Error: ${message}`,
    diagnosticsLine,
    `Tab: ${tab === 'compare' ? 'Compare Two Items' : 'Analyze Single Item'}`,
    ...itemLines,
    `URL: ${url}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n');
}
