import { NextResponse } from "next/server";
import { PipelineStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId, requireActiveWorkspaceId } from "@/lib/currentWorkspace";
import { changeLeadStage } from "@/lib/automations";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId },
    include: {
      agentRuns: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      stageEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const access = await requireActiveWorkspaceId();
  if ("errorResponse" in access) return access.errorResponse;
  const { workspaceId } = access;

  const lead = await prisma.lead.findFirst({ where: { id: params.id, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const stage = body.stage as PipelineStage | undefined;
  if (!stage || !(stage in PipelineStage)) {
    return NextResponse.json({ error: "A valid stage is required" }, { status: 400 });
  }

  await changeLeadStage(lead.id, stage);
  const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
  return NextResponse.json(updated);
}
