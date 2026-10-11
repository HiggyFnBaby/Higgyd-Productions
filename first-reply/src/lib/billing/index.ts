import type { SubscriptionStatus } from "@prisma/client";
import type { BillingProvider } from "@/lib/billing/types";
import { stripeProvider } from "@/lib/billing/stripe";
import { payhipProvider } from "@/lib/billing/payhip";

// Two providers can be configured and offered to agents at once (e.g. "pay
// by card" and "pay via Payhip") — unlike the single-BILLING_PROVIDER setup
// revenue-os/app uses. The checkout route picks one by key; the billing
// page renders a button per provider that's actually configured.
const PROVIDERS = {
  stripe: stripeProvider,
  payhip: payhipProvider,
} as const;

export type ProviderKey = keyof typeof PROVIDERS;

export function isProviderKey(value: unknown): value is ProviderKey {
  return typeof value === "string" && value in PROVIDERS;
}

export function getBillingProviderByName(key: ProviderKey): BillingProvider {
  return PROVIDERS[key];
}

// Kept for any call site that just wants "the" provider (e.g. the webhook
// route, which is provider-specific per URL, not per env var, for Stripe's
// existing path — see src/app/api/billing/webhook/route.ts).
export function getBillingProvider(): BillingProvider {
  const provider = process.env.BILLING_PROVIDER ?? "stripe";
  if (!isProviderKey(provider)) {
    throw new Error(`Unknown BILLING_PROVIDER "${provider}".`);
  }
  return PROVIDERS[provider];
}

// What the billing page actually shows buttons for — only providers whose
// required env vars are set, so nothing renders a button that 500s.
export function listConfiguredBillingProviders(): Array<{ key: ProviderKey; provider: BillingProvider }> {
  return (Object.entries(PROVIDERS) as Array<[ProviderKey, BillingProvider]>)
    .filter(([, provider]) => provider.isConfigured())
    .map(([key, provider]) => ({ key, provider }));
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
