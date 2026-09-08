import type { Lead } from "@prisma/client";
import { OFFER_CATALOG } from "@/lib/offers";
import { OfferPackage } from "@prisma/client";

// Implements the production-agent contract
// (../.claude/agents/production-agent.md) as a deterministic template so
// the vertical slice runs with no ANTHROPIC_API_KEY required — see
// ../../docs/owner-decisions-needed.md #3 for the documented, optional
// upgrade path to a real Claude call using that same agent file as the
// system prompt (the same pattern as
// ../../../revenue-os/app/src/lib/anthropic.ts).
//
// This never fabricates data the lead didn't provide — governance rule 4 in
// ../../CLAUDE.md — it only reflects the lead's own submitted answers back
// in a structured deliverable.
export function draftAuditReport(lead: Lead): string {
  const answers = lead.rawAnswers as Record<string, unknown>;
  const catalogEntry = OFFER_CATALOG[OfferPackage.GROWTH_IN_A_BOX];

  const lines = [
    `# AI Business Growth-in-a-Box — Audit Report`,
    ``,
    `Prepared for: **${lead.name}**${lead.company ? ` (${lead.company})` : ""}`,
    `Generated: ${lead.createdAt.toISOString().slice(0, 10)}`,
    ``,
    `## What you told us`,
    ``,
    `- **Business type:** ${lead.businessType ?? "Not specified"}`,
    `- **Stated pain point:** ${lead.painPoint}`,
    `- **Monthly revenue range:** ${lead.monthlyRevenueRange ?? "Not specified"}`,
    `- **Urgency:** ${lead.urgency ?? "Not specified"}`,
    ``,
    `## What's included in this package`,
    ``,
    ...catalogEntry.deliverables.map((item) => `- ${item}`),
    ``,
    `## Next steps`,
    ``,
    `This report is the first-draft deliverable for your ${catalogEntry.name} order.`,
    `It moves to independent QA and red-team review before final delivery — `,
    `see your order status in the confirmation email for updates.`,
    ``,
    `_Raw submitted answers (for internal QA reference):_`,
    "```json",
    JSON.stringify(answers, null, 2),
    "```",
  ];

  return lines.join("\n");
}
