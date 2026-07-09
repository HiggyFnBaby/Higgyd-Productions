# Monetization Strategy — Living Doc

This file is the persistent memory for Higgyd Productions' app monetization work.
Every session (this app or the next one) should read this before doing anything,
and update it before finishing. Conversation memory disappears when a session
ends — this file is what survives.

## Who this is for

Derrick Higgins (Higgyd Productions), building apps and CRMs with workflows and
automations as a **no-code creator**, not a traditional developer. Explanations
should always be plain-language: what a concept is, why it matters, and what it
costs in money or effort — never assume prior dev knowledge.

## Stack

- **Build platform(s):** Claude (Claude Code / Claude-assisted builds) —
  **current focus**. base44 is shelved for now, not abandoned; revisit later.
- **Payment processor:** not yet decided — open decision below
- **This repo's role:** shared knowledge base / "Foundation OS" across all
  apps, not a single-app repo. Per-app details get their own section below as
  they're built out.

### Why the platform choice matters here

base44 is a no-code builder — it handles hosting, database, and often payments
for you inside its own walls. Building "with Claude" is different: Claude Code
writes real, custom code. That unlocks anything (any pricing model, any
integration) but it also means *you* (with my help) now own decisions base44
used to make for you automatically — where the app is hosted, what database it
uses, how login/accounts work, and how billing is wired in. None of that is
decided yet.

## Buyer profile

- **Primary buyer:** Small businesses (B2B)
- Implication: pricing should lean toward per-seat / per-account / per-workspace
  subscriptions rather than consumer micro-pricing. B2B buyers tolerate higher
  price points ($20–$200+/mo) if the app solves a clear operational pain
  (the CRM/workflow angle fits this well), but expect a legitimate business
  entity, invoicing, and support — not a hobby-project feel.

## Open decisions (need Derrick's input before building)

- [ ] **Payment processor**: Stripe (more control, more setup, you handle tax
      yourself) vs. Paddle/LemonSqueezy (merchant-of-record, handles sales
      tax/VAT automatically, takes a bigger cut, much less setup for a solo
      operator). Recommendation pending platform check: confirm what base44
      supports natively before choosing.
- [ ] **Pricing model per app**: subscription vs. usage-based vs. one-time vs.
      freemium-with-upsells vs. selling templates/builds to other builders.
- [ ] **App inventory**: list of apps already built, what each does, current
      monetization status (free / paid / unreleased) — needs to be filled in.

## App inventory

**Scale: ~80+ apps already built with Claude/Claude Code.** This is the
single biggest fact shaping this whole strategy — it means the goal is NOT
"add billing to one app," it's "build one reusable monetization template
(auth + billing + hosting) that gets stamped onto a portfolio," because
hand-wiring payments into 80 apps individually doesn't scale.

**Deployment status:** most of the 80+ are already live/deployed.

**Rollout plan:** prove the monetization template on 1–3 apps first, then
stamp it across the rest of the portfolio. Do NOT attempt all 80+ at once.

**Auth status:** varies by app — some have login/accounts, some are open
access with no login. This is a per-app gating factor: no login means adding
one is a prerequisite step before billing can work.

**Pilot selection:** Derrick asked for help choosing the 1–3 pilot apps.
Criteria to use: (1) already has real usage/traction, (2) solves a clear
painful problem for a small business, (3) has or can easily get login, (4)
isn't the most complex build in the portfolio. Waiting on Derrick to share a
shortlist of candidate apps (name + one-liner + login status + usage) so we
can pick.

Still need to find out: whether the 80+ apps share a common structure/template
or are all bespoke one-off builds.

| App name | Platform | What it does | Buyer | Monetization status | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## Related project: Revenue OS

`../revenue-os/` — a real Claude Code multi-agent project (business brief +
4 subagents + runbook), built to answer "how do we actually monetize this"
in a repeatable way. Purpose is **both**: (1) internal engine for picking and
monetizing pilot apps from this portfolio, and (2) a future sellable
SaaS/CRM product for other entrepreneur-creators. See
`../revenue-os/business-brief.md` for the thesis ("money is not a tool, the
money is in systems") and `../revenue-os/runbooks/revenue-agent-runbook.md`
for how to actually run it. Still open: whether Revenue OS itself becomes
pilot #1.

## Session log

- **2026-07-05** — Initial setup. Clarified the ask: Derrick wants a reusable
  monetization *system*, not one-off advice, plus persistent memory across
  sessions/apps. Captured stack (base44 + Claude) and buyer profile (B2B small
  business). No monetization system built yet — next session should start by
  confirming payment processor choice, then inventorying existing apps.
- **2026-07-05 (cont.)** — Major scope update: focus narrowed to Claude-built
  apps only (base44 shelved, not abandoned). Discovered Derrick already has
  **~80+ apps built with Claude/Claude Code**, most already live/deployed,
  auth status varies per app. This reframes the whole project: not "add
  billing to one app" but "build one reusable monetization template (auth +
  billing + hosting) to stamp across a portfolio." Agreed rollout plan: pilot
  on 1–3 apps first, prove it, then roll out wider — not all 80+ at once.
  Waiting on Derrick to shortlist candidate pilot apps (name, one-liner, login
  status, usage) before picking pilots or building anything.
- **2026-07-06** — Pilot-selection work put on hold; Derrick started a new,
  bigger initiative: `revenue-os/`, a multi-agent Revenue Operating System
  (market-signal-researcher → offer-architect → content-angle-strategist →
  conversation-system-builder, plus a runbook). Built as a real Claude Code
  project (business brief + 4 real subagent definitions + runbook), not a
  single chat answer. Purpose is both internal (run Derrick's own portfolio)
  and productized (sell to other entrepreneur-creators later) — internal use
  proves it before it's sold. This is the mechanism for the pilot-app
  monetization work above, not a separate track. Next: come back to the
  pilot-app shortlist, and decide whether Revenue OS itself is pilot #1.
- **2026-07-09** — Turned Revenue OS from planning docs into a real running
  app: `revenue-os/app/`, a multi-tenant Next.js + Prisma CRM. Pipeline
  stages mirror the four-agent chain exactly; leads are prospective
  customers (not portfolio apps); built as full multi-tenant SaaS from day
  one (auth + billing included, not deferred). Billing built
  provider-agnostic with Stripe as the concrete v1 implementation — Derrick's
  answer on payment processor was "both," read as "architect for either,
  ship one first." AI-agent automation calls the Claude API in-app using the
  real `.claude/agents/*.md` files as system prompts. Verified: `npm install`,
  `prisma generate`, `tsc --noEmit`, and `next build` all pass clean. See
  `revenue-os/business-brief.md` for the fuller v1 summary and
  `revenue-os/app/README.md` for how to actually run it (needs a Postgres DB,
  an Anthropic API key, and a Stripe account — none wired to real credentials
  yet). Next: get real credentials in, run it end-to-end, then return to the
  pilot-app shortlist.
