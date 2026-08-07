import { NextResponse } from "next/server";
import { ProjectStatus, ReviewResult } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";
import { generateDownloadToken, DELIVERY_LINK_TTL_MS } from "@/lib/delivery";
import { getEmailProvider } from "@/lib/email";
import { buyerThankYouEmail, ownerSaleNotificationEmail } from "@/lib/email/templates";

// Implements delivery-agent + customer-success-agent's send-triggering
// contract. Defense in depth: even though the UI only shows this action
// once the project is READY_FOR_DELIVERY, this route independently
// re-checks for a passing QAReview AND a passing RedTeamReview before
// proceeding — see ../../../../../../docs/acceptance-criteria.md's
// "Delivery" section and ../../../../../../docs/threat-model.md #8.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      qaReviews: { where: { result: ReviewResult.PASS }, take: 1 },
      redTeamReviews: { where: { result: ReviewResult.PASS }, take: 1 },
      artifacts: { orderBy: { version: "desc" }, take: 1 },
      order: { include: { offer: { include: { lead: true } } } },
      delivery: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.status !== ProjectStatus.READY_FOR_DELIVERY) {
    return NextResponse.json(
      { error: `Project is not READY_FOR_DELIVERY (currently ${project.status})` },
      { status: 409 }
    );
  }
  if (project.qaReviews.length === 0 || project.redTeamReviews.length === 0) {
    return NextResponse.json(
      { error: "A passing QA review and a passing red-team review are both required before delivery." },
      { status: 409 }
    );
  }
  if (project.delivery) {
    return NextResponse.json({ error: "Project already delivered" }, { status: 409 });
  }

  const { lead } = project.order.offer;
  const offer = project.order.offer;

  const token = generateDownloadToken(project.id);
  const expiresAt = new Date(Date.now() + DELIVERY_LINK_TTL_MS);

  const delivery = await prisma.delivery.create({
    data: { projectId: project.id, downloadToken: token, expiresAt, deliveredAt: new Date() },
  });

  await prisma.project.update({ where: { id: project.id }, data: { status: ProjectStatus.DELIVERED } });

  const origin = new URL(request.url).origin;
  const downloadUrl = `${origin}/api/delivery/${token}`;
  const emailProvider = getEmailProvider();

  const buyerEmail = buyerThankYouEmail(lead, offer, downloadUrl, expiresAt);
  const buyerResult = await emailProvider.send({ to: lead.email, subject: buyerEmail.subject, html: buyerEmail.html });
  await prisma.emailEvent.create({
    data: {
      type: "BUYER_THANK_YOU",
      to: lead.email,
      subject: buyerEmail.subject,
      status: buyerResult.status,
      body: buyerEmail.html,
      error: buyerResult.error,
    },
  });

  const ownerEmail = process.env.OWNER_EMAIL ?? "owner@example.com";
  const ownerNotification = ownerSaleNotificationEmail(lead, offer, project.order);
  const ownerResult = await emailProvider.send({
    to: ownerEmail,
    subject: ownerNotification.subject,
    html: ownerNotification.html,
  });
  await prisma.emailEvent.create({
    data: {
      type: "OWNER_SALE_NOTIFICATION",
      to: ownerEmail,
      subject: ownerNotification.subject,
      status: ownerResult.status,
      body: ownerNotification.html,
      error: ownerResult.error,
    },
  });

  await logAuditEvent({
    actor: "Owner (Delivery Agent handoff)",
    action: "DELIVER_PROJECT",
    entityType: "Project",
    entityId: project.id,
    metadata: {
      deliveryId: delivery.id,
      buyerEmailStatus: buyerResult.status,
      ownerEmailStatus: ownerResult.status,
    },
  });

  return NextResponse.json({ delivered: true, downloadUrl, expiresAt });
}
