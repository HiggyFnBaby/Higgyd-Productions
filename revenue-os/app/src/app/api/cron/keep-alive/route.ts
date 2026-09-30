import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Why this endpoint exists:
//
// Supabase's free tier pauses a project after about a week with no database
// activity. A paused database refuses connections in a way Prisma reports as
// "P1000: Authentication failed" — which looks exactly like a wrong password.
// That is what silently broke every deploy of this app between 2026-09-08 and
// 2026-09-26, because the build runs `prisma db push` before compiling.
//
// Vercel Cron calls this once a day (see vercel.json) for no reason other than
// to make sure the database sees traffic, so it never sits idle long enough to
// pause. Daily leaves ~6 days of slack: a single missed run is harmless.
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
    // Surfacing this as a failed run is the point: a red cron in the Vercel
    // dashboard is the early warning that the database is already unreachable,
    // instead of finding out later via a failed deploy.
    // Never log the error itself: some Prisma initialization errors (P1013 on a
    // malformed URL, for one) echo the connection string -- password included --
    // in their message, and that would land in Vercel's logs. Code and class are
    // enough to tell "paused/rejected" from "bad URL".
    const code = (error as { code?: string } | null)?.code;
    const kind = error instanceof Error ? error.constructor.name : typeof error;
    console.error(`keep-alive: database unreachable (${kind}${code ? ` ${code}` : ""})`);
    return NextResponse.json({ ok: false, error: "Database unreachable" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
