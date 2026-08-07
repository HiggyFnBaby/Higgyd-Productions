import { NextResponse } from "next/server";
import { ProjectStatus, ReviewResult } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";

// Implements the qa-inspector contract
// (../../../../../../.claude/agents/qa-inspector.md). A FAIL routes the
// project back to PRODUCTION per the required workflow's revision loop
// (../../../../../../CLAUDE.md's flowchart: "E -->|Fail| D").
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { result, notes } = body as { result?: ReviewResult; notes?: string };
  if (result !== ReviewResult.PASS && result !== ReviewResult.FAIL) {
    return NextResponse.json({ error: "result must be PASS or FAIL" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.status !== ProjectStatus.QA_PENDING) {
    return NextResponse.json({ error: `Project is not in QA_PENDING (currently ${project.status})` }, { status: 409 });
  }

  await prisma.qAReview.create({
    data: { projectId: project.id, reviewer: "QA Inspector (owner)", result, notes },
  });

  const nextStatus = result === ReviewResult.PASS ? ProjectStatus.RED_TEAM_PENDING : ProjectStatus.PRODUCTION;
  const updated = await prisma.project.update({ where: { id: project.id }, data: { status: nextStatus } });

  await logAuditEvent({
    actor: "QA Inspector (owner)",
    action: "QA_REVIEW",
    entityType: "Project",
    entityId: project.id,
    metadata: { result, notes },
  });

  return NextResponse.json(updated);
}
