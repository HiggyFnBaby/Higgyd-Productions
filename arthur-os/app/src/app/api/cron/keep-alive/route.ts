import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Why this endpoint exists:
//
// Supabase's free tier pauses a project after about a week with no database
// activity. Vercel Cron calls this once a day (see vercel.json) for no reason
// other than to make sure the database sees traffic, so it never sits idle long
// enough to pause. Daily leaves ~6 days of slack: a single missed run is
// harmless.
//
// This app's failure mode differs from revenue-os. Its build is
// `prisma generate && next build`, which never touches the database, so a
// paused database still builds and deploys green. The breakage only shows up at
// runtime — login and every dashboard page fail — with no red check anywhere to
// warn you. That makes the keep-alive more valuable here, not less.
//
// Deliberately NOT audit-logged. src/lib/audit.ts is for "every route handler
// that changes state"; this one changes nothing, and a daily row would bury
// real events in the append-only log that governance rule 7 depends on.
//
// The query is deliberately `SELECT 1`. It depends on no table, writes nothing,
// and still counts as real database activity.
export async function GET(request: Request) {
  // Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when that
  // variable is set on the project. Without it there is no way to tell a cron
  // run from anyone on the internet, so refuse rather than leave an
  // unauthenticated database endpoint open.
  if (!process.env.CRON_SECRET) {
    console.error(
      "keep-alive: CRON_SECRET is not set, so this did NOT touch the database. " +
        "Set CRON_SECRET on the Vercel project and redeploy, or the database can pause again."
    );
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Since a paused database is otherwise invisible in this app (the build
    // stays green), a red cron run here is the only early warning there is.
    console.error("keep-alive: database unreachable", error);
    return NextResponse.json({ ok: false, error: "Database unreachable" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
