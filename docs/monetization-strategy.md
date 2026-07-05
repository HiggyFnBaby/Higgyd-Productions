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

- **Build platform(s):** base44, Claude (Claude Code / Claude-assisted builds)
- **Payment processor:** not yet decided — open decision below
- **This repo's role:** shared knowledge base / "Foundation OS" across all
  apps, not a single-app repo. Per-app details get their own section below as
  they're built out.

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

_(none logged yet — add one entry per app as we build/monetize it)_

| App name | Platform | What it does | Buyer | Monetization status | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## Session log

- **2026-07-05** — Initial setup. Clarified the ask: Derrick wants a reusable
  monetization *system*, not one-off advice, plus persistent memory across
  sessions/apps. Captured stack (base44 + Claude) and buyer profile (B2B small
  business). No monetization system built yet — next session should start by
  confirming payment processor choice, then inventorying existing apps.
