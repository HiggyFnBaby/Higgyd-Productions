import { NextResponse } from "next/server";
import { LeadStatus, OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";
import { createOfferCheckoutSession } from "@/lib/stripe";

// Payments stay behind an owner-approval gate in every Operating Mode — see
// ../../../../../../docs/approval-policy-matrix.md. This is the one action
// in the whole slice that both approves an Offer AND creates a real (test
// mode) Stripe Checkout Session, deliberately combined into one explicit,
// audited owner click rather than split across two so there's no path where
// an offer is "approved" without a checkout link existing yet, or vice versa.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { lead: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.status !== OfferStatus.DRAFT && offer.status !== OfferStatus.PENDING_OWNER_APPROVAL) {
    return NextResponse.json({ error: `Offer is already ${offer.status}` }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const session = await createOfferCheckoutSession(offer, offer.lead, origin);

  const updated = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      status: OfferStatus.CHECKOUT_CREATED,
      approvedAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripeCheckoutUrl: session.url,
    },
  });

  await prisma.lead.update({ where: { id: offer.leadId }, data: { status: LeadStatus.OFFER_APPROVED } });

  await logAuditEvent({
    actor: "Owner",
    action: "APPROVE_OFFER_AND_CREATE_CHECKOUT",
    entityType: "Offer",
    entityId: offer.id,
    metadata: { stripeCheckoutSessionId: session.id },
  });

  return NextResponse.json(updated);
}
