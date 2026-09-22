# Required Accounts and Environment Variables

Nothing in this list requires production/paid tiers to run the vertical
slice — every integration below has a free or test-mode option. Full detail
on where to get each value lives in `../app/.env.example`; this doc is the
"why do I need this" companion.

## Accounts to create (or reuse)

1. **A Postgres database.** Free options: Supabase, Neon, Railway. Same
   requirement as `revenue-os/app` — if you already made one for that
   project, a second free database for this one is still recommended so the
   two projects don't share a schema.
2. **A Stripe account, test mode.** No live/production Stripe activation
   needed for this slice — `STRIPE_SECRET_KEY` should be a `sk_test_...`
   key. Real charges are explicitly out of scope until Derrick authorizes
   production deployment (per `CLAUDE.md`'s BUILD METHOD).
3. **(Optional) A Resend account**, only if/when Derrick wants real email
   sending instead of the default test-mode log. Not required to run or
   demo the slice — every email still gets generated and logged either way.
4. **(Optional) An Anthropic API key.** When set, production drafting calls
   Claude (using `.claude/agents/production-agent.md` as the system prompt)
   instead of the deterministic template — see
   `owner-decisions-needed.md` #3. Not required to run or demo the slice:
   without a key, or if the Claude call fails, drafting falls back to the
   template automatically.

## Environment variables

See `../app/.env.example` for the authoritative, copy-pasteable list. Summary:

| Variable | Required for v1? | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXTAUTH_SECRET` | Yes | Session token encryption |
| `NEXTAUTH_URL` | Yes | Base URL (`http://localhost:3000` for local dev) |
| `OWNER_EMAIL` | Yes | Seeds the single Owner login |
| `OWNER_PASSWORD` | Yes | Seeds the single Owner login (hashed at seed time, never stored plain) |
| `STRIPE_SECRET_KEY` | Yes, to test checkout | Stripe API access, test mode |
| `STRIPE_WEBHOOK_SECRET` | Yes, to test checkout | Verifies webhook signatures — see threat model #1 |
| `DELIVERY_SECRET` | Yes | Signs delivery download tokens — see threat model #5 |
| `EMAIL_PROVIDER` | No (defaults to `test`) | `test` (log only) or `resend` |
| `RESEND_API_KEY` | Only if `EMAIL_PROVIDER=resend` | Real email sending |
| `EMAIL_FROM` | Only if `EMAIL_PROVIDER=resend` | Verified sender address |
| `ANTHROPIC_API_KEY` | No (defaults to template drafting) | Switches production drafting to a real Claude call |

## What Derrick needs to explicitly authorize before this goes live

- Switching `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` from test to live
  keys (real charges).
- Setting `EMAIL_PROVIDER=resend` with a real `RESEND_API_KEY` (real email
  to real buyers) — and separately, setting up Arthur's own Gmail API/OAuth
  configuration if Gmail sending is wanted instead of a transactional
  provider (Gmail connected to another AI tool does not carry over — see
  `CLAUDE.md`'s EMAIL RULES section).
- Any public deployment (custom domain, public URL) — v1 is designed to run
  locally or in a private preview environment only.
