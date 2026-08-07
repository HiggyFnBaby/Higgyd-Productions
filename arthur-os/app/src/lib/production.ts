import type { Lead } from "@prisma/client";
import { OFFER_CATALOG } from "@/lib/offers";
import { OfferPackage } from "@prisma/client";
import { draftAuditReportWithClaude } from "@/lib/anthropic";

export interface ProductionDraft {
  content: string;
  source: "claude" | "template";
}

// Deterministic fallback implementation of the production-agent contract
// (../../.claude/agents/production-agent.md) — never fabricates data the
// lead didn't provide (governance rule 4 in ../../CLAUDE.md), it only
// reflects the lead's own submitted answers back in a structured
// deliverable. Used whenever ANTHROPIC_API_KEY isn't configured, or if the
// Claude call fails — see generateProductionDraft below.
export function draftAuditReportTemplate(lead: Lead): string {
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

// Entry point the Stripe webhook calls after a verified payment. Calls
// Claude (using .claude/agents/production-agent.md as the system prompt)
// when ANTHROPIC_API_KEY is configured — see
// ../../docs/owner-decisions-needed.md #3 — and falls back to the
// deterministic template otherwise, or if the Claude call errors, so a
// production-agent hiccup never blocks project creation after a real
// payment. The caller records which path ran (draft.source) in the
// artifact name and the audit log — never presenting a template as if it
// were AI-drafted output, or vice versa (governance rule 4).
export async function generateProductionDraft(lead: Lead): Promise<ProductionDraft> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { content: draftAuditReportTemplate(lead), source: "template" };
  }

  try {
    const content = await draftAuditReportWithClaude(lead);
    return { content, source: "claude" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Production Agent Claude call failed, falling back to template: ${message}`);
    return { content: draftAuditReportTemplate(lead), source: "template" };
  }
}
