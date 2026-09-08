import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { ProjectGateActions } from "@/components/ProjectGateActions";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      order: { include: { offer: { include: { lead: true } } } },
      artifacts: { orderBy: { version: "desc" } },
      qaReviews: { orderBy: { createdAt: "desc" } },
      redTeamReviews: { orderBy: { createdAt: "desc" } },
      delivery: true,
    },
  });
  if (!project) notFound();

  const lead = project.order.offer.lead;
  const latestArtifact = project.artifacts[0];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-1/2">
        <h1 className="text-xl font-bold">{project.name}</h1>
        <p className="text-sm text-slate-500">
          {lead.name} ({lead.email})
        </p>
        <div className="mt-2">
          <StatusBadge status={project.status} />
        </div>

        <h2 className="mt-6 text-sm font-semibold">Gate actions</h2>
        <div className="mt-2">
          <ProjectGateActions projectId={project.id} status={project.status} />
        </div>

        <h2 className="mt-6 text-sm font-semibold">Review history</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {project.qaReviews.map((review) => (
            <li key={review.id} className="rounded border border-slate-200 p-2">
              QA — <StatusBadge status={review.result} /> {review.notes && <span> — {review.notes}</span>}
            </li>
          ))}
          {project.redTeamReviews.map((review) => (
            <li key={review.id} className="rounded border border-slate-200 p-2">
              Red-team — <StatusBadge status={review.result} /> {review.notes && <span> — {review.notes}</span>}
            </li>
          ))}
          {project.qaReviews.length === 0 && project.redTeamReviews.length === 0 && (
            <li className="text-slate-500">No reviews recorded yet.</li>
          )}
        </ul>
      </div>

      <div className="lg:w-1/2">
        <h2 className="mb-2 text-sm font-semibold">Latest artifact (v{latestArtifact?.version ?? "—"})</h2>
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs">
          {latestArtifact?.content ?? "No artifact yet."}
        </pre>
      </div>
    </div>
  );
}
