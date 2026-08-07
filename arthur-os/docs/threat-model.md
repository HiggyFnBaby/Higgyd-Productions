# Threat Model

Scope: the v1 vertical slice in `../app`, plus forward-looking notes for the
full platform where the mitigation differs materially at scale.

## Assets

- Owner credentials (single Owner account) and session tokens.
- Lead PII: name, email, company, free-text answers to the audit form.
- Payment data: never stored directly — Stripe holds card data; we store
  Stripe session/payment-intent IDs and amounts only.
- Generated deliverables (artifacts) and the signed download links to them.
- Stripe secret key, webhook signing secret, database URL, email provider
  key, delivery-link signing secret — all server-side secrets.
- Audit log integrity (a tampered or deletable audit log defeats governance
  rule 7 in `CLAUDE.md`).

## Actors / trust boundaries

- **Public/anonymous:** anyone hitting `/audit` or `/checkout/*`. Untrusted
  input, no session.
- **Owner (Derrick):** the only authenticated principal in v1. Full access to
  the admin surface. Trusted, but still audit-logged — the log exists partly
  to protect Derrick (a record of what was approved and when) not just to
  police an untrusted party.
- **Stripe:** trusted third party, but every inbound webhook is still
  signature-verified — "it came from an HTTPS POST claiming to be Stripe" is
  not sufficient trust on its own.
- **Buyer post-payment:** holds a signed delivery link. Trusted only for that
  one link, only until it expires, only for that one artifact.

## Threats and mitigations

| # | Threat | Mitigation in v1 |
|---|---|---|
| 1 | Forged/replayed Stripe webhook marks an unpaid order as paid | `stripe.webhooks.constructEvent` signature verification with `STRIPE_WEBHOOK_SECRET`; reject on failure with 400, never trust unsigned payloads |
| 2 | Webhook delivered twice (Stripe's own retry behavior) double-creates a Project or double-sends emails | Order lookup/creation keyed on unique `stripeSessionId`; project creation and email sends are guarded by checking existing state first (idempotent, not "insert and hope") |
| 3 | Public audit form used for spam / injection / oversized payloads | Server-side validation of required fields and length caps before any DB write; Prisma parameterizes all queries (no raw SQL string building) |
| 4 | Someone brute-forces or guesses the Owner login | bcrypt-hashed password, generic "email or password is incorrect" error (no user-enumeration signal), NextAuth JWT session with `NEXTAUTH_SECRET` |
| 5 | Delivery link guessed or shared beyond the intended buyer | Token is HMAC-signed (unguessable without `DELIVERY_SECRET`) **and** checked against a server-side `Delivery` row with an expiry; both must agree — a leaked-but-expired link still fails, and a link for a project that was never marked deliverable never validates |
| 6 | Delivery link shared/forwarded indefinitely | Expiry enforced server-side (`expiresAt`) independent of the token's own claims, so revocation doesn't require rotating the signing secret |
| 7 | Secrets committed to the repo or shipped to the browser | `.env` is git-ignored; `.env.example` ships with no real values; all secret reads (`STRIPE_SECRET_KEY`, `DELIVERY_SECRET`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`) happen in server-only modules (`route.ts`, server components, `src/lib/*`), never passed to client components |
| 8 | Production output gets "approved" by the same action that created it | UI and API separate "mark production complete," "QA review," and "red-team review" into three distinct actions with distinct audit-log actors; the delivery gate checks that a passing `QAReview` **and** a passing `RedTeamReview` both exist before allowing delivery |
| 9 | Audit log entries deleted or edited to hide an action | v1: no UI/API path exposes update or delete on `AuditEvent` — it is append-only by construction (write-once code paths only). Full-platform follow-up: write to an external/immutable log sink, not just the same Postgres instance an attacker with DB access could edit |
| 10 | Unverified "payment" claimed via email/chat is used to trigger delivery | Project creation only happens from the webhook handler after signature verification — there is no API path that creates a Project from a claimed payment without a verified Stripe event |
| 11 | Email provider abuse (spam via the app) once real sending is enabled | Test-mode provider is the default; enabling `EMAIL_PROVIDER=resend` is an explicit, documented opt-in (see `environment-and-accounts.md`); only two email types exist (buyer thank-you, owner notification), both triggered by server-side state changes, not arbitrary user-supplied recipients |
| 12 | Cross-tenant data leakage | Not applicable in v1 (single-tenant, one Owner). Flagged here because the full-platform schema (`data-schema.md`) is written multi-tenant-ready — when a `workspaceId` scope is added, every query must be re-audited the way `revenue-os/app/src/lib/currentWorkspace.ts` does it today, before this stops being "not applicable" |
| 13 | Owner's Operating Mode is changed to Autonomous believing it grants payment/delivery autonomy | v1 mode toggle is real and audit-logged but does not currently gate anything differently — documented explicitly in the UI copy and in `CLAUDE.md` so this isn't a silent gap |

## Out of scope for v1 (explicitly deferred, not silently ignored)

- Rate limiting / bot protection on the public `/audit` form (no CAPTCHA,
  no IP throttling yet) — acceptable for a pre-launch test-mode slice, not
  for a public production launch. Tracked in `owner-decisions-needed.md`.
- File-upload virus/type scanning — v1 generates deliverables server-side as
  text/markdown, it does not accept buyer-uploaded files yet.
- Step-up authentication (2FA) for the Owner account.
- Dependency/secret scanning in CI — not yet wired into this repo's CI.
