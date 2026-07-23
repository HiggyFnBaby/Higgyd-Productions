import { PipelineStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// The one classic automation in v1: a stage change always produces a
// concrete next action, so a lead never just sits in a stage with nothing
// telling you what to do next. This is intentionally simple — the point is
// that "automation" here means "the system never goes quiet," not a complex
// rules engine.
const NEXT_ACTION_BY_STAGE: Record<PipelineStage, string> = {
  SIGNAL: "Run market-signal-researcher and review the evidence before pricing anything.",
  OFFER: "Run offer-architect, then decide if the price/format actually feels right.",
  ANGLE: "Run content-angle-strategist, then pick which angle you'll post/send first.",
  CONVERSATION: "Run conversation-system-builder, then implement the blueprint in your outreach.",
  WON: "Log what worked (angle, offer, objections) so it can feed back into future signal research.",
  LOST: "Log what didn't land — this is signal too, feed it back into market-signal-researcher.",
};

export async function changeLeadStage(leadId: string, toStage: PipelineStage) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const fromStage = lead.stage;

  const [, , task] = await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { stage: toStage } }),
    prisma.stageEvent.create({ data: { leadId, fromStage, toStage } }),
    prisma.task.create({ data: { leadId, title: NEXT_ACTION_BY_STAGE[toStage] } }),
  ]);

  return task;
}
