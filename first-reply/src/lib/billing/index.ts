import type { SubscriptionStatus } from "@prisma/client";
import type { BillingProvider } from "@/lib/billing/types";
import { stripeProvider } from "@/lib/billing/stripe";

// Only Stripe is implemented in v1. To add Paddle or LemonSqueezy later:
// write src/lib/billing/paddle.ts implementing the same BillingProvider
// interface, add a case below, and set BILLING_PROVIDER=paddle in .env.
// Nothing in the checkout route, webhook route, or billing page changes.
export function getBillingProvider(): BillingProvider {
  const provider = process.env.BILLING_PROVIDER ?? "stripe";

  switch (provider) {
    case "stripe":
      return stripeProvider;
    default:
      throw new Error(
        `Unknown BILLING_PROVIDER "${provider}" — only "stripe" is implemented so far.`
      );
  }
}

// "Is this agent a paying customer right now?" — the one definition the
// rest of the app uses, so the rule lives in exactly one place. TRIALING
// counts as paid so a free trial (if one is ever configured on the Stripe
// Price) doesn't lock people out mid-trial.
export function isSubscribed(status: SubscriptionStatus | undefined | null): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

// Whether an unpaid agent should still get the lead-facing emails. Defaults
// to OFF so local dev and the current proven-in-test setup keep working with
// no Stripe configured at all. Set BILLING_REQUIRED=true in production once
// real checkout is live — then unpaid agents still get every lead recorded
// and still get the "new lead" notification (a lead is never lost), but the
// automatic instant reply and follow-ups to the lead stop until they pay.
export function billingRequired(): boolean {
  return process.env.BILLING_REQUIRED === "true";
}

export function canSendLeadEmails(status: SubscriptionStatus | undefined | null): boolean {
  return !billingRequired() || isSubscribed(status);
}
