import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInstantReply, sendAgentNotification } from "@/lib/email";

// Public on purpose — this is the endpoint an agent's lead-capture page (or
// an embedded form on their own website) posts to. There is no session
// here; the only trust boundary is agentId identifying which agent's link
// was used.
export async function POST(request: Request) {
  const body = await request.json();
  const { agentId, name, email, phone, message } = body as {
    agentId?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };

  if (!agentId || !name || !email) {
    return NextResponse.json({ error: "agentId, name, and email are required" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return NextResponse.json({ error: "Unknown agent link" }, { status: 404 });
  }

  const lead = await prisma.lead.create({
    data: { agentId, name, email, phone, message },
  });

  // The instant reply is the whole point of the product — send it before
  // anything else, and don't let a notification failure block it.
  await sendInstantReply(lead.email, lead.name, agent.name);
  await prisma.lead.update({ where: { id: lead.id }, data: { instantReplyAt: new Date() } });

  await sendAgentNotification(agent.email, agent.name, lead);

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
