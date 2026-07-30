import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFollowUpTouch2, sendFollowUpTouch3 } from "@/lib/email";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

// Vercel Cron hits this on a schedule (see vercel.json). Only touches leads
// that are still NEW — once an agent marks a lead CONTACTED/WON/LOST, the
// automated cadence stops; a human is already on it.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const leads = await prisma.lead.findMany({
    where: { status: "NEW" },
    include: { agent: true },
  });

  let touch2Count = 0;
  let touch3Count = 0;

  for (const lead of leads) {
    const age = now - lead.createdAt.getTime();

    if (!lead.touch3SentAt && age >= TEN_DAYS_MS) {
      await sendFollowUpTouch3(lead.email, lead.name, lead.agent.name);
      await prisma.lead.update({ where: { id: lead.id }, data: { touch3SentAt: new Date() } });
      touch3Count++;
      continue;
    }

    if (!lead.touch2SentAt && age >= THREE_DAYS_MS) {
      await sendFollowUpTouch2(lead.email, lead.name, lead.agent.name);
      await prisma.lead.update({ where: { id: lead.id }, data: { touch2SentAt: new Date() } });
      touch2Count++;
    }
  }

  return NextResponse.json({ touch2Count, touch3Count });
}
