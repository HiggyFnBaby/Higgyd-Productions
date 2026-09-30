import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body as { name?: string; email?: string; password?: string };

  // Trim before anything else. Neither of these is cosmetic:
  //
  //   - An untrimmed email makes the account unreachable. It is stored with the
  //     stray character, but src/lib/auth.ts looks up whatever the agent types
  //     at login, and nobody types a leading space on purpose. It also defeats
  //     the duplicate check below, so the same person can end up with two
  //     accounts. Mobile autofill produces this constantly.
  //   - The agent's name goes out in EVERY email this product sends (instant
  //     reply, notification, both follow-ups). Stray whitespace there is seen
  //     by the lead, and a professional-looking instant reply is the whole
  //     product.
  //
  // api/leads/route.ts already trims its input exactly this way; this keeps the
  // two entry points consistent. The password is deliberately NOT trimmed —
  // whitespace can be a legitimate part of one.
  const cleanName = name?.trim();
  const cleanEmail = email?.trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }
  // Matches the caps in api/leads/route.ts.
  if (cleanName.length > 200 || cleanEmail.length > 320) {
    return NextResponse.json({ error: "One of the fields is too long" }, { status: 400 });
  }

  const existing = await prisma.agent.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const agent = await prisma.agent.create({
    data: { name: cleanName, email: cleanEmail, passwordHash },
  });

  return NextResponse.json({ id: agent.id, email: agent.email });
}
