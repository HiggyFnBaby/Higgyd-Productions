import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInstantReply, sendAgentNotification } from "@/lib/email";
import { canSendLeadEmails } from "@/lib/billing";

// Public on purpose — this is the endpoint an agent's lead-capture page (or
// an embedded form on their own website) posts to. There is no session
// here; the only trust boundary is agentId identifying which agent's link
// was used.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { agentId, name, email, phone, message, website } = body as {
    agentId?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    website?: string;
  };

  // Honeypot: the form renders a hidden "website" field real people never
  // see or fill in. Bots auto-fill every field. Pretend it worked so the bot
  // moves on, but record nothing and send nothing.
  if (website) {
    return NextResponse.json({ id: "ok" }, { status: 201 });
  }

  if (!agentId || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "agentId, name, and email are required" }, { status: 400 });
  }
  if (name.length > 200 || email.length > 320 || (phone && phone.length > 50) || (message && message.length > 5000)) {
    return NextResponse.json({ error: "One of the fields is too long" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { subscription: { select: { status: true } } },
  });
  if (!agent) {
    return NextResponse.json({ error: "Unknown agent link" }, { status: 404 });
  }

  // Save the lead FIRST. Whatever happens with email below, the lead exists
  // in the agent's dashboard — the product promise is "never lose a lead."
  const lead = await prisma.lead.create({
    data: { agentId, name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null, message: message?.trim() || null },
  });

  const autoReplyAllowed = canSendLeadEmails(agent.subscription?.status);
  let autoReplySent = false;

  if (autoReplyAllowed) {
    // The instant reply is the whole point of the product — send it before
    // anything else, and don't let a notification failure block it.
    try {
      await sendInstantReply(lead.email, lead.name, agent);
      await prisma.lead.update({ where: { id: lead.id }, data: { instantReplyAt: new Date() } });
      autoReplySent = true;
    } catch (err) {
      // Logged, not thrown: the lead is saved and the agent is still told
      // about it below. instantReplyAt stays null so it's visible that the
      // auto-reply didn't go out.
      console.error(`[leads] instant reply failed for lead ${lead.id}:`, err);
    }
  }

  try {
    await sendAgentNotification(agent.email, agent.name, lead, { autoReplySent });
  } catch (err) {
    console.error(`[leads] agent notification failed for lead ${lead.id}:`, err);
  }

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
