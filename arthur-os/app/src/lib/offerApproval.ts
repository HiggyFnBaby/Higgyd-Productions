import { OfferStatus, LeadStatus } from "@prisma/client";
import type { Lead, Offer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOfferCheckoutSession } from "@/lib/stripe";

// Shared by the manual approve route (/api/offers/[id]/approve) and the
// auto-approval path in the offer-creation route (/api/offers), which apply
// once ../../docs/owner-decisions-needed.md #4's policy engine says a
// standard-priced offer doesn't need a manual click in the current
// Operating Mode. Both paths must produce identical state (Offer.status,
// the Stripe checkout session/url, Lead.status) — only the actor recorded
// in the audit event differs, which each caller logs itself. Keeping this
// as one function makes it impossible for an offer to be "approved"
// without a checkout link existing yet, or vice versa.
export async function approveOfferAndCreateCheckout(offer: Offer, lead: Lead, origin: string) {
  const session = await createOfferCheckoutSession(offer, lead, origin);

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

  return updated;
}
