import { PipelineStage } from "@prisma/client";

export const STAGE_ORDER: PipelineStage[] = [
  "SIGNAL",
  "OFFER",
  "ANGLE",
  "CONVERSATION",
  "WON",
  "LOST",
];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  SIGNAL: "Signal",
  OFFER: "Offer",
  ANGLE: "Angle",
  CONVERSATION: "Conversation",
  WON: "Won",
  LOST: "Lost",
};

export const STAGE_COLOR: Record<PipelineStage, string> = {
  SIGNAL: "border-stage-signal",
  OFFER: "border-stage-offer",
  ANGLE: "border-stage-angle",
  CONVERSATION: "border-stage-conversation",
  WON: "border-stage-won",
  LOST: "border-stage-lost",
};
