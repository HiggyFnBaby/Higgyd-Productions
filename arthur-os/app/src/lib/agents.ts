import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Reads the real specialist agent contracts from ../../.claude/agents/*.md
// directly — the same files described in ../../docs/ — so a Claude call
// made from this app can never drift from the documented task contract.
// Mirrors ../../../revenue-os/app/src/lib/agents.ts.
const AGENTS_DIR = path.join(process.cwd(), "..", ".claude", "agents");

export interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
}

export function loadAgentDefinition(fileName: string): AgentDefinition {
  const filePath = path.join(AGENTS_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    name: data.name ?? fileName,
    description: data.description ?? "",
    systemPrompt: content.trim(),
  };
}
