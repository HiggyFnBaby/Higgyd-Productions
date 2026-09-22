# Approval Policy Matrix

## v1 (implemented): a real, mode-conditional policy engine — with a floor

The Operating Mode selector in the Command Center is real, persisted, and
audit-logged on every change, and — per `owner-decisions-needed.md` #4 —
now actually changes behavior for one action: standard-priced offer
approval. Everything else in the table below stays a manual owner action in
every mode.

This is implemented as an `ApprovalPolicy` table (`(action, mode) →
requiresApproval`, seeded by `app/prisma/seed.ts`) read by
`requiresApproval()` in `app/src/lib/policy.ts`, plus a hardcoded
`NEVER_AUTONOMOUS_ACTIONS` floor in that same file that no policy row can
override — governance rule 5 in `CLAUDE.md` ("payments, contracts,
refunds... should remain behind approval gates") names these explicitly, so
they aren't merely today's default, they're a ceiling on what any future
policy change can automate.

| Action | Admin | Semi-Autonomous | Autonomous | Can a policy row change this? |
|---|---|---|---|---|
| Lead intake + qualification score | Automatic | Automatic | Automatic | Not gated — read-only classification, no external effect |
| Create a draft Offer for a Lead | Manual owner action | Manual owner action | Manual owner action | Not gated — drafting has no external effect either |
| Approve a **standard-priced** Offer + generate Stripe Checkout link | Manual owner action | **Automatic** | **Automatic** | Yes — `ApprovalAction.APPROVE_STANDARD_OFFER` |
| Approve a **custom-priced** Offer + generate Stripe Checkout link | Manual owner action | Manual owner action | Manual owner action | **No** — on the never-autonomous floor (`APPROVE_CUSTOM_OFFER`) |
| Mark production complete for a Project | Manual owner action | Manual owner action | Manual owner action | Not yet gated by the policy engine |
| Record a QA review result | Manual owner action, distinct click from "mark production complete" | Same | Same | Not gated — a human-judgment review, not an autonomy target |
| Record a red-team review result | Manual owner action, distinct click from the QA review | Same | Same | Not gated — same reasoning |
| Deliver to buyer (signed link + emails) | Manual owner action | Manual owner action | Manual owner action | **No** — on the never-autonomous floor (`DELIVER_PROJECT`) |
| Issue a refund | *(not built yet — no refund feature in v1)* | | | **No** — on the floor (`ISSUE_REFUND`), for whenever it is built |
| Public publishing | *(not built yet)* | | | **No** — on the floor (`PUBLISH_PUBLIC_CONTENT`) |
| Mass outreach / bulk email | *(not built yet)* | | | **No** — on the floor (`SEND_MASS_OUTREACH`) |
| Change Operating Mode | Manual owner action | Manual owner action | Manual owner action | Not gated — mode itself is never auto-changed |

"Standard-priced" means the offer's price exactly equals the catalog
default (`OFFER_CATALOG[...].defaultPriceCents`, currently $1,497 for the
one flagship package) — `isStandardPrice()` in `src/lib/policy.ts`. Any
override, in either direction, is a custom price and always routes to the
manual, never-autonomous path, in every mode.

One deliberate scope limit worth being explicit about: auto-approving a
standard offer only generates the Stripe checkout session/link — it does
**not** send that link to the buyer. Nothing in v1 emails or otherwise
delivers a checkout link to a buyer automatically, in any mode; getting it
to the buyer is still an entirely manual, outside-the-app step for the
owner. So the practical effect of auto-approval today is narrower than
"Arthur can close a sale unattended" — it just removes one manual click
from the owner's side of a flow they're still driving.

Every approval (manual or automatic) is recorded in `AuditEvent` with a
distinct actor string — `"Owner"` for a manual click,
`"Arthur (Sales Closer — auto-approved per policy)"` for an automatic one —
so the audit trail (and the offer detail page, which surfaces this) never
leaves it ambiguous which happened.

## Target matrix (full platform — largely implemented in v1 now)

This is the matrix `CLAUDE.md`'s OPERATING MODES section describes. Most of
it is now real, per the table above; the remaining gaps are rows for
features that don't exist in v1 yet (refunds, public publishing, mass
outreach), not rows the policy engine itself is missing.

| Action | Admin | Semi-Autonomous | Autonomous |
|---|---|---|---|
| Lead qualification | Recommend only → in practice, v1 runs this automatically in every mode (low-risk, no external effect) | Auto | Auto |
| Standard-priced offer (flagship package, list price) | Draft, owner approves | Auto-approved | Auto-approved |
| Nonstandard pricing / custom scope | Draft, owner approves | Owner approves | Owner approves (escalation required — never autonomous) |
| Stripe checkout link generation | Owner approves | Auto (standard offers only) | Auto (standard offers only) |
| Refunds | Owner approves | Owner approves | Owner approves (never autonomous) |
| Contracts / custom commitments | Owner approves | Owner approves | Owner approves (never autonomous) |
| Production agent work | Auto, within budget | Auto, within budget | Auto, within budget |
| QA review | Independent reviewer required in all modes; owner can be that reviewer | Same | Same |
| Red-team review | Independent reviewer required in all modes | Same | Same |
| Final delivery to buyer | Owner approves | Owner approves | Owner approves (governance rule 5 — never autonomous even here) |
| Public publishing (landing pages, social posts) | Owner approves | Owner approves | Owner approves (never autonomous) |
| Mass outreach / bulk email | Owner approves | Owner approves | Owner approves (never autonomous) |
| Spending above a documented cap | Owner approves | Owner approves | Escalates if over cap — not implemented (no spending-cap feature in v1) |

Rows marked "never autonomous" reflect governance rule 5 directly — they are
not something the policy engine is configurable to relax; its job is to
decide *how much drafting/approval happens without a human*, not whether
these specific gates exist at all.

## How the engine actually works

- `app/prisma/schema.prisma`: `ApprovalAction` enum (the action vocabulary)
  and `ApprovalPolicy` model (`action`, `mode`, `requiresApproval`, unique on
  `(action, mode)`).
- `app/src/lib/policy.ts`: `NEVER_AUTONOMOUS_ACTIONS` (the hardcoded floor,
  checked first — no DB row can override it), `DEFAULT_POLICY` (the seed
  data, matching the table above), `requiresApproval(action, mode)` (defaults
  to `true` — requires approval — if no policy row exists, so a missing row
  is never silently permissive), and `isStandardPrice()`.
- `app/prisma/seed.ts` upserts `DEFAULT_POLICY` on every seed run (kept as a
  literal there, not imported, so the seed script has no dependency on
  `tsx`'s path-alias resolution — must be hand-kept in sync with
  `src/lib/policy.ts`'s copy).
- `app/src/app/api/offers/route.ts` (offer creation) is the one route wired
  to the engine today: after creating a `DRAFT` offer, it checks
  `requiresApproval(APPROVE_STANDARD_OFFER | APPROVE_CUSTOM_OFFER,
  currentMode)` and, if `false`, immediately calls the same
  `approveOfferAndCreateCheckout()` the manual `/api/offers/[id]/approve`
  route uses — one shared function, so an offer can never end up "approved"
  without a checkout link existing, or vice versa, regardless of which path
  created it.

There is no admin UI yet for editing `ApprovalPolicy` rows directly — that's
next if/when a second gated action (e.g. delivery, once Derrick decides it's
ready to leave the never-autonomous floor, which would itself need a
governance-rule change, not just a policy change) gets added.
