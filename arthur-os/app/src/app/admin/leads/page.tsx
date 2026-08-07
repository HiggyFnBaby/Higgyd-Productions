import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Lead inbox</h1>
      <p className="mb-6 text-sm text-slate-600">
        Every submission from the public /audit form, auto-scored by the Lead Hunter contract.
      </p>

      <div className="flex flex-col gap-2">
        {leads.length === 0 && <p className="text-sm text-slate-500">No leads yet.</p>}
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/admin/leads/${lead.id}`}
            className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium">{lead.name}</div>
              <div className="text-xs text-slate-500">
                {lead.email} · score {lead.qualificationScore} · {lead.createdAt.toISOString().slice(0, 10)}
              </div>
            </div>
            <StatusBadge status={lead.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
