import { NextResponse } from "next/server";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAgentId } from "@/lib/currentAgent";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const agentId = await requireAgentId();
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findFirst({ where: { id: params.id, agentId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const status = body.status as LeadStatus | undefined;
  if (!status || !(status in LeadStatus)) {
    return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
  }

  const updated = await prisma.lead.update({ where: { id: lead.id }, data: { status } });
  return NextResponse.json(updated);
}
