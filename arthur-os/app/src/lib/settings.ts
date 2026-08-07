import { OperatingMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

const SETTINGS_ID = "singleton";

// The Operating Mode is always visible on the dashboard (see
// ../../CLAUDE.md's mobile-first interface requirement) and every change is
// audit-logged. See ../../docs/approval-policy-matrix.md for what this mode
// does and does NOT gate in v1 — it does not yet skip any manual approval.
export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

export async function setOperatingMode(mode: OperatingMode, actor: string) {
  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, operatingMode: mode },
    update: { operatingMode: mode },
  });

  await logAuditEvent({
    actor,
    action: "SET_OPERATING_MODE",
    entityType: "Settings",
    entityId: SETTINGS_ID,
    metadata: { mode },
  });

  return settings;
}
