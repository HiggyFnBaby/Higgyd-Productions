"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentRun, PipelineStage } from "@prisma/client";

const AGENT_LABEL: Record<string, string> = {
  MARKET_SIGNAL_RESEARCHER: "Market Signal Researcher",
  OFFER_ARCHITECT: "Offer Architect",
  CONTENT_ANGLE_STRATEGIST: "Content Angle Strategist",
  CONVERSATION_SYSTEM_BUILDER: "Conversation System Builder",
};

const NO_AGENT_STAGES: PipelineStage[] = ["WON", "LOST"];

export function AgentRunPanel({
  leadId,
  stage,
  agentRuns,
}: {
  leadId: string;
  stage: PipelineStage;
  agentRuns: AgentRun[];
}) {
  const router = useRouter();
  const [runs, setRuns] = useState(agentRuns);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/leads/${leadId}/run-agent`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Agent run failed.");
      return;
    }
    const run = await res.json();
    setRuns((prev) => [...prev, run]);
    router.refresh();
  }

  const canRun = !NO_AGENT_STAGES.includes(stage);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Agent runs</h2>
        {canRun && (
          <button
            onClick={handleRun}
            disabled={loading}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Running..." : `Run agent for this stage`}
          </button>
        )}
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {!canRun && (
        <p className="text-sm text-slate-500">
          {stage === "WON" ? "Won" : "Lost"} is an end state — log what happened as a note instead of running an agent.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {runs.length === 0 && <p className="text-sm text-slate-500">No agent runs yet.</p>}
        {runs.map((run) => (
          <div key={run.id} className="rounded border border-slate-200 p-3">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{AGENT_LABEL[run.agent] ?? run.agent}</span>
              <span>{new Date(run.createdAt).toLocaleString()}</span>
            </div>
            <pre className="whitespace-pre-wrap text-sm">{run.output}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
