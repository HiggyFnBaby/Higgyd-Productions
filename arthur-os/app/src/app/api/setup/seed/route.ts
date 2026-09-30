import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { DEFAULT_POLICY } from "@/lib/policy";

// One-time setup endpoint: creates the single Owner login this app supports.
//
// WHY THIS EXISTS. Arthur OS has no public signup — governance keeps it to one
// seeded operator (see ../../../../../docs/owner-decisions-needed.md #8).
// Normally that row comes from `npm run db:seed`, which needs a shell holding
// the production DATABASE_URL and the owner password in its environment. When
// the app is deployed on Vercel there is no such shell, and routing those
// secrets through a chat transcript is exactly how this project's Supabase
// password and Anthropic key previously ended up needing rotation. So the
// credentials are entered directly into the Vercel dashboard as environment
// variables, and this route applies them server-side. Nothing secret has to
// pass through a human conversation.
//
// It runs the same upsert sequence as prisma/seed.ts and is safe to re-run.
// Unlike that script, it imports DEFAULT_POLICY from src/lib/policy.ts instead
// of keeping a hand-synced copy, so the approval-policy rows cannot drift here.
//
// HOW TO TURN IT OFF. The route is inert whenever SETUP_SECRET is unset: it
// returns 503 and never touches the database. Deleting SETUP_SECRET from the
// Vercel project after seeding is therefore the off switch, and is the
// documented final step in README.md. Do that — a live setup endpoint is not
// something to leave lying around.
export const dynamic = "force-dynamic";

// Constant-time comparison so a caller can't recover the secret byte by byte
// from response timings. timingSafeEqual throws on length mismatch, hence the
// explicit length check first; leaking only the length is not a real risk here.
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handle(request: Request) {
  const expected = process.env.SETUP_SECRET;
  if (!expected) {
    console.error(
      "setup/seed: SETUP_SECRET is not set, so nothing was seeded. If you have " +
        "already seeded the owner account, leaving it unset is the correct end state."
    );
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  }

  // Accepted either as a Bearer header or as ?secret=... so it can be triggered
  // from a browser address bar. The query-string form does land in Vercel's
  // request log and in browser history — which is precisely why deleting
  // SETUP_SECRET afterwards is a required step, not a nice-to-have.
  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : new URL(request.url).searchParams.get("secret");

  if (!secretMatches(provided, expected)) {
    // Console only, deliberately NOT logAuditEvent. That helper writes a row, so
    // auditing unauthenticated hits would hand any anonymous caller an unbounded
    // INSERT into the append-only log that governance rule 7 exists to keep
    // trustworthy. Vercel's own request log already records the attempt.
    console.error("setup/seed: rejected a request with a missing or incorrect secret.");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) {
    console.error(
      "setup/seed: OWNER_EMAIL and OWNER_PASSWORD must both be set on the project."
    );
    return NextResponse.json(
      { ok: false, error: "Missing OWNER_EMAIL or OWNER_PASSWORD" },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, passwordHash },
      update: { passwordHash },
    });

    const workspace = await prisma.workspace.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", name: "Arthur Digital Works OS" },
      update: {},
    });

    await prisma.membership.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
      create: { userId: user.id, workspaceId: workspace.id, role: "owner" },
      update: {},
    });

    await prisma.settings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

    for (const row of DEFAULT_POLICY) {
      await prisma.approvalPolicy.upsert({
        where: { action_mode: { action: row.action, mode: row.mode } },
        create: row,
        update: { requiresApproval: row.requiresApproval },
      });
    }

    // Unlike the keep-alive cron, this genuinely changes state, so governance
    // rule 7 applies and this one IS audited. The email identifies which account
    // was created; the password and its hash are never recorded, per rule 8.
    await logAuditEvent({
      actor: "setup-route",
      action: "SEED_OWNER_ACCOUNT",
      entityType: "User",
      entityId: user.id,
      metadata: { email: normalizedEmail, policyRows: DEFAULT_POLICY.length },
    });

    return NextResponse.json({
      ok: true,
      ownerEmail: normalizedEmail,
      workspace: workspace.name,
      policyRows: DEFAULT_POLICY.length,
      nextStep:
        "Log in at /login using OWNER_EMAIL and OWNER_PASSWORD, then delete " +
        "SETUP_SECRET from the Vercel project to retire this endpoint.",
    });
  } catch (error) {
    // Same redaction rule as the keep-alive route: some Prisma initialization
    // errors echo the connection string with the password in it, and a bcrypt
    // failure can carry the plaintext. Log the error code and class only, which
    // is still enough to tell a connection problem from a schema mismatch.
    const code = (error as { code?: string } | null)?.code;
    const kind = error instanceof Error ? error.constructor.name : typeof error;
    console.error(`setup/seed: failed (${kind}${code ? ` ${code}` : ""})`);
    return NextResponse.json({ ok: false, error: "Seeding failed" }, { status: 500 });
  }
}

// GET so it can be triggered from a browser; POST for anyone using curl.
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
