import { NextResponse } from "next/server";
import { OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";
import { approveOfferAndCreateCheckout } from "@/lib/offerApproval";

// Manual owner approval — always available regardless of Operating Mode or
// price, even for offers the policy engine (../../../../../../src/lib/policy.ts)
// would have auto-approved on creation. Custom-priced offers (and
// standard-priced ones in Admin mode) only ever reach CHECKOUT_CREATED
// through this route — see ../../../../../../docs/approval-policy-matrix.md
// and owner-decisions-needed.md #4.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { lead: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.status !== OfferStatus.DRAFT && offer.status !== OfferStatus.PENDING_OWNER_APPROVAL) {
    return NextResponse.json({ error: `Offer is already ${offer.status}` }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const updated = await approveOfferAndCreateCheckout(offer, offer.lead, origin);

  await logAuditEvent({
    actor: "Owner",
    action: "APPROVE_OFFER_AND_CREATE_CHECKOUT",
    entityType: "Offer",
    entityId: offer.id,
    metadata: { stripeCheckoutSessionId: updated.stripeCheckoutSessionId },
  });

  return NextResponse.json(updated);
}
