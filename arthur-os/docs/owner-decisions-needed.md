# Decisions Requiring Derrick's Approval

Nothing in this list blocks the vertical slice from being built and run in
test mode — these are decisions needed before going further (a second
slice, or production), not before v1 ships.

## Resolved

1. **Flagship offer price — RESOLVED 2026-08-07.** `CLAUDE.md`'s pricing
   table gives a Business-in-a-Box range of $497–$2,500. Derrick confirmed
   keeping the v1 default of **$1,497** (`src/lib/offers.ts`) — no code
   change needed. This remains a per-offer override in the approval UI, not
   a hard price; revisit once real (or test) orders show whether buyers are
   qualifying as more price-sensitive or more premium than expected (see
   decision 5 below, which depends on this one running for a while first).
2. **Email provider for real sends — RESOLVED (deferred) 2026-08-07.**
   Derrick chose to stay on test-mode logging for now rather than set up
   Resend or a dedicated Gmail OAuth app — no account, no code change. The
   choice between Resend (already implemented,
   `src/lib/email/resendProvider.ts` — just needs an account + API key) and
   a dedicated Gmail API/OAuth app (not yet implemented — bigger lift on
   both sides) stays open; revisit when Derrick is ready to test the flow
   with a real buyer instead of the `EmailEvent` log.
3. **Whether the production stub should call Claude — RESOLVED 2026-08-07.**
   Derrick asked for the upgrade. `src/lib/production.ts` now calls Claude
   via `src/lib/anthropic.ts`, using `.claude/agents/production-agent.md` as
   the system prompt (the same pattern
   `revenue-os/app/src/lib/anthropic.ts` proves out), whenever
   `ANTHROPIC_API_KEY` is set — and falls back to the original deterministic
   template automatically if the key is unset or the Claude call errors, so
   a production-agent hiccup never blocks project creation after a verified
   payment. Which path ran is recorded on the artifact name and in the
   audit log (`draftSource: "claude" | "template"`) — never presented as
   one when it was the other. One accepted trade-off worth knowing: this
   runs synchronously inside the Stripe webhook handler, so the webhook
   response is a few seconds slower on the Claude path — fine at v1's order
   volume, worth revisiting if that ever becomes a real bottleneck.
4. **Mode-conditional approval-policy engine — RESOLVED 2026-08-07.** The
   doc's own original recommendation was to wait until Derrick had watched
   the manual version run a few real orders first — Derrick explicitly
   chose to build and turn it on now instead, ahead of that. Implemented as
   `ApprovalPolicy` (a `(action, mode) → requiresApproval` table, Prisma
   model, seeded with defaults by `prisma/seed.ts`) plus a hardcoded
   "never autonomous" floor in `src/lib/policy.ts` that no policy row can
   override (custom-priced offers, delivery, refunds, public publishing,
   mass outreach — matching governance rule 5 in `CLAUDE.md` plus the
   target matrix's "never autonomous" rows). The only behavior change in
   v1: creating a **standard-priced** offer (exactly the catalog default)
   in Semi-Autonomous or Autonomous mode now skips the manual "Approve"
   click and immediately creates the Stripe test-mode checkout session —
   `POST /api/offers` checks the policy and calls the same
   `approveOfferAndCreateCheckout()` the manual route uses. Any price
   override, or Admin mode, still always requires the manual click. The
   auto-approval is logged with a distinct actor
   (`"Arthur (Sales Closer — auto-approved per policy)"`) so it's never
   indistinguishable from a manual owner approval in the audit trail — and
   the offer detail page now shows who/what approved every offer. This
   does **not** change anything about buyer-facing communication: nothing
   in v1 emails or otherwise sends the checkout link to the buyer
   automatically either way — that's still an entirely manual, outside-the-app
   step. See `approval-policy-matrix.md` for the full updated matrix.
5. **Second offer package / industry editions — RESOLVED (confirmed wait)
   2026-08-07.** Derrick confirmed the doc's own recommendation: keep v1
   selling exactly one package (AI Business Growth-in-a-Box) until the
   flagship has actually closed some real (or test) orders. No code
   change — `OFFER_CATALOG`/`OfferPackage` stay single-entry. Unlike
   decision #4, this one wasn't overridden; revisit once there's real order
   evidence to design a second package (contractor, real estate,
   veteran-owned, nonprofit, coaching, or restaurant — `CLAUDE.md`'s
   suggested list) from, rather than guessing at one now.

## Open

6. **Public deployment / custom domain.** Out of scope until explicitly
   authorized (`CLAUDE.md`'s BUILD METHOD: "Stop and request approval before
   production deployment"). No action needed until Derrick asks for it.
7. **Rate limiting / bot protection on the public `/audit` form.** Flagged
   in the threat model as an accepted gap for a pre-launch test-mode slice.
   Needs a decision (and likely a small build) before any public launch.
8. **Multi-tenant / team access.** v1 is single-Owner by design. If Arthur
   Digital Works OS is ever meant to have a second human operator (not
   buyers — an actual co-operator), that's a schema change (see
   `data-schema.md`'s full-platform mapping notes) worth deciding on
   deliberately rather than growing organically.
