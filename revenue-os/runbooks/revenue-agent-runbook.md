# Revenue Agent Runbook

This is the operating manual — how to actually run the Revenue OS, step by
step, in plain language. Read `../business-brief.md` first if you haven't;
this doc assumes you know the four agents and why they exist.

**You don't need to write code to run this.** You're directing four
specialists in sequence, the same way you already sequence steps in a
no-code workflow — each agent's output is a file that becomes the next
agent's input.

## The loop, not just the line

The four-step chain (signal → offer → angle → conversation) looks like a
straight line, but it's actually a loop: real results from step 4 become new
signal for step 1. Don't treat one pass through as "done" — treat it as
round one.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                                                               │
 │   1. market-signal-researcher                                │
 │            │  writes → signal-reports/<topic>.md             │
 │            ▼                                                 │
 │   2. offer-architect                                         │
 │            │  writes → offer-briefs/<topic>.md                │
 │            ▼                                                 │
 │   3. content-angle-strategist                                │
 │            │  writes → content-angles/<topic>.md              │
 │            ▼                                                 │
 │   4. conversation-system-builder                              │
 │            │  writes → conversation-blueprints/<topic>.md      │
 │            ▼                                                 │
 │   YOU implement the blueprint in your CRM/automation tool     │
 │            │  (this step is where revenue actually happens)  │
 │            ▼                                                 │
 │   Real results: what closed, what got objected to             │
 │            │                                                 │
 └──────────── feeds back in as new signal ─────────────────────┘
```

## Step-by-step: running round one on a new app or offer

1. **Pick the scope.** One app from the portfolio, or one offer idea for the
   Revenue OS product itself. Don't run this against "everything" at once —
   scope it to one buyer, one pain point.
2. **Run market-signal-researcher.** Give it the scope from step 1. Read the
   signal report it produces. If the evidence is thin, either narrow the
   scope and re-run, or accept the risk explicitly before moving on — don't
   let a weak report quietly become the foundation for a priced offer.
3. **Run offer-architect** with that signal report as input. You'll get back
   one offer brief — one promise, one price, one format. If it doesn't feel
   right, that's a decision point for you (the human), not something to
   auto-accept: adjust the price or format yourself, or send it back with
   what's wrong.
4. **Run content-angle-strategist** with the offer brief (and signal report)
   as input. You'll get 3–7 angles mapped to funnel stage. Pick which one you
   believe in enough to post/send first — the agent will suggest one, but the
   call is yours.
5. **Run conversation-system-builder** with the offer brief and angle set.
   You'll get a full conversation blueprint: branches, objection responses,
   the close, and a note on what should be automated vs. handled by a human.
6. **Implement the blueprint** in the actual tool — your CRM, your
   automation platform, a DM sequence. This is the only step where a "tool"
   enters the picture, and it works because everything upstream already
   proved the pain, priced the fix, and scripted the close.
7. **Capture real results.** What did people actually say? What objection
   came up that wasn't in the blueprint? What closed fastest? Write this down
   even briefly.
8. **Feed results back into step 2** as new signal for the next round. This
   is what makes it a system instead of a one-time campaign.

## Decision points that are yours, not the agents'

The agents produce evidence-based drafts. You still decide:

- Whether a signal report is strong enough to act on, or too thin.
- Whether the price in an offer brief actually matches what you're willing
  to charge and deliver.
- Which content angle you're willing to put your name behind.
- Which conversation branches you'll personally handle vs. automate.

Never let a weak upstream artifact silently become confident downstream
output — if the signal is weak, say so before the offer gets priced off it.

## How this connects to the wider portfolio

This runbook is the same engine referenced in
`../../docs/monetization-strategy.md` for picking and monetizing pilot apps
from the 80+ app portfolio. Running signal → offer → angle → conversation for
a pilot app *is* how that pilot gets monetized — this runbook is not a
separate initiative from that one, it's the mechanism for it.
