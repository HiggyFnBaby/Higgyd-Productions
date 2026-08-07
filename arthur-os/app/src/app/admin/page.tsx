import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuditLogList } from "@/components/AuditLogList";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const [leadCount, qualifiedCount, projectCount, deliveredCount, events] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "QUALIFIED" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "DELIVERED" } }),
    prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Leads" value={leadCount} />
        <Stat label="Qualified" value={qualifiedCount} />
        <Stat label="Projects" value={projectCount} />
        <Stat label="Delivered" value={deliveredCount} />
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/admin/leads" className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-100">
          Review leads →
        </Link>
        <Link href="/admin/projects" className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-100">
          Review projects →
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Activity log</h2>
        <p className="mb-3 text-xs text-slate-500">
          Every consequential action, timestamped — see ../../docs/threat-model.md #9: this log is append-only,
          there is no edit/delete path.
        </p>
        <div className="rounded border border-slate-200 bg-white p-3">
          <AuditLogList events={events} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
    </div>
  );
}
