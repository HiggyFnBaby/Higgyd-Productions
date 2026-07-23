import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAGE_LABEL } from "@/lib/stages";
import { AgentRunPanel } from "@/components/AgentRunPanel";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const workspaceId = session!.user.workspaceId;

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId },
    include: {
      agentRuns: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-1/3">
        <h1 className="text-xl font-bold">{lead.name}</h1>
        {lead.company && <p className="text-slate-600">{lead.company}</p>}
        <p className="mt-2 text-sm">
          Stage: <span className="font-semibold">{STAGE_LABEL[lead.stage]}</span>
        </p>

        <h2 className="mt-6 text-sm font-semibold">Open tasks (auto-created on stage change)</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {lead.tasks.length === 0 && <li className="text-sm text-slate-500">No tasks yet.</li>}
          {lead.tasks.map((task) => (
            <li key={task.id} className={`rounded border border-slate-200 p-2 text-sm ${task.done ? "line-through text-slate-400" : ""}`}>
              {task.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:w-2/3">
        <AgentRunPanel leadId={lead.id} stage={lead.stage} agentRuns={lead.agentRuns} />
      </div>
    </div>
  );
}
