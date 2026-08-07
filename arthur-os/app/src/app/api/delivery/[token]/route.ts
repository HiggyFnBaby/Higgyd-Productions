import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDownloadToken } from "@/lib/delivery";
import { logAuditEvent } from "@/lib/audit";

// Public endpoint — the buyer's signed link. See
// ../../../../../../docs/threat-model.md #5-6: both the HMAC signature AND
// the server-side Delivery row's expiresAt must agree, independently.
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const delivery = await prisma.delivery.findUnique({
    where: { downloadToken: params.token },
    include: { project: { include: { artifacts: { orderBy: { version: "desc" }, take: 1 } } } },
  });

  if (!delivery) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  if (delivery.expiresAt < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }
  if (!verifyDownloadToken(params.token, delivery.projectId)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 403 });
  }

  const artifact = delivery.project.artifacts[0];
  if (!artifact) return NextResponse.json({ error: "No deliverable found" }, { status: 404 });

  await logAuditEvent({
    actor: "Buyer (signed link)",
    action: "DOWNLOAD_DELIVERABLE",
    entityType: "Project",
    entityId: delivery.projectId,
  });

  return new NextResponse(artifact.content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${artifact.name.replace(/[^a-z0-9-_ ]/gi, "")}.md"`,
    },
  });
}
