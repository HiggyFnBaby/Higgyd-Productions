"use client";

import { useState } from "react";

export function CaptureLinkBox({ agentId }: { agentId: string }) {
  const [copied, setCopied] = useState(false);
  // Guarded for the server-render pass; window.location is only read after
  // hydration when the user clicks copy.
  const link = typeof window !== "undefined" ? `${window.location.origin}/l/${agentId}` : `/l/${agentId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium">Your lead-capture link — share it anywhere</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-slate-100 px-3 py-2 text-xs">{link}</code>
        <button
          onClick={handleCopy}
          className="rounded bg-slate-900 px-3 py-2 text-xs text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
