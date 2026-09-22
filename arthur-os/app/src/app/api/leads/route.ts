import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/qualification";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit, getClientIp, AUDIT_FORM_RATE_LIMIT } from "@/lib/rateLimit";

const MAX_TEXT_LENGTH = 4000;

// Public endpoint (the /audit lead magnet). Auto-scores per the lead-hunter
// agent contract — see ../../../../.claude/agents/lead-hunter.md and
// ../../../../docs/acceptance-criteria.md. Nothing here creates an Offer or
// contacts anyone — that's always a separate, owner-initiated action.
//
// Bot protection, per ../../../../docs/owner-decisions-needed.md #7:
// - Honeypot field (`website`): real users never see or fill it (hidden in
//   AuditForm.tsx); a bot that fills every field it finds does. A hit
//   returns the same success response as a real submission — no Lead row
//   gets created, and the bot gets no signal it was caught.
// - IP rate limit: generous (AUDIT_FORM_RATE_LIMIT), blocks floods without
//   punishing a hesitant real buyer who resubmits a couple of times.
export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, company, businessType, painPoint, monthlyRevenueRange, urgency, website } = body as {
    name?: string;
    email?: string;
    company?: string;
    businessType?: string;
    painPoint?: string;
    monthlyRevenueRange?: string;
    urgency?: string;
    website?: string; // honeypot — must stay empty
  };

  if (website) {
    return NextResponse.json({ id: "ok" }, { status: 201 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`audit:${ip}`, AUDIT_FORM_RATE_LIMIT);
  if (!rateLimit.allowed) {
    await logAuditEvent({
      actor: "Rate Limiter (auto)",
      action: "RATE_LIMIT_BLOCKED",
      entityType: "Lead",
      metadata: { endpoint: "POST /api/leads", ip, count: rateLimit.count, limit: rateLimit.limit },
    });
    return NextResponse.json({ error: "Too many submissions — please try again later." }, { status: 429 });
  }

  if (!name || !email || !painPoint) {
    return NextResponse.json({ error: "name, email, and painPoint are required" }, { status: 400 });
  }
  if (name.length > MAX_TEXT_LENGTH || email.length > MAX_TEXT_LENGTH || painPoint.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "One or more fields is too long" }, { status: 400 });
  }

  const { score, status } = scoreLead({ businessType, painPoint, monthlyRevenueRange, urgency });

  const lead = await prisma.lead.create({
    data: {
      name,
      email: email.toLowerCase(),
      company,
      businessType,
      painPoint,
      monthlyRevenueRange,
      urgency,
      qualificationScore: score,
      status,
      rawAnswers: { name, email, company, businessType, painPoint, monthlyRevenueRange, urgency },
    },
  });

  await logAuditEvent({
    actor: "Lead Hunter (auto)",
    action: "QUALIFY_LEAD",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { score, status },
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}

// Admin-only listing, used by the Command Center.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(leads);
}
