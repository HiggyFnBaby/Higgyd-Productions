# Approval Policy Matrix

## v1 (implemented): every mode gates the same actions manually

The Operating Mode selector in the Command Center is real, persisted, and
audit-logged on every change — but in v1 it does **not** change which
actions require an explicit owner click. Every row below requires a manual
owner action regardless of the selected mode. This is a deliberate,
documented simplification (not an oversight) so the first vertical slice
ships without a full policy-evaluation engine, while still honoring
governance rule 5 ("payments, contracts, refunds... should remain behind
approval gates") literally, in every mode.

| Action | v1 gate |
|---|---|
| Lead intake + qualification score | Automatic (read-only classification, no external effect) |
| Create a draft Offer for a Lead | Manual owner action |
| Approve an Offer + generate Stripe Checkout link | Manual owner action, always |
| Mark production complete for a Project | Manual owner action |
| Record a QA review result | Manual owner action, and must be a distinct click from "mark production complete" |
| Record a red-team review result | Manual owner action, and must be a distinct click from the QA review |
| Deliver to buyer (generate signed link + send emails) | Manual owner action, only enabled once both QA and red-team show a passing review |
| Change Operating Mode | Manual owner action (always — mode itself is never auto-changed) |

## Target matrix (full platform — not yet implemented)

This is the matrix `CLAUDE.md`'s OPERATING MODES section describes, for
when the approval-policy engine (`approval_policies` in the target schema)
is built:

| Action | Admin | Semi-Autonomous | Autonomous |
|---|---|---|---|
| Lead qualification | Recommend only | Auto | Auto |
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
| Spending above a documented cap | Owner approves | Owner approves | Escalates if over cap |

Rows marked "never autonomous" reflect governance rule 5 directly — they are
not something a future policy engine should be configurable to relax; the
matrix's job is to decide *how much drafting happens without a human*, not
whether these specific gates exist at all.

## Building the target engine later

When this is built, it should live as an `approval_policies` table keyed on
`(actionType, mode) → requiresApproval boolean` plus the "never autonomous"
list above as a hardcoded floor the table can't override, evaluated by a
single `requiresApproval(actionType, currentMode)` function that every route
handler calls before executing — same shape as v1's
`src/lib/mode.ts` stub, just backed by a real policy table instead of a
constant `true`.
