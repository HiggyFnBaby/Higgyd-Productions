"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectStatus } from "@prisma/client";

// Every gate here is a separate, distinct owner click — "mark production
// complete," "record QA review," and "record red-team review" can never be
// the same action, per governance rule 6 in ../../../CLAUDE.md and
// ../../../docs/threat-model.md #8. Deliver is only enabled once the
// project's status shows both gates passed (and the API independently
// re-checks this — see the deliver route).
export function ProjectGateActions({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [deliveredUrl, setDeliveredUrl] = useState<string | null>(null);

  async function post(path: string, body?: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      setError(responseBody.error ?? "Action failed.");
      return null;
    }
    return res.json();
  }

  async function markProductionComplete() {
    if (await post(`/api/projects/${projectId}/production-complete`)) router.refresh();
  }

  async function recordQA(result: "PASS" | "FAIL") {
    if (await post(`/api/projects/${projectId}/qa`, { result, notes })) {
      setNotes("");
      router.refresh();
    }
  }

  async function recordRedTeam(result: "PASS" | "FAIL") {
    if (await post(`/api/projects/${projectId}/redteam`, { result, notes })) {
      setNotes("");
      router.refresh();
    }
  }

  async function deliver() {
    const result = await post(`/api/projects/${projectId}/deliver`);
    if (result) {
      setDeliveredUrl(result.downloadUrl);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {status === "PRODUCTION" && (
        <button
          onClick={markProductionComplete}
          disabled={loading}
          className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Mark production complete → send to independent QA
        </button>
      )}

      {(status === "QA_PENDING" || status === "RED_TEAM_PENDING") && (
        <div className="flex flex-col gap-2 rounded border border-slate-200 p-3">
          <label className="text-xs font-semibold uppercase text-slate-500">
            {status === "QA_PENDING" ? "QA Inspector review notes" : "Red-Team Reviewer findings"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="What did you check? What did you find?"
          />
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={() => (status === "QA_PENDING" ? recordQA("PASS") : recordRedTeam("PASS"))}
              className="rounded bg-green-700 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Pass
            </button>
            <button
              disabled={loading}
              onClick={() => (status === "QA_PENDING" ? recordQA("FAIL") : recordRedTeam("FAIL"))}
              className="rounded bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Fail (send back to production)
            </button>
          </div>
        </div>
      )}

      {status === "READY_FOR_DELIVERY" && !deliveredUrl && (
        <button
          onClick={deliver}
          disabled={loading}
          className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Deliver to buyer (generates signed link, sends both emails)
        </button>
      )}

      {deliveredUrl && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
          <p className="font-semibold">Delivered.</p>
          <p className="break-all">
            Download link: <a className="underline" href={deliveredUrl}>{deliveredUrl}</a>
          </p>
        </div>
      )}

      {status === "DELIVERED" && !deliveredUrl && (
        <p className="text-sm text-slate-500">Already delivered — see the audit log for the download link event.</p>
      )}
    </div>
  );
}
