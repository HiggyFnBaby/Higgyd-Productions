import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId } from "@/lib/currentWorkspace";
import { runAgentForLead } from "@/lib/anthropic";

// Runs the agent appropriate for the lead's *current* stage (see
// AGENT_FOR_STAGE in lib/agents.ts) against that lead and saves the result.
// This does not advance the stage automatically — moving to the next stage
// is a deliberate human decision (see the runbook's "decision points that
// are yours, not the agents'" section), triggered separately via PATCH.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findFirst({ where: { id: params.id, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const priorRuns = await prisma.agentRun.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
  });

  let result;
  try {
    result = await runAgentForLead(lead, priorRuns);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent run failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const agentRun = await prisma.agentRun.create({
    data: {
      leadId: lead.id,
      agent: result.agent,
      input: result.input,
      output: result.output,
      model: result.model,
    },
  });

  return NextResponse.json(agentRun, { status: 201 });
}
