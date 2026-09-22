"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus } from "@prisma/client";

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  WON: "Won",
  LOST: "Lost",
};

export function LeadList({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      router.refresh();
    }
  }

  if (leads.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No leads yet — share your capture link above to start receiving them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {leads.map((lead) => (
        <div key={lead.id} className="flex items-center justify-between rounded border border-slate-200 bg-white p-3">
          <div>
            <p className="font-medium">{lead.name}</p>
            <p className="text-xs text-slate-500">
              {lead.email}
              {lead.phone ? ` · ${lead.phone}` : ""}
            </p>
            {lead.message && <p className="mt-1 text-sm text-slate-600">{lead.message}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {lead.instantReplyAt ? "Instant reply sent" : "Instant reply pending"}
              {lead.touch2SentAt ? " · 3-day follow-up sent" : ""}
              {lead.touch3SentAt ? " · 10-day follow-up sent" : ""}
            </p>
          </div>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
            className="rounded border border-slate-200 px-2 py-1 text-xs"
          >
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
