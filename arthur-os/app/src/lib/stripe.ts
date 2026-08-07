import Stripe from "stripe";
import type { Lead, Offer } from "@prisma/client";
import { OFFER_CATALOG } from "@/lib/offers";

// Lazily constructed so the module can be imported (and the app can build)
// without STRIPE_SECRET_KEY set — see ../../docs/threat-model.md and the
// same pattern in ../../../revenue-os/app/src/lib/billing/stripe.ts.
function client() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set — see .env.example.");
  return new Stripe(key);
}

// One-time Checkout Session (not a subscription) for the approved Offer's
// exact price — test mode until Derrick authorizes production keys, per
// ../../CLAUDE.md's PAYMENT RULES.
export async function createOfferCheckoutSession(offer: Offer, lead: Lead, origin: string) {
  const catalogEntry = OFFER_CATALOG[offer.package];

  const session = await client().checkout.sessions.create({
    mode: "payment",
    customer_email: lead.email,
    line_items: [
      {
        price_data: {
          currency: offer.currency,
          unit_amount: offer.priceCents,
          product_data: {
            name: catalogEntry.name,
            description: catalogEntry.description,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    // How the webhook maps a Stripe event back to an Offer — Stripe has no
    // concept of "offer" on its own.
    metadata: { offerId: offer.id, leadId: lead.id },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session;
}

export function verifyStripeWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set — see .env.example.");
  return client().webhooks.constructEvent(rawBody, signature, webhookSecret);
}
