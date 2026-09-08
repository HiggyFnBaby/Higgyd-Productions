import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";

// Implements the production-agent contract's hand-off point
// (../../../../../../.claude/agents/production-agent.md): production marks
// its own work "done," but never marks it "passed" — that's QA/red-team's
// job, in separate routes, by a different actor. See
// ../../../../../../docs/threat-model.md #8.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.status !== ProjectStatus.PRODUCTION) {
    return NextResponse.json({ error: `Project is not in PRODUCTION (currently ${project.status})` }, { status: 409 });
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { status: ProjectStatus.QA_PENDING },
  });

  await logAuditEvent({
    actor: "Owner (acting as Production Agent handoff)",
    action: "MARK_PRODUCTION_COMPLETE",
    entityType: "Project",
    entityId: project.id,
  });

  return NextResponse.json(updated);
}
