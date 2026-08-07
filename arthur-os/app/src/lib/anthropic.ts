import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "@prisma/client";
import { OfferPackage } from "@prisma/client";
import { loadAgentDefinition } from "@/lib/agents";
import { OFFER_CATALOG } from "@/lib/offers";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

// Lazily constructed so the module can be imported (and the app can build)
// without ANTHROPIC_API_KEY set — same pattern as src/lib/stripe.ts.
function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set — see .env.example.");
  }
  return new Anthropic({ apiKey });
}

// Implements the production-agent contract
// (../../.claude/agents/production-agent.md) for real, using that file
// itself as the system prompt — the same pattern
// ../../../revenue-os/app/src/lib/anthropic.ts already proves out — so the
// code and the documented contract can never drift apart. See
// ../../docs/owner-decisions-needed.md #3.
export async function draftAuditReportWithClaude(lead: Lead): Promise<string> {
  const definition = loadAgentDefinition("production-agent.md");
  const catalogEntry = OFFER_CATALOG[OfferPackage.GROWTH_IN_A_BOX];

  const userMessage = [
    `Draft the "${catalogEntry.name}" audit report deliverable for this lead.`,
    `Use only the information below — per governance rule 4 (../../CLAUDE.md), ` +
      `never invent a detail the lead didn't provide, and never fabricate results.`,
    ``,
    `Lead name: ${lead.name}`,
    lead.company ? `Company: ${lead.company}` : null,
    `Business type: ${lead.businessType ?? "Not specified"}`,
    `Stated pain point: ${lead.painPoint}`,
    `Monthly revenue range: ${lead.monthlyRevenueRange ?? "Not specified"}`,
    `Urgency: ${lead.urgency ?? "Not specified"}`,
    ``,
    `This package's deliverables (reference them, don't claim any are attached beyond this report itself):`,
    ...catalogEntry.deliverables.map((item) => `- ${item}`),
    ``,
    `Output the report as markdown, ready to hand to independent QA review.`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: definition.systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}
