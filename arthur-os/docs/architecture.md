# Architecture

## Scope of this document

This describes (a) the target architecture for the full Arthur Digital Works
OS described in `../CLAUDE.md`, and (b) precisely which slice of it is
actually built in `../app` today. Read `vertical-slice-plan.md` alongside
this for the step-by-step build order.

## Target architecture (full platform)

```
                        ┌─────────────────────────┐
                        │   Owner (Derrick)        │
                        │   mobile-first dashboard │
                        └────────────┬─────────────┘
                                     │ HTTPS
                        ┌────────────▼─────────────┐
                        │   Next.js app (API-first) │
                        │   - server components UI  │
                        │   - /api route handlers   │
                        └──┬───────┬───────┬────────┘
                           │       │       │
              ┌────────────┘  ┌────┘   ┌───┘─────────┐
              ▼                ▼                       ▼
      ┌───────────────┐ ┌──────────────┐      ┌────────────────┐
      │  Postgres      │ │ Stripe        │      │ Email provider  │
      │  (Prisma ORM)  │ │ (payments)    │      │ (transactional) │
      │  tenant-scoped │ │ webhooks+API  │      │ OAuth or API key│
      └───────────────┘ └──────────────┘      └────────────────┘
              ▲
              │ reads/writes (server-side only, never client)
              │
      ┌───────┴────────────────────────────────────────────┐
      │ Arthur orchestration layer                          │
      │  - task contracts (see .claude/agents/*.md)          │
      │  - specialist agent calls (Anthropic API), each      │
      │    bounded by budget/time/tool allow-list             │
      │  - independent QA + red-team reviewer, never the      │
      │    same actor as the producer                         │
      │  - approval-policy engine (mode-aware gate checks)     │
      │  - audit_events log (every decision, call, approval)  │
      └────────────────────────────────────────────────────┘
```

Principles:
- **API-first.** Every consequential action is a server-side route handler
  with its own auth check and audit write — the UI is a client of that API,
  not a place where business rules live.
- **Least privilege.** Each specialist agent's task contract names the exact
  tools and data it may touch; nothing gets broader access "just in case."
- **No agent marks its own homework.** Production and QA/red-team review are
  different actors (different agent role, or the same human acting under a
  different, logged capacity) — enforced at the workflow level, not just by
  convention.
- **Everything is reversible until delivery.** Versioned artifacts, a
  rollback path for production output, and no external side effect (email
  send, publish, charge) happens without a gate check.
- **Multi-tenant-ready, single-tenant today.** The full data model
  (`docs/data-schema.md`) is written so a `workspace`/`organization` concept
  can be added later without a rewrite, but the v1 vertical slice runs
  single-owner (Derrick only) to keep the first slice small.

## What v1 (`../app`) actually builds

One vertical slice end to end, using real (not mocked) integrations run in
test/sandbox mode:

```
Free AI Business Audit (public lead magnet)
        │  POST /api/leads  → Lead created, auto-scored (Lead Hunter contract)
        ▼
Owner reviews lead in Command Center → creates + approves an Offer
        │  POST /api/offers, POST /api/offers/:id/approve
        │  (Sales Closer contract; payment stays owner-gated in every mode)
        ▼
Stripe Checkout (test mode) — one-time payment for the flagship package
        │  webhook: checkout.session.completed
        ▼
Order marked PAID (idempotent on Stripe session id) → Project created
        │  (Production Agent contract) generates first-draft artifact
        ▼
Owner runs independent QA review → independent Red-Team review
        │  (QA Inspector / Red-Team Reviewer contracts — separate actions,
        │   separate audit entries, cannot both be the "production" click)
        ▼
Owner delivers → signed, expiring download link created
        │  (Delivery Agent + Customer Success Agent contracts)
        ▼
Buyer thank-you email + Owner sale-notification email
        │  (test-mode email provider by default; audit-logged either way)
        ▼
audit_events has a complete, timestamped record of every step above
```

Deliberately out of scope for v1 (tracked in `owner-decisions-needed.md` and
`vertical-slice-plan.md`'s "not built yet" section): multi-tenant workspaces,
OAuth login/Google sign-in, real Gmail send, subscription/license billing,
the FAQ/knowledge engine, analytics dashboard, support tickets, offline
draft sync, and the mode-conditional autonomy described in `CLAUDE.md`'s
Semi-Autonomous/Autonomous modes (all consequential actions stay manual in
v1, in every mode — see the approval-policy matrix).

## Stack

- **Framework:** Next.js 14 (App Router), same as `../../revenue-os/app` for
  consistency across this repo's projects.
- **Database:** Postgres via Prisma ORM.
- **Auth:** NextAuth, credentials provider, single seeded Owner account (no
  self-service signup in v1 — this is a one-operator system, not a SaaS
  signup funnel yet).
- **Payments:** Stripe, test mode, one-time Checkout Sessions (the flagship
  offer is a one-time purchase, not a subscription, in v1).
- **Email:** provider-agnostic interface; default implementation is a
  test-mode provider that logs to `EmailEvent` instead of sending. A Resend
  implementation exists behind `EMAIL_PROVIDER=resend` for when Derrick
  explicitly wants to go live with real buyer email (see
  `environment-and-accounts.md`).
- **Styling:** Tailwind CSS.
