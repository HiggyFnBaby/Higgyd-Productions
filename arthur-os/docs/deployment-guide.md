# Deployment Guide — Private Preview

Scope: this covers standing up `arthur-os/app` as a **private, preview-only**
Vercel deployment — decision #6's chosen first step
(`owner-decisions-needed.md`). It does **not** cover a public launch (custom
domain, production Stripe keys, real customer email) — that's a separate,
later, explicitly-authorized step per `CLAUDE.md`'s BUILD METHOD ("Stop and
request approval before production deployment... or sending real customer
communications"). Nothing here changes that gate.

## Why this is a new Vercel project, not a change to the existing one

This repo already has a Vercel project ("higgyd-productions") wired to GitHub
PRs — but its Root Directory is set to `revenue-os/app`, so it builds and
previews *that* project on every PR, not `arthur-os/app`. Repointing it would
stop previewing `revenue-os` and doesn't make sense for two separate
products sharing one repo. `arthur-os/app` needs its own Vercel project,
same pattern, different Root Directory.

## Prerequisites

1. **Vercel access authorized for Claude Code.** Not done yet as of this
   doc's writing — authorize the Vercel connector (claude.ai connector
   settings, or `/mcp` in an interactive session) before attempting the
   steps below through Claude Code. Until then, these steps can be done
   manually in the Vercel dashboard instead.
2. **A real (free-tier) Postgres database**, reachable from the internet —
   Neon or Supabase, same as local dev (`environment-and-accounts.md`).
   Unlike local dev, a Vercel deployment needs this to actually be set for
   anything beyond the static marketing page to work — every admin page and
   API route hits Postgres at request time.
3. **A Stripe account, test mode** — same `sk_test_...` key as local dev.
   Do not use a live key for a preview deployment.

## Steps

1. **Create the Vercel project.** In the Vercel dashboard (or via the
   Vercel MCP tools once authorized): "Add New Project" → import the same
   GitHub repo (`HiggyFnBaby/Higgyd-Productions`) → set **Root Directory**
   to `arthur-os/app` → Framework Preset should auto-detect as Next.js.
   Prisma Client generates automatically on `npm install` (via
   `@prisma/client`'s own `postinstall` hook) — no extra build config
   needed, same as the existing `revenue-os/app` project.
2. **Set environment variables** in the new project's settings — same list
   as `app/.env.example` / `environment-and-accounts.md`:
   `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the deployment's own
   URL, not `localhost`), `OWNER_EMAIL`, `OWNER_PASSWORD`,
   `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (test — see step 4),
   `DELIVERY_SECRET`. Leave `EMAIL_PROVIDER` unset (defaults to test-mode
   logging) unless decision #2 changes.
3. **Push the schema and seed the Owner + approval policies.** Vercel
   doesn't run `db:push`/`db:seed` automatically. From a local machine with
   the same `DATABASE_URL` in `.env`:
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. **Configure the Stripe test-mode webhook** to point at the real
   deployment URL, since the local `stripe listen` CLI forwarding trick only
   works for localhost. In the Stripe Dashboard (test mode): Developers →
   Webhooks → Add endpoint → `https://<your-deployment-url>/api/stripe/webhook`
   → subscribe to `checkout.session.completed` → copy the signing secret
   into `STRIPE_WEBHOOK_SECRET`.
5. **Enable Vercel's deployment protection** (password protection or
   Vercel Authentication, in the project's Deployment Protection settings)
   so the preview URL isn't fully open to the public internet even though
   it's technically reachable — this is what makes it "private preview,"
   not the public launch decision #6 is still gating. Removing this
   protection later is exactly the kind of action that needs the explicit
   go-ahead `CLAUDE.md` calls for.

## What this deliberately does not include

- No custom domain.
- No production/live Stripe keys.
- No real email sending (`EMAIL_PROVIDER` stays `test` unless decision #2
  changes separately).
- No public announcement or removal of deployment protection.

Each of those is its own, later, explicitly-authorized decision — this guide
only covers getting `arthur-os/app` running somewhere Derrick can click
through it from a real URL instead of only `localhost`.
