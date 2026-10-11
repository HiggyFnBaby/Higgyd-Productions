import type { BillingProvider, CheckoutSessionParams, NormalizedSubscriptionEvent } from "@/lib/billing/types";

// IMPORTANT — read before touching this file or going live with it:
//
// Payhip has no API for creating a checkout session (unlike Stripe). Its
// "direct checkout link" is a static URL for a product you create by hand
// in the Payhip dashboard; the only thing we can do programmatically is
// build that URL with metadata query params, which Payhip documents as
// being passed through into the webhook payload. See
// https://help.payhip.com/article/126-direct-checkout-link
//
// Payhip's webhook payload SHAPE is NOT confirmed from official docs as of
// this writing — help.payhip.com/article/115-webhooks confirms the four
// event names (paid, refunded, subscription.created, subscription.deleted)
// and the retry behavior (must return HTTP 200, else retried hourly for 3
// hours), but not the exact JSON field names. The parsing below is a
// best-effort first pass based on the most common conventions other
// providers use (a top-level "type" field, a nested "data" object, metadata
// echoed back under "data.metadata"). **The first real webhook delivery
// must be checked against the logged raw payload (see the webhook route)
// and this parsing adjusted if the field names don't match.** Don't trust
// this as correct until that's done once against a real delivery.
//
// Signature verification: Payhip's own signing method isn't reliably
// documented either (conflicting, unconfirmed third-party claims). Rather
// than implement a guessed HMAC check that might be silently wrong, this
// provider's webhook route checks a shared secret token in the URL itself
// (?token=...) — set PAYHIP_WEBHOOK_TOKEN to a random value, and put that
// same value in the webhook URL you configure in Payhip's Settings >
// Developer tab. That's a real, standard security mechanism (an unguessable
// URL) — weaker than a cryptographic signature, but honest about what we
// can actually verify given Payhip's documentation gap, rather than
// pretending to check a signature we can't confirm the shape of.

function productLink(): string {
  const link = process.env.PAYHIP_PRODUCT_LINK;
  if (!link) throw new Error("PAYHIP_PRODUCT_LINK is not set — see .env.example.");
  return link;
}

function mapPayhipStatus(eventType: string): NormalizedSubscriptionEvent["status"] | null {
  switch (eventType) {
    case "subscription.created":
    case "paid":
      return "ACTIVE";
    case "subscription.deleted":
      return "CANCELED";
    case "refunded":
      return "CANCELED";
    default:
      return null;
  }
}

export const payhipProvider: BillingProvider = {
  name: "PAYHIP",

  isConfigured() {
    return Boolean(process.env.PAYHIP_PRODUCT_LINK && process.env.PAYHIP_WEBHOOK_TOKEN);
  },

  async createCheckoutSession({ agentId }: CheckoutSessionParams) {
    // successUrl/cancelUrl are intentionally unused here: Payhip's
    // post-purchase redirect is a store-wide (or per-product) dashboard
    // setting, not something passable per checkout — see
    // https://help.payhip.com/article/97-checkout-redirect. Set that in the
    // Payhip dashboard to point back at /dashboard/billing?checkout=success.
    const url = `https://payhip.com/buy?link=${encodeURIComponent(productLink())}&metadata[agentId]=${encodeURIComponent(agentId)}`;
    return { url };
  },

  async parseWebhookEvent(rawBody: string): Promise<NormalizedSubscriptionEvent | null> {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error("Payhip webhook body was not valid JSON.");
    }

    const eventType = (payload.type as string) ?? (payload.event as string);
    if (!eventType) {
      throw new Error(
        "Could not find an event type field in the Payhip webhook payload — see the comment at the top of payhip.ts, this needs fixing against a real payload."
      );
    }

    const status = mapPayhipStatus(eventType);
    if (!status) return null; // an event type we don't track (e.g. unrecognized)

    const data = (payload.data as Record<string, unknown>) ?? payload;
    const metadata = (data.metadata as Record<string, unknown>) ?? (payload.metadata as Record<string, unknown>);
    const agentId = metadata?.agentId as string | undefined;
    if (!agentId) {
      throw new Error(
        "Payhip webhook payload had no metadata.agentId — the metadata echo-back may be shaped differently than expected. Check the raw payload logged by the webhook route."
      );
    }

    const providerIdentifier =
      (data.subscription_id as string) ??
      (data.id as string) ??
      (data.email as string) ??
      "unknown";

    return {
      agentId,
      providerCustomerId: (data.email as string) ?? providerIdentifier,
      providerSubscriptionId: providerIdentifier,
      status,
      priceId: undefined,
      currentPeriodEnd: undefined,
    };
  },
};
