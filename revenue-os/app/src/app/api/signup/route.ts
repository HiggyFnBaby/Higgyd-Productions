import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Creates a brand-new tenant: one User, one Workspace, one owner Membership.
// This is the only place a Workspace gets created in v1 — there's no
// "invite a teammate to an existing workspace" flow yet.
export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name, workspaceName } = body as {
    email?: string;
    password?: string;
    name?: string;
    workspaceName?: string;
  };

  if (!email || !password || !workspaceName) {
    return NextResponse.json(
      { error: "email, password, and workspaceName are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const TRIAL_LENGTH_DAYS = 14;
  const trialEndsAt = new Date(Date.now() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      memberships: {
        create: {
          role: "owner",
          workspace: { create: { name: workspaceName, trialEndsAt } },
        },
      },
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
