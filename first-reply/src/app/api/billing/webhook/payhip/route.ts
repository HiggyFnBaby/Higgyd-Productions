import { NextResponse } from "next/server";
import { getBillingProviderByName } from "@/lib/billing";
import { applySubscriptionEvent } from "@/lib/billing/applyEvent";

// Payhip-specific. See the long comment at the top of
// src/lib/billing/payhip.ts before changing this file — short version:
// Payhip's webhook signature scheme isn't reliably documented, so this
// route checks a shared secret token in the URL query string instead of a
// body/header signature. Configure this exact URL (with the token) as the
// webhook endpoint in Payhip's Settings > Developer tab:
//
//   https://<your-domain>/api/billing/webhook/payhip?token=<PAYHIP_WEBHOOK_TOKEN>
//
// Also logs the raw payload on every call — intentional while the first
// real deliveries are checked against the best-effort parsing in
// payhip.ts's parseWebhookEvent. Remove the log once that's confirmed.
export async function POST(request: Request) {
  const expectedToken = process.env.PAYHIP_WEBHOOK_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "PAYHIP_WEBHOOK_TOKEN is not set" }, { status: 503 });
  }

  const providedToken = new URL(request.url).searchParams.get("token");
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  console.log("[billing/webhook/payhip] raw payload:", rawBody);

  let event;
  try {
    event = await getBillingProviderByName("payhip").parseWebhookEvent(rawBody, "");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    console.error("[billing/webhook/payhip]", message);
    // Still 200: Payhip retries hourly for 3 hours on anything but 200, and
    // a parsing bug on our side won't be fixed by a retry — better to see
    // it in logs once than have it hammer the endpoint for 3 hours.
    return NextResponse.json({ received: true, error: message });
  }

  if (!event) {
    return NextResponse.json({ received: true });
  }

  const result = await applySubscriptionEvent(event, "PAYHIP");
  if (result === "unknown-agent") {
    console.warn(`[billing/webhook/payhip] ignoring event for unknown agent ${event.agentId}`);
  }

  return NextResponse.json({ received: true });
}
