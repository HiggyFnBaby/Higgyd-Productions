import { NextResponse } from "next/server";
import { ApprovalAction, OfferPackage, OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";
import { OFFER_CATALOG } from "@/lib/offers";
import { getSettings } from "@/lib/settings";
import { requiresApproval, isStandardPrice } from "@/lib/policy";
import { approveOfferAndCreateCheckout } from "@/lib/offerApproval";

// Implements the sales-closer agent contract
// (../../../../.claude/agents/sales-closer.md): drafts an offer. Whether it
// stays a draft awaiting a manual "Approve" click, or gets approved (Stripe
// checkout session created) immediately, now depends on the approval-policy
// engine — see ../../../../docs/approval-policy-matrix.md and
// owner-decisions-needed.md #4. Custom pricing (anything other than the
// catalog default) always requires a manual click, in every mode — sales-closer
// never sends a checkout link to the buyer itself either way, that's a
// separate, still-entirely-manual step outside this app in v1.
export async function POST(request: Request) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { leadId, priceCents } = body as { leadId?: string; priceCents?: number };

  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const catalogEntry = OFFER_CATALOG[OfferPackage.GROWTH_IN_A_BOX];
  const resolvedPriceCents =
    priceCents && priceCents > 0 ? Math.round(priceCents) : catalogEntry.defaultPriceCents;

  const offer = await prisma.offer.create({
    data: {
      leadId,
      package: OfferPackage.GROWTH_IN_A_BOX,
      priceCents: resolvedPriceCents,
      status: OfferStatus.DRAFT,
    },
  });

  await logAuditEvent({
    actor: "Sales Closer (owner-initiated)",
    action: "CREATE_OFFER",
    entityType: "Offer",
    entityId: offer.id,
    metadata: { leadId, priceCents: offer.priceCents },
  });

  const standard = isStandardPrice(offer.priceCents, offer.package);
  const action = standard ? ApprovalAction.APPROVE_STANDARD_OFFER : ApprovalAction.APPROVE_CUSTOM_OFFER;
  const { operatingMode } = await getSettings();
  const needsApproval = await requiresApproval(action, operatingMode);

  if (!needsApproval) {
    const origin = new URL(request.url).origin;
    const approved = await approveOfferAndCreateCheckout(offer, lead, origin);

    await logAuditEvent({
      actor: "Arthur (Sales Closer — auto-approved per policy)",
      action: "AUTO_APPROVE_OFFER_AND_CREATE_CHECKOUT",
      entityType: "Offer",
      entityId: offer.id,
      metadata: { operatingMode, stripeCheckoutSessionId: approved.stripeCheckoutSessionId },
    });

    return NextResponse.json(approved, { status: 201 });
  }

  return NextResponse.json(offer, { status: 201 });
}
