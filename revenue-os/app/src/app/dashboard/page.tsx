import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PipelineBoard } from "@/components/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session!.user.workspaceId;

  const leads = await prisma.lead.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Pipeline</h1>
      <p className="mb-6 text-sm text-slate-600">
        Every lead moves left to right: Signal &rarr; Offer &rarr; Angle &rarr; Conversation &rarr; Won/Lost.
        Moving a lead's stage automatically logs the change and creates the next action as a task.
      </p>
      <PipelineBoard initialLeads={leads} />
    </div>
  );
}
