import { NextResponse } from "next/server";
import Stripe from "stripe";
import { OfferStatus, OrderStatus, ProjectStatus, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhookEvent } from "@/lib/stripe";
import { logAuditEvent } from "@/lib/audit";
import { generateProductionDraft } from "@/lib/production";
import { OFFER_CATALOG } from "@/lib/offers";

// Project creation only ever happens here, only after signature
// verification, and only from a real checkout.session.completed event.
// See ../../../../../docs/threat-model.md #1, #2, #10 — this is the one
// route in the app that is allowed to treat "payment happened" as true.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = verifyStripeWebhookEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Recognized-but-irrelevant event — 200 so Stripe doesn't retry forever.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const offerId = session.metadata?.offerId;
  if (!offerId) {
    return NextResponse.json({ error: "Missing offerId in session metadata" }, { status: 400 });
  }

  // Idempotent: a duplicate webhook delivery for the same session must not
  // create a second Order/Project.
  const existingOrder = await prisma.order.findUnique({ where: { stripeSessionId: session.id } });
  if (existingOrder) {
    return NextResponse.json({ received: true, orderId: existingOrder.id });
  }

  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { lead: true } });
  if (!offer) {
    return NextResponse.json({ error: "Offer referenced by webhook not found" }, { status: 404 });
  }

  const catalogEntry = OFFER_CATALOG[offer.package];

  const order = await prisma.order.create({
    data: {
      offerId: offer.id,
      leadId: offer.leadId,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      amountCents: session.amount_total ?? offer.priceCents,
      currency: session.currency ?? offer.currency,
      status: OrderStatus.PAID,
      paidAt: new Date(),
    },
  });

  await prisma.offer.update({ where: { id: offer.id }, data: { status: OfferStatus.PAID } });
  await prisma.lead.update({ where: { id: offer.leadId }, data: { status: LeadStatus.WON } });

  // Production Agent's first automatic pass — a read-only-input,
  // no-external-effect action, so it's safe to run without a separate
  // owner click, unlike the QA/red-team/delivery gates that follow. Calls
  // Claude when ANTHROPIC_API_KEY is configured, else falls back to the
  // deterministic template — see ../../../../../docs/owner-decisions-needed.md
  // #3. This does mean the webhook response is a little slower when the
  // Claude path runs (a few seconds for a short markdown report); acceptable
  // for v1's order volume, worth revisiting (e.g. moving generation off the
  // webhook's critical path) if that ever becomes a real bottleneck.
  const draft = await generateProductionDraft(offer.lead);

  const project = await prisma.project.create({
    data: {
      orderId: order.id,
      leadId: offer.leadId,
      name: `${catalogEntry.name} — ${offer.lead.name}`,
      status: ProjectStatus.PRODUCTION,
      artifacts: {
        create: {
          name: `Audit Report (draft — ${draft.source === "claude" ? "Claude" : "template"})`,
          content: draft.content,
          version: 1,
        },
      },
    },
  });

  await logAuditEvent({
    actor: draft.source === "claude" ? "Production Agent (Claude)" : "Production Agent (template)",
    action: "VERIFY_PAYMENT_AND_CREATE_PROJECT",
    entityType: "Order",
    entityId: order.id,
    metadata: {
      offerId: offer.id,
      projectId: project.id,
      amountCents: order.amountCents,
      draftSource: draft.source,
    },
  });

  return NextResponse.json({ received: true, orderId: order.id, projectId: project.id });
}
