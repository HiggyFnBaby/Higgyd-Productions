import type { BillingProviderName, SubscriptionStatus } from "@prisma/client";

// Every payment processor (Stripe, Paddle, LemonSqueezy) implements this same
// shape. The rest of the app (checkout route, webhook route, billing page)
// only ever talks to this interface — never to a specific provider's SDK
// directly — so adding a second provider later means writing one new file
// that implements this interface, not touching checkout/webhook call sites.
export interface CheckoutSessionParams {
  workspaceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface NormalizedSubscriptionEvent {
  workspaceId: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  priceId?: string;
  currentPeriodEnd?: Date;
}

export interface BillingProvider {
  name: BillingProviderName;
  createCheckoutSession(params: CheckoutSessionParams): Promise<{ url: string }>;
  // Returns null for webhook events this provider sends that the app doesn't
  // care about (e.g. an invoice email receipt event) — not every provider
  // event maps to a subscription state change.
  parseWebhookEvent(rawBody: string, signature: string): Promise<NormalizedSubscriptionEvent | null>;
}
