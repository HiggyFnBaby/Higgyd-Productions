import { NextResponse } from "next/server";
import { OfferPackage, OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/requireOwner";
import { logAuditEvent } from "@/lib/audit";
import { OFFER_CATALOG } from "@/lib/offers";

// Implements the sales-closer agent contract
// (../../../../.claude/agents/sales-closer.md): drafts an offer, never
// approves or sends it — that's a separate action in
// /api/offers/[id]/approve.
export async function POST(request: Request) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { leadId, priceCents } = body as { leadId?: string; priceCents?: number };

  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const catalogEntry = OFFER_CATALOG[OfferPackage.GROWTH_IN_A_BOX];

  const offer = await prisma.offer.create({
    data: {
      leadId,
      package: OfferPackage.GROWTH_IN_A_BOX,
      priceCents: priceCents && priceCents > 0 ? Math.round(priceCents) : catalogEntry.defaultPriceCents,
      status: OfferStatus.DRAFT,
    },
  });

  await logAuditEvent({
    actor: "Sales Closer (owner-initiated)",
    action: "CREATE_OFFER",
    entityType: "Offer",
    entityId: offer.id,
    metadata: { leadId, priceCents: offer.priceCents },
  });

  return NextResponse.json(offer, { status: 201 });
}
