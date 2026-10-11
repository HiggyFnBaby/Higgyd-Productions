import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAgentId } from "@/lib/currentAgent";
import { getBillingProviderByName, isProviderKey } from "@/lib/billing";

// Starts a subscription checkout for the logged-in agent. The agent's own
// session is the only place the agentId comes from — never the request body.
// Which provider (stripe/payhip) comes from the request body, since more
// than one can be configured at once; it's validated against the known
// provider keys, never passed straight into a lookup.
export async function POST(request: Request) {
  const agentId = await requireAgentId();
  const session = await getServerSession(authOptions);
  if (!agentId || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const providerKey = isProviderKey(body.provider) ? body.provider : "stripe";
  const provider = getBillingProviderByName(providerKey);

  if (!provider.isConfigured()) {
    return NextResponse.json({ error: `${providerKey} is not configured yet` }, { status: 503 });
  }

  const origin = new URL(request.url).origin;

  try {
    const { url } = await provider.createCheckoutSession({
      agentId,
      customerEmail: session.user.email,
      successUrl: `${origin}/dashboard/billing?checkout=success`,
      cancelUrl: `${origin}/dashboard/billing?checkout=cancelled`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    // Most likely cause: that provider's env vars not fully set yet. Log the
    // real reason server-side, give the browser a generic message.
    console.error("[billing/checkout]", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
