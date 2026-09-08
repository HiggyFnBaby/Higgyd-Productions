import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { include: { offer: { include: { lead: true } } } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Projects</h1>
      <p className="mb-6 text-sm text-slate-600">
        Created only after a verified Stripe payment. Each moves through production, independent QA, red-team
        review, and delivery.
      </p>

      <div className="flex flex-col gap-2">
        {projects.length === 0 && <p className="text-sm text-slate-500">No projects yet — paid orders create one automatically.</p>}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/projects/${project.id}`}
            className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium">{project.name}</div>
              <div className="text-xs text-slate-500">{project.order.offer.lead.email}</div>
            </div>
            <StatusBadge status={project.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
