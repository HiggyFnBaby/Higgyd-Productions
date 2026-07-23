import type { Subscription, Workspace } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// The single number that defines the free trial length. Changing this only
// affects new signups — existing workspaces keep the trialEndsAt they were
// given at signup time.
export const TRIAL_DAYS = 14;

export function trialEndDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

// The one place "does this workspace get to use the app" is decided. Used by
// both UI pages (to redirect to /dashboard/billing) and API routes (to
// return 402 Payment Required) — every call site that gates access goes
// through this function so there's exactly one definition of "active."
export function hasActiveAccess(
  workspace: Pick<Workspace, "trialEndsAt">,
  subscription: Pick<Subscription, "status"> | null
): boolean {
  if (subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING")) {
    return true;
  }
  return workspace.trialEndsAt.getTime() > Date.now();
}

export interface WorkspaceAccess {
  workspace: Workspace;
  subscription: Subscription | null;
  active: boolean;
  trialDaysRemaining: number;
}

export async function getWorkspaceAccess(workspaceId: string): Promise<WorkspaceAccess> {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId } });

  const active = hasActiveAccess(workspace, subscription);
  const trialDaysRemaining = Math.max(
    0,
    Math.ceil((workspace.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );

  return { workspace, subscription, active, trialDaysRemaining };
}
