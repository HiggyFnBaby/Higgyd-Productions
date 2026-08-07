# Data Schema

## v1 schema (implemented, `../app/prisma/schema.prisma`)

Single-tenant (one Owner). Every model below exists in the actual Prisma
schema — this doc explains the *why*, the schema is the source of truth for
field-level detail.

```
Owner 1───────────────────────────────* (none — single row in v1)
Settings (singleton row: operatingMode)
ApprovalPolicy (one row per (action, mode) — the autonomy engine's table)

Lead ──< Offer ──1:1── Order ──1:1── Project ──< Artifact
                                          │
                                          ├──< QAReview
                                          ├──< RedTeamReview
                                          └──1:1── Delivery

EmailEvent   (standalone log: BUYER_THANK_YOU | OWNER_SALE_NOTIFICATION)
AuditEvent   (standalone, append-only log of every consequential action)
```

- **Lead** — one row per `/audit` submission. Holds the raw answers
  (`rawAnswers` JSON) plus a computed `qualificationScore` and `status`
  (`NEW | QUALIFIED | DISQUALIFIED | OFFER_APPROVED | WON | LOST`). Scoring
  and initial status happen at creation time per the Lead Hunter agent
  contract — see `../.claude/agents/lead-hunter.md`.
- **Offer** — one specific priced offer for one Lead. `status` moves
  `DRAFT → PENDING_OWNER_APPROVAL → APPROVED → CHECKOUT_CREATED → PAID`
  (or `DECLINED`). `package` is an enum because v1 sells exactly one
  flagship package (AI Business Growth-in-a-Box) — see "First launch offer"
  in `CLAUDE.md` for why that's deliberate, not a limitation to work around.
- **Order** — created by the Stripe webhook handler, never by a client
  request. Unique on `stripeSessionId` so a duplicate webhook delivery
  cannot double-create it.
- **Project** — the production/QA/delivery unit. `status` moves through
  `RESEARCH → PRODUCTION → QA_PENDING → (QA_PASSED|QA_FAILED) →
  RED_TEAM_PENDING → (RED_TEAM_PASSED|RED_TEAM_FAILED) →
  READY_FOR_DELIVERY → DELIVERED`. A failed QA or red-team review routes
  back to `PRODUCTION`, not forward — mirrors the required workflow's
  `E -->|Fail| D` loop.
- **Artifact** — versioned deliverable content. v1 stores generated content
  as text (`content` field) rather than binary file storage, so the whole
  vertical slice runs without needing an object-storage account.
- **QAReview / RedTeamReview** — separate tables (not a shared "review"
  table with a type column) so the delivery gate query is a straightforward
  "does at least one passing row of each exist for this project," and so the
  two review types can diverge in shape later without a migration that
  touches the other.
- **Delivery** — one row per Project once delivered: the signed
  `downloadToken`, its `expiresAt`, and `deliveredAt`. See
  `threat-model.md` #5–6 for why both the token signature and this row are
  checked at download time.
- **EmailEvent** — every attempted send, real or test-mode, with `status`
  (`SENT_TEST | SENT | FAILED`) — this is the audit trail for governance
  rule 7 as it applies to customer communication specifically.
- **AuditEvent** — `actor`, `action`, `entityType`, `entityId`, `metadata`
  (JSON), `createdAt`. Every route handler that changes state writes one of
  these. No update/delete path exists for this table in v1 (see threat
  model #9).
- **Settings** — one singleton row holding `operatingMode`
  (`ADMIN | SEMI_AUTONOMOUS | AUTONOMOUS`), always visible on the dashboard
  per `CLAUDE.md`'s mobile-first interface requirement.
- **ApprovalPolicy** — the approval-policy engine's `(action, mode) →
  requiresApproval` table (see `owner-decisions-needed.md` #4 and
  `approval-policy-matrix.md`). Seeded with defaults by `prisma/seed.ts`.
  `src/lib/policy.ts`'s `requiresApproval()` checks a hardcoded
  never-autonomous floor *before* reading any row here, so this table can
  only ever grant autonomy for actions the floor allows — today, that's
  only `APPROVE_STANDARD_OFFER`.

## Full-platform target schema (not yet built)

`CLAUDE.md`'s DATA MODEL section names the target model for the whole
platform: `users, organizations, roles, permissions, approval_policies,
connectors, leads, lead_sources, consent_records, customers, products,
product_templates, brand_kits, projects, specifications, tasks, agents,
agent_contracts, research_sources, artifacts, versions, qa_reviews,
red_team_reviews, orders, payments, subscriptions, licenses, deliveries,
email_events, notifications, support_tickets, faqs, knowledge_entries,
expenses, analytics_events, audit_events, incidents, backups, feature_flags`.

Mapping notes for whoever builds the next slice:
- `users`/`organizations`/`roles`/`permissions` replace the single `Owner`
  row once multi-tenant/team access is needed — model this the way
  `revenue-os/app/prisma/schema.prisma` does it (`User` + `Workspace` +
  `Membership`), it's already proven in this repo.
- `lead_sources` and `consent_records` split out of v1's `Lead.source`
  string once there's more than one lead-magnet channel and real email
  consent tracking is required (needed before any real, non-test email
  sending at scale).
- `products`/`product_templates`/`brand_kits` generalize v1's single
  hardcoded `GROWTH_IN_A_BOX` offer package into an actual catalog — do this
  when a second sellable package is approved, not speculatively.
- `agents`/`agent_contracts` formalize what's currently just markdown files
  in `.claude/agents/` into queryable, versioned rows — worth doing once
  Arthur is actually spawning agents dynamically rather than every task
  contract being hand-written.
- `versions` generalizes v1's `Artifact.version` integer into full version
  history with diffs — needed once production regularly iterates past v1.
- `payments`/`subscriptions`/`licenses` generalize v1's one-time `Order`
  into recurring billing and license management — see the pricing table in
  the business brief for which offers need this (monthly care plans,
  white-label licenses).
- `approval_policies` — largely done: v1's `ApprovalPolicy` model already
  implements this shape for the one action it gates today
  (`APPROVE_STANDARD_OFFER`). Extending it to gate more actions (delivery,
  refunds once built, etc.) means adding rows/wiring the engine into more
  route handlers — the never-autonomous floor in `src/lib/policy.ts` would
  need a deliberate, reviewed code change first for anything currently on
  it (see `approval-policy-matrix.md`).
