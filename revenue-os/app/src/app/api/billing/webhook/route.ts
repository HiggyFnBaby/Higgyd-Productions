import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBillingProvider } from "@/lib/billing";

// Provider-agnostic on purpose: this route calls parseWebhookEvent() on
// whichever provider is configured and never touches Stripe/Paddle types
// directly. The signature header name does vary by provider (Stripe uses
// "stripe-signature"); if a second provider is added, branch on a header
// this route checks for, or split into /api/billing/webhook/[provider].
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = await getBillingProvider().parseWebhookEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!event) {
    // Recognized-but-irrelevant event (e.g. an invoice receipt) — 200 so the
    // provider doesn't retry it forever.
    return NextResponse.json({ received: true });
  }

  await prisma.subscription.upsert({
    where: { workspaceId: event.workspaceId },
    create: {
      workspaceId: event.workspaceId,
      provider: getBillingProvider().name,
      providerCustomerId: event.providerCustomerId,
      providerSubscriptionId: event.providerSubscriptionId,
      status: event.status,
      priceId: event.priceId,
      currentPeriodEnd: event.currentPeriodEnd,
    },
    update: {
      providerCustomerId: event.providerCustomerId,
      providerSubscriptionId: event.providerSubscriptionId,
      status: event.status,
      priceId: event.priceId,
      currentPeriodEnd: event.currentPeriodEnd,
    },
  });

  return NextResponse.json({ received: true });
}
