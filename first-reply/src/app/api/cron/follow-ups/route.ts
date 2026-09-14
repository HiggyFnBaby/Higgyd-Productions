import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFollowUpTouch2, sendFollowUpTouch3 } from "@/lib/email";
import { canSendLeadEmails } from "@/lib/billing";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

// Vercel Cron hits this on a schedule (see vercel.json). Only touches leads
// that are still NEW — once an agent marks a lead CONTACTED/WON/LOST, the
// automated cadence stops; a human is already on it.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const leads = await prisma.lead.findMany({
    where: { status: "NEW" },
    include: { agent: { include: { subscription: { select: { status: true } } } } },
  });

  let touch2Count = 0;
  let touch3Count = 0;
  let skippedUnpaid = 0;
  let failed = 0;

  for (const lead of leads) {
    const age = now - lead.createdAt.getTime();
    const needsTouch3 = !lead.touch3SentAt && age >= TEN_DAYS_MS;
    const needsTouch2 = !lead.touch2SentAt && age >= THREE_DAYS_MS;
    if (!needsTouch3 && !needsTouch2) continue;

    if (!canSendLeadEmails(lead.agent.subscription?.status)) {
      skippedUnpaid++;
      continue;
    }

    // One bad send (bounced address, Resend hiccup) must not stop the rest
    // of the batch — log it and keep going; it'll be retried tomorrow.
    try {
      if (needsTouch3) {
        await sendFollowUpTouch3(lead.email, lead.name, lead.agent);
        await prisma.lead.update({ where: { id: lead.id }, data: { touch3SentAt: new Date() } });
        touch3Count++;
      } else {
        await sendFollowUpTouch2(lead.email, lead.name, lead.agent);
        await prisma.lead.update({ where: { id: lead.id }, data: { touch2SentAt: new Date() } });
        touch2Count++;
      }
    } catch (err) {
      failed++;
      console.error(`[cron/follow-ups] send failed for lead ${lead.id}:`, err);
    }
  }

  return NextResponse.json({ touch2Count, touch3Count, skippedUnpaid, failed });
}
