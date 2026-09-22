import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAgentId } from "@/lib/currentAgent";
import { getBillingProvider } from "@/lib/billing";

// Starts a subscription checkout for the logged-in agent. The agent's own
// session is the only place the agentId comes from — never the request body.
export async function POST(request: Request) {
  const agentId = await requireAgentId();
  const session = await getServerSession(authOptions);
  if (!agentId || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  try {
    const { url } = await getBillingProvider().createCheckoutSession({
      agentId,
      customerEmail: session.user.email,
      successUrl: `${origin}/dashboard/billing?checkout=success`,
      cancelUrl: `${origin}/dashboard/billing?checkout=cancelled`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    // Most likely cause: Stripe env vars not set yet. Log the real reason
    // server-side, give the browser a generic message.
    console.error("[billing/checkout]", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
