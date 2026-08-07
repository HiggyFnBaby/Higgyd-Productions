"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OperatingMode } from "@prisma/client";

const MODES: OperatingMode[] = ["ADMIN", "SEMI_AUTONOMOUS", "AUTONOMOUS"];

// Always visible per ../../../CLAUDE.md's mobile-first interface
// requirement. Changing it is real and audit-logged, but in v1 it does not
// itself relax any approval gate — see
// ../../../docs/approval-policy-matrix.md, and the note below.
export function ModeSelector({ currentMode }: { currentMode: OperatingMode }) {
  const router = useRouter();
  const [mode, setMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: OperatingMode) {
    setSaving(true);
    const res = await fetch("/api/settings/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: next }),
    });
    setSaving(false);
    if (res.ok) {
      setMode(next);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-slate-500">Operating mode</span>
        <select
          value={mode}
          disabled={saving}
          onChange={(e) => handleChange(e.target.value as OperatingMode)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <p className="max-w-xs text-xs text-slate-400">
        v1: every payment, delivery, and QA/red-team sign-off still requires a manual click in every mode.
      </p>
    </div>
  );
}
