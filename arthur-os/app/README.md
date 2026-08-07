# Arthur Digital Works OS (v1 vertical slice)

This is the actual running application version of the plan in `../CLAUDE.md`
and `../docs/`. Read `../docs/vertical-slice-plan.md` first if you haven't —
this file is "how to run it," not "why it exists" or "what's not built yet."

## What this is, in plain terms

The smallest real, working version of the whole business process:

```
Free AI Business Audit (public /audit form)
  → owner reviews + qualifies the lead
  → owner creates and approves an offer (real Stripe test-mode checkout)
  → buyer pays (test card)
  → webhook verifies payment, creates a Project
  → owner runs independent QA review, then independent red-team review
  → owner delivers → signed, expiring download link
  → buyer thank-you email + owner sale-notification email
```

Every step writes to an append-only audit log, visible on `/admin`. Delivery
and QA/red-team sign-off are always manual owner actions in every mode.
Offer approval is mode-conditional: standard (catalog-default) pricing
auto-approves in Semi-Autonomous/Autonomous mode, custom pricing always
requires a manual click — see `../docs/approval-policy-matrix.md` for the
full matrix and `../docs/owner-decisions-needed.md` #4 for why.

It's single-owner (no multi-tenant workspaces, no public signup) — see
`../docs/architecture.md` for why that's deliberate for v1.

## Before you can run it, you need

1. **A Postgres database.** Free options: Supabase, Neon, Railway. Copy the
   connection string into `DATABASE_URL`.
2. **A Stripe account, test mode.** Create a `sk_test_...` secret key and, for
   local webhook testing, run the Stripe CLI (see below).
3. **A `DELIVERY_SECRET`** — any long random string (`openssl rand -base64 32`).

Nothing else is required to run the full flow — email defaults to a
test-mode provider that logs instead of sending. See
`../docs/environment-and-accounts.md` for the full list including optional
values.

## Running it locally

```bash
cp .env.example .env
# fill in .env — at minimum DATABASE_URL, NEXTAUTH_SECRET, OWNER_EMAIL,
# OWNER_PASSWORD, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DELIVERY_SECRET

npm install
npm run db:push       # creates tables from prisma/schema.prisma
npm run db:seed       # creates the single Owner login from OWNER_EMAIL/OWNER_PASSWORD
npm run dev            # starts the app at http://localhost:3000
```

In a second terminal, forward Stripe test-mode webhooks so payment
confirmation actually reaches the app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed webhook signing secret into STRIPE_WEBHOOK_SECRET, restart `npm run dev`
```

Then:
1. Visit `http://localhost:3000/audit` and submit the form as a "buyer."
2. Log in at `/login` with your seeded Owner credentials.
3. In `/admin/leads`, open the lead and create an offer. In Admin mode
   (the default), click "Approve" on the offer page; in Semi-Autonomous or
   Autonomous mode, a standard-priced offer auto-approves the moment it's
   created — no separate click.
4. Open the printed Stripe Checkout URL, pay with a Stripe test card
   (`4242 4242 4242 4242`, any future expiry/CVC).
5. The webhook creates a Project automatically — find it in `/admin/projects`.
6. Mark production complete, record a passing QA review, record a passing
   red-team review, then deliver. Both emails land in the `EmailEvent` table
   (test mode by default); the buyer's download link is printed in the UI.

## What's real vs. what's a v1 shortcut

**Real:** the whole flow above, using real (test-mode) Stripe, a real
Postgres-backed audit trail, real signed/expiring delivery links (HMAC +
server-side expiry check), and a real production draft built from the
lead's own submitted answers — via a live Claude call (using
`.claude/agents/production-agent.md` as the system prompt) when
`ANTHROPIC_API_KEY` is set, falling back automatically to a deterministic
template if it's unset or the call fails (see
`../docs/owner-decisions-needed.md` #3).

**v1 shortcuts, worth knowing about:**
- Single Owner login only — no signup, no team members, no OAuth/Google
  sign-in.
- Email defaults to test-mode logging; real sending needs `EMAIL_PROVIDER=resend`
  and a Resend account (see `../docs/environment-and-accounts.md`).
- Exactly one sellable package (AI Business Growth-in-a-Box) — see "First
  launch offer" in `../CLAUDE.md`.
- The Operating Mode selector changes exactly one thing so far: standard-priced
  offer approval. Delivery, QA/red-team sign-off, and custom pricing stay
  manual in every mode, by hardcoded design — see
  `../docs/approval-policy-matrix.md`.
- No admin UI yet for editing `ApprovalPolicy` rows — changing the default
  policy means editing `prisma/seed.ts` and re-seeding.
- The `/audit` rate limit (`src/lib/rateLimit.ts`) is per-IP only — it
  doesn't defend against a distributed flood from many IPs. See
  `../docs/threat-model.md` threat #18.

## Where things live

- `prisma/schema.prisma` — the data model (see `../docs/data-schema.md`).
- `src/lib/qualification.ts` — lead-hunter's scoring logic.
- `src/lib/rateLimit.ts`, `src/app/api/leads/route.ts` — the `/audit` form's
  rate limit and honeypot bot protection.
- `src/lib/policy.ts`, `src/lib/offerApproval.ts`, `src/app/api/offers/route.ts` —
  the approval-policy engine and where it's wired in (offer creation/approval).
- `src/lib/stripe.ts`, `src/app/api/stripe/webhook/route.ts` — payment
  creation + verified, idempotent confirmation.
- `src/lib/production.ts`, `src/lib/anthropic.ts`, `src/lib/agents.ts` — the
  production-agent draft: Claude when `ANTHROPIC_API_KEY` is set, a
  deterministic template fallback otherwise.
- `src/app/api/projects/[id]/{qa,redteam,deliver}/route.ts` — the
  independent review + delivery gates.
- `src/lib/delivery.ts` — signed download token generation/verification.
- `src/lib/email/` — the provider-agnostic email interface (test-mode
  default, Resend implementation available).
- `src/app/admin/` — the Command Center UI.
- `.claude/agents/` (one level up, `../.claude/agents/`) — the specialist
  agent contracts this app's code implements or will call into.
