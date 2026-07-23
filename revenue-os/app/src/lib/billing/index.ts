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
