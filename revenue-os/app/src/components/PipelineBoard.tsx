"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead, PipelineStage } from "@prisma/client";
import { STAGE_ORDER, STAGE_LABEL, STAGE_COLOR } from "@/lib/stages";

export function PipelineBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company }),
    });
    setCreating(false);
    if (res.ok) {
      const lead = await res.json();
      setLeads((prev) => [lead, ...prev]);
      setName("");
      setCompany("");
      router.refresh();
    }
  }

  async function handleStageChange(leadId: string, stage: PipelineStage) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          placeholder="New lead name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Add lead
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {STAGE_ORDER.map((stage) => (
          <div key={stage} className={`rounded border-t-4 bg-white p-3 ${STAGE_COLOR[stage]}`}>
            <h2 className="mb-2 text-sm font-semibold">{STAGE_LABEL[stage]}</h2>
            <div className="flex flex-col gap-2">
              {leads
                .filter((lead) => lead.stage === stage)
                .map((lead) => (
                  <div key={lead.id} className="rounded border border-slate-200 p-2 text-sm">
                    <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.name}
                    </Link>
                    {lead.company && <div className="text-xs text-slate-500">{lead.company}</div>}
                    <select
                      value={lead.stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value as PipelineStage)}
                      className="mt-2 w-full rounded border border-slate-200 text-xs"
                    >
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
