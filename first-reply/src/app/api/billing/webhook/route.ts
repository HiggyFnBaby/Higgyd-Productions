import { NextResponse } from "next/server";
import { getBillingProvider } from "@/lib/billing";
import { applySubscriptionEvent } from "@/lib/billing/applyEvent";

// Stripe-specific — this exact path is already configured as the webhook
// endpoint in Stripe's dashboard (test mode), so it's kept unchanged rather
// than renamed/merged when Payhip was added. Payhip has its own separate
// route: src/app/api/billing/webhook/payhip/route.ts.
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

  const result = await applySubscriptionEvent(event, getBillingProvider().name);
  if (result === "unknown-agent") {
    console.warn(`[billing/webhook] ignoring event for unknown agent ${event.agentId}`);
  }

  return NextResponse.json({ received: true });
}
