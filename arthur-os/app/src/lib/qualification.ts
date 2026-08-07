// Implements the lead-hunter agent contract (../.claude/agents/lead-hunter.md)
// as deterministic scoring logic — see that file for the full rationale.
// Score is 0-100, built only from what the lead actually stated; nothing is
// assumed or invented.

import { LeadStatus } from "@prisma/client";

export interface AuditAnswers {
  businessType?: string;
  painPoint: string;
  monthlyRevenueRange?: string;
  urgency?: string;
}

const URGENCY_POINTS: Record<string, number> = {
  "this week": 35,
  "this month": 25,
  "this quarter": 15,
  exploring: 5,
};

const REVENUE_POINTS: Record<string, number> = {
  "under $5k/mo": 5,
  "$5k-$20k/mo": 15,
  "$20k-$100k/mo": 25,
  "$100k+/mo": 30,
};

export function scoreLead(answers: AuditAnswers): { score: number; status: LeadStatus } {
  let score = 0;

  // Pain point is required and free-text; a substantive answer (not just a
  // couple of words) is itself weak evidence of a real, considered problem.
  const painPointWords = answers.painPoint.trim().split(/\s+/).filter(Boolean).length;
  score += Math.min(painPointWords * 2, 30);

  if (answers.urgency) {
    score += URGENCY_POINTS[answers.urgency.toLowerCase()] ?? 0;
  }

  if (answers.monthlyRevenueRange) {
    score += REVENUE_POINTS[answers.monthlyRevenueRange.toLowerCase()] ?? 0;
  }

  if (answers.businessType) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Thresholds documented in lead-hunter.md and
  // ../../docs/acceptance-criteria.md. Fewer than ~10 words of pain-point
  // text plus no urgency/revenue signal reads as spam/low-effort and is
  // disqualified rather than left ambiguously "new."
  let status: LeadStatus;
  if (score >= 60) status = LeadStatus.QUALIFIED;
  else if (score >= 20) status = LeadStatus.NEW;
  else status = LeadStatus.DISQUALIFIED;

  return { score, status };
}
