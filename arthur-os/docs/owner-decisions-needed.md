# Decisions Requiring Derrick's Approval

Nothing in this list blocks the vertical slice from being built and run in
test mode — these are decisions needed before going further (a second
slice, or production), not before v1 ships.

1. **Flagship offer price.** `CLAUDE.md`'s pricing table gives a
   Business-in-a-Box range of $497–$2,500. v1 defaults the AI Business
   Growth-in-a-Box offer to **$1,497** (`src/lib/offers.ts`) as a
   mid-range placeholder the owner can override per-offer in the approval
   UI. Confirm or change the default.
2. **Email provider for real sends.** Test-mode logging is the default and
   requires no decision to keep using. Going live needs either (a) a
   Resend (or similar transactional-email) account and API key, or (b) a
   dedicated Gmail API/OAuth app registered for Arthur specifically — not
   the Gmail connection already used elsewhere (see `CLAUDE.md`'s EMAIL
   RULES). Which one, and when to flip the switch, is Derrick's call.
3. **Whether the production stub should call Claude.** v1's
   `src/lib/production.ts` is a deterministic template so the slice runs
   without an Anthropic API key. Upgrading it to call Claude (using
   `.claude/agents/production-agent.md` as the system prompt, the same
   pattern `revenue-os/app/src/lib/anthropic.ts` already proves out) is a
   small, low-risk change — worth doing once Derrick wants to see real
   AI-drafted output, but not required for the slice's acceptance criteria.
4. **When to build the mode-conditional approval-policy engine.** v1
   deliberately keeps every payment/delivery/QA action manual in every
   Operating Mode (see `approval-policy-matrix.md`). Building the real
   engine (Semi-Autonomous auto-approving standard-priced offers, etc.) is
   the next meaningful autonomy increase and should be scoped as its own
   slice once Derrick has watched the manual version run a few real orders.
5. **Second offer package / industry editions.** `CLAUDE.md` names
   contractor/real-estate/veterans/nonprofit/coaching/restaurant editions as
   later work "once the production framework is proven." v1 intentionally
   ships exactly one package. Confirm the flagship should run for some
   number of real (or test) orders before a second package gets built.
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
