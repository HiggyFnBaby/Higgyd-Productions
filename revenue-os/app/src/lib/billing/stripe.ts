import Stripe from "stripe";
import type { BillingProvider, CheckoutSessionParams, NormalizedSubscriptionEvent } from "@/lib/billing/types";

function client() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set — see .env.example.");
  return new Stripe(key);
}

function mapStripeStatus(status: Stripe.Subscription.Status): NormalizedSubscriptionEvent["status"] {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "NONE";
  }
}

export const stripeProvider: BillingProvider = {
  name: "STRIPE",

  async createCheckoutSession({ workspaceId, customerEmail, successUrl, cancelUrl }: CheckoutSessionParams) {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRICE_ID is not set — see .env.example.");

    const session = await client().checkout.sessions.create({
      mode: "subscription",
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // metadata is how the webhook later maps a Stripe event back to a
      // workspace — Stripe has no concept of "workspace" on its own.
      metadata: { workspaceId },
      subscription_data: { metadata: { workspaceId } },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  },

  async parseWebhookEvent(rawBody: string, signature: string): Promise<NormalizedSubscriptionEvent | null> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set — see .env.example.");

    const event = client().webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type !== "customer.subscription.updated" && event.type !== "customer.subscription.created" && event.type !== "customer.subscription.deleted") {
      return null;
    }

    const subscription = event.data.object as Stripe.Subscription;
    const workspaceId = subscription.metadata?.workspaceId;
    if (!workspaceId) return null;

    return {
      workspaceId,
      providerCustomerId: subscription.customer as string,
      providerSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      priceId: subscription.items.data[0]?.price?.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  },
};
