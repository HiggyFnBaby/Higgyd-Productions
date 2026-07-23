import { AgentName, PipelineStage } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// This app's agents are not re-implemented here — they're read directly from
// ../../.claude/agents/*.md, the same real Claude Code subagent definitions
// from the planning phase. That's the point: the CRM doesn't have its own
// separate copy of "what offer-architect does" that can drift out of sync.
const AGENTS_DIR = path.join(process.cwd(), "..", ".claude", "agents");

const AGENT_FILES: Record<AgentName, string> = {
  MARKET_SIGNAL_RESEARCHER: "market-signal-researcher.md",
  OFFER_ARCHITECT: "offer-architect.md",
  CONTENT_ANGLE_STRATEGIST: "content-angle-strategist.md",
  CONVERSATION_SYSTEM_BUILDER: "conversation-system-builder.md",
};

// Maps a lead's current pipeline stage to the agent that should run on it.
// WON/LOST have no agent to run — they're end states, not chain steps.
export const AGENT_FOR_STAGE: Partial<Record<PipelineStage, AgentName>> = {
  SIGNAL: "MARKET_SIGNAL_RESEARCHER",
  OFFER: "OFFER_ARCHITECT",
  ANGLE: "CONTENT_ANGLE_STRATEGIST",
  CONVERSATION: "CONVERSATION_SYSTEM_BUILDER",
};

export interface AgentDefinition {
  name: AgentName;
  description: string;
  systemPrompt: string;
}

export function loadAgentDefinition(agent: AgentName): AgentDefinition {
  const filePath = path.join(AGENTS_DIR, AGENT_FILES[agent]);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    name: agent,
    description: data.description ?? "",
    systemPrompt: content.trim(),
  };
}
