import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceId, requireActiveWorkspaceId } from "@/lib/currentWorkspace";

export async function GET() {
  const workspaceId = await requireWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await prisma.lead.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  // Creating leads is gated (not just viewing) — it's how the product gets
  // used, so it's what an expired trial should actually stop.
  const access = await requireActiveWorkspaceId();
  if ("errorResponse" in access) return access.errorResponse;
  const { workspaceId } = access;

  const body = await request.json();
  const { name, company, contactInfo, notes } = body as {
    name?: string;
    company?: string;
    contactInfo?: string;
    notes?: string;
  };

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const lead = await prisma.lead.create({
    data: { workspaceId, name, company, contactInfo, notes },
  });

  return NextResponse.json(lead, { status: 201 });
}
