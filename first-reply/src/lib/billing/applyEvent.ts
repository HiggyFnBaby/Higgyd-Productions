import { prisma } from "@/lib/prisma";
import type { BillingProviderName } from "@prisma/client";
import type { NormalizedSubscriptionEvent } from "@/lib/billing/types";

// Shared by every provider's webhook route (one per provider — see
// src/app/api/billing/webhook/route.ts for Stripe,
// src/app/api/billing/webhook/payhip/route.ts for Payhip) so the upsert
// logic exists exactly once. Idempotent: keyed on agentId (one subscription
// per agent), so a replayed event just re-applies the same state instead of
// creating a second row.
export async function applySubscriptionEvent(
  event: NormalizedSubscriptionEvent,
  providerName: BillingProviderName
): Promise<"applied" | "unknown-agent"> {
  // Guard against a webhook for an agent that no longer exists (deleted
  // account, or a test-mode event pointed at the wrong database).
  const agent = await prisma.agent.findUnique({ where: { id: event.agentId }, select: { id: true } });
  if (!agent) return "unknown-agent";

  await prisma.subscription.upsert({
    where: { agentId: event.agentId },
    create: {
      agentId: event.agentId,
      provider: providerName,
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

  return "applied";
}
