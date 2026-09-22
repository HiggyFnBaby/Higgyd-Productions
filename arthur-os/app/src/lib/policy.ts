import { ApprovalAction, OfferPackage, OperatingMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OFFER_CATALOG } from "@/lib/offers";

// The mode-conditional approval-policy engine — see
// ../../docs/approval-policy-matrix.md and
// ../../docs/owner-decisions-needed.md #4. Every route handler that
// performs a gated action calls requiresApproval() before executing rather
// than hardcoding a boolean inline, so changing the policy later is a data
// change (an ApprovalPolicy row), not a code change.
//
// This is deliberately a FLOOR, not just a table: some actions can never be
// made autonomous, in any mode, by any policy row — governance rule 5 in
// ../../CLAUDE.md names payments, contracts, refunds, mass outreach, and
// public publishing explicitly. Delivery is on this list too, per the
// approval-policy-matrix's "never autonomous" row for final delivery.
// APPROVE_CUSTOM_OFFER (any price other than the catalog default) is also
// on the floor — only a *standard*, list-price offer is eligible for
// autonomy at all; any price override always gets a human look.
export const NEVER_AUTONOMOUS_ACTIONS: ReadonlySet<ApprovalAction> = new Set([
  ApprovalAction.APPROVE_CUSTOM_OFFER,
  ApprovalAction.DELIVER_PROJECT,
  ApprovalAction.ISSUE_REFUND,
  ApprovalAction.PUBLISH_PUBLIC_CONTENT,
  ApprovalAction.SEND_MASS_OUTREACH,
]);

// Default policy rows, seeded by prisma/seed.ts, matching the target matrix
// in ../../docs/approval-policy-matrix.md. Only APPROVE_STANDARD_OFFER is
// actually mode-conditional today — everything else either isn't wired into
// a gate check yet (ISSUE_REFUND, PUBLISH_PUBLIC_CONTENT,
// SEND_MASS_OUTREACH: no feature exists yet to gate) or sits on the
// never-autonomous floor above regardless of what's stored here.
export const DEFAULT_POLICY: Array<{ action: ApprovalAction; mode: OperatingMode; requiresApproval: boolean }> = [
  { action: ApprovalAction.APPROVE_STANDARD_OFFER, mode: OperatingMode.ADMIN, requiresApproval: true },
  { action: ApprovalAction.APPROVE_STANDARD_OFFER, mode: OperatingMode.SEMI_AUTONOMOUS, requiresApproval: false },
  { action: ApprovalAction.APPROVE_STANDARD_OFFER, mode: OperatingMode.AUTONOMOUS, requiresApproval: false },
  { action: ApprovalAction.APPROVE_CUSTOM_OFFER, mode: OperatingMode.ADMIN, requiresApproval: true },
  { action: ApprovalAction.APPROVE_CUSTOM_OFFER, mode: OperatingMode.SEMI_AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.APPROVE_CUSTOM_OFFER, mode: OperatingMode.AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.DELIVER_PROJECT, mode: OperatingMode.ADMIN, requiresApproval: true },
  { action: ApprovalAction.DELIVER_PROJECT, mode: OperatingMode.SEMI_AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.DELIVER_PROJECT, mode: OperatingMode.AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.ISSUE_REFUND, mode: OperatingMode.ADMIN, requiresApproval: true },
  { action: ApprovalAction.ISSUE_REFUND, mode: OperatingMode.SEMI_AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.ISSUE_REFUND, mode: OperatingMode.AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.PUBLISH_PUBLIC_CONTENT, mode: OperatingMode.ADMIN, requiresApproval: true },
  { action: ApprovalAction.PUBLISH_PUBLIC_CONTENT, mode: OperatingMode.SEMI_AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.PUBLISH_PUBLIC_CONTENT, mode: OperatingMode.AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.SEND_MASS_OUTREACH, mode: OperatingMode.ADMIN, requiresApproval: true },
  { action: ApprovalAction.SEND_MASS_OUTREACH, mode: OperatingMode.SEMI_AUTONOMOUS, requiresApproval: true },
  { action: ApprovalAction.SEND_MASS_OUTREACH, mode: OperatingMode.AUTONOMOUS, requiresApproval: true },
];

// Defaults to "requires approval" (the safe direction) if no row exists for
// a given (action, mode) pair — a missing policy row should never silently
// grant autonomy.
export async function requiresApproval(action: ApprovalAction, mode: OperatingMode): Promise<boolean> {
  if (NEVER_AUTONOMOUS_ACTIONS.has(action)) return true;

  const policy = await prisma.approvalPolicy.findUnique({
    where: { action_mode: { action, mode } },
  });

  return policy?.requiresApproval ?? true;
}

// An offer is "standard" only if its price exactly matches the catalog's
// current default — any override, in any direction, is treated as custom
// pricing and routed to APPROVE_CUSTOM_OFFER's always-manual floor.
export function isStandardPrice(priceCents: number, offerPackage: OfferPackage): boolean {
  return priceCents === OFFER_CATALOG[offerPackage].defaultPriceCents;
}
