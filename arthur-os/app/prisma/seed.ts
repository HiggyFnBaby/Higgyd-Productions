import { ApprovalAction, OperatingMode, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Kept as a literal here (not imported from src/lib/policy.ts) so this
// script has no dependency on tsconfig path-alias resolution under tsx —
// must be kept in sync by hand with src/lib/policy.ts's DEFAULT_POLICY. See
// ../docs/owner-decisions-needed.md #4.
const DEFAULT_POLICY: Array<{ action: ApprovalAction; mode: OperatingMode; requiresApproval: boolean }> = [
  { action: "APPROVE_STANDARD_OFFER", mode: "ADMIN", requiresApproval: true },
  { action: "APPROVE_STANDARD_OFFER", mode: "SEMI_AUTONOMOUS", requiresApproval: false },
  { action: "APPROVE_STANDARD_OFFER", mode: "AUTONOMOUS", requiresApproval: false },
  { action: "APPROVE_CUSTOM_OFFER", mode: "ADMIN", requiresApproval: true },
  { action: "APPROVE_CUSTOM_OFFER", mode: "SEMI_AUTONOMOUS", requiresApproval: true },
  { action: "APPROVE_CUSTOM_OFFER", mode: "AUTONOMOUS", requiresApproval: true },
  { action: "DELIVER_PROJECT", mode: "ADMIN", requiresApproval: true },
  { action: "DELIVER_PROJECT", mode: "SEMI_AUTONOMOUS", requiresApproval: true },
  { action: "DELIVER_PROJECT", mode: "AUTONOMOUS", requiresApproval: true },
  { action: "ISSUE_REFUND", mode: "ADMIN", requiresApproval: true },
  { action: "ISSUE_REFUND", mode: "SEMI_AUTONOMOUS", requiresApproval: true },
  { action: "ISSUE_REFUND", mode: "AUTONOMOUS", requiresApproval: true },
  { action: "PUBLISH_PUBLIC_CONTENT", mode: "ADMIN", requiresApproval: true },
  { action: "PUBLISH_PUBLIC_CONTENT", mode: "SEMI_AUTONOMOUS", requiresApproval: true },
  { action: "PUBLISH_PUBLIC_CONTENT", mode: "AUTONOMOUS", requiresApproval: true },
  { action: "SEND_MASS_OUTREACH", mode: "ADMIN", requiresApproval: true },
  { action: "SEND_MASS_OUTREACH", mode: "SEMI_AUTONOMOUS", requiresApproval: true },
  { action: "SEND_MASS_OUTREACH", mode: "AUTONOMOUS", requiresApproval: true },
];

// Seeds the single Owner account this app supports in v1 — there is no
// public signup route — plus the default approval-policy rows. Re-running
// this script is safe: everything upserts.
async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD in .env before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const owner = await prisma.owner.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), passwordHash },
    update: { passwordHash },
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

  console.log(`Seeded owner account: ${owner.email}`);
  console.log(`Seeded ${DEFAULT_POLICY.length} approval-policy rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
