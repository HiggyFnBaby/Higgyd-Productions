import { NextResponse } from "next/server";
import { OperatingMode } from "@prisma/client";
import { requireOwner } from "@/lib/requireOwner";
import { setOperatingMode } from "@/lib/settings";

export async function POST(request: Request) {
  const ownerId = await requireOwner();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { mode } = body as { mode?: OperatingMode };
  if (!mode || !Object.values(OperatingMode).includes(mode)) {
    return NextResponse.json({ error: "mode must be ADMIN, SEMI_AUTONOMOUS, or AUTONOMOUS" }, { status: 400 });
  }

  const settings = await setOperatingMode(mode, "Owner");
  return NextResponse.json(settings);
}
