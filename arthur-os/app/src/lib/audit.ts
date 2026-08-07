import { prisma } from "@/lib/prisma";

// Every route handler that changes state calls this. No update/delete path
// exists for AuditEvent anywhere in this app — it is append-only by
// construction, per governance rule 7 in ../../CLAUDE.md and
// ../../docs/threat-model.md #9.
export async function logAuditEvent(params: {
  actor: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      actor: params.actor,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as any,
    },
  });
}
