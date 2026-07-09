import Anthropic from "@anthropic-ai/sdk";
import type { AgentRun, Lead } from "@prisma/client";
import { loadAgentDefinition, AGENT_FOR_STAGE } from "@/lib/agents";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env — see .env.example for where to get one."
    );
  }
  return new Anthropic({ apiKey });
}

// Builds the input handed to the agent: the lead's own details, plus the
// full chain of every prior agent's output for this lead. This is what makes
// it a chain and not four disconnected AI calls — offer-architect actually
// reads what market-signal-researcher found, not a fresh blank slate.
function buildUserMessage(lead: Lead, priorRuns: AgentRun[]): string {
  const leadSummary = [
    `Lead name: ${lead.name}`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.contactInfo ? `Contact: ${lead.contactInfo}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const priorSection = priorRuns.length
    ? priorRuns
        .map((run) => `--- Prior output from ${run.agent} (${run.createdAt.toISOString()}) ---\n${run.output}`)
        .join("\n\n")
    : "No prior agent runs for this lead yet — this is the first step in the chain.";

  return `${leadSummary}\n\n${priorSection}`;
}

export async function runAgentForLead(lead: Lead, priorRuns: AgentRun[]) {
  const agentName = AGENT_FOR_STAGE[lead.stage];
  if (!agentName) {
    throw new Error(`No agent runs at stage ${lead.stage} — it's an end state, not a chain step.`);
  }

  const definition = loadAgentDefinition(agentName);
  const userMessage = buildUserMessage(lead, priorRuns);

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: definition.systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const output = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return { agent: agentName, input: userMessage, output, model: MODEL };
}
