import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  const { url } = await getBillingProvider().createCheckoutSession({
    workspaceId: session.user.workspaceId,
    customerEmail: session.user.email,
    successUrl: `${origin}/dashboard/billing?checkout=success`,
    cancelUrl: `${origin}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url });
}
