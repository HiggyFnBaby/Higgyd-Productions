# Revenue OS CRM (v1)

This is the actual running application version of the Revenue OS idea
described in `../business-brief.md` and `../runbooks/revenue-agent-runbook.md`.
Read those first if you haven't — this file is just "how to run it," not
"why it exists."

## What this is, in plain terms

A CRM where every lead moves through five stages that match the Revenue OS
chain: **Signal → Offer → Angle → Conversation → Won/Lost**. On each lead's
page, a "Run agent" button calls the Claude API using the exact same agent
definitions from `../.claude/agents/` — so the CRM and the planning docs
never drift apart; they're reading the same files.

It's a real multi-tenant app: anyone who signs up gets their own private
workspace, and billing (Stripe, to start) gates access per workspace.

## Before you can run it, you need three things

You don't need to be a developer to get these — each is a signup form on a
website, not a coding task.

1. **A Postgres database.** Easiest free option: create a project at
   [supabase.com](https://supabase.com) or [neon.tech](https://neon.tech) and
   copy the connection string into `DATABASE_URL`.
2. **An Anthropic API key.** Create one at
   [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   and put it in `ANTHROPIC_API_KEY`. This is what makes the "Run agent"
   button actually work — without it, everything else in the app still
   works, that one button just returns an error.
3. **A Stripe account** (test mode is fine while building). Create a
   recurring Price for your subscription in the Stripe Dashboard, and put its
   secret key + price ID + webhook secret into the matching `.env` values.
   Until this is set up, the "Upgrade" button on the billing page will show
   an error instead of a checkout page — everything else still works.

## Running it locally

```bash
cp .env.example .env
# fill in .env with real values, at minimum DATABASE_URL and NEXTAUTH_SECRET

npm install
npm run db:push      # creates the tables in your database from prisma/schema.prisma
npm run dev          # starts the app at http://localhost:3000
```

Then visit `http://localhost:3000`, click "Create workspace," and you're in.

## What's real vs. what's a v1 shortcut

- **Real:** auth, multi-tenant data isolation, the pipeline board, stage-change
  automation (auto-created tasks), the Claude API agent runs, the Stripe
  checkout + webhook flow, the provider-agnostic billing interface.
- **v1 shortcuts, worth knowing about before this goes to real customers:**
  - Login is email+password only — no "forgot password" flow yet, and no
    Google/OAuth login.
  - No team invites yet — one user per workspace (the person who signed up).
  - The pipeline board uses a dropdown to change stage, not drag-and-drop —
    functionally equivalent, just less polished.
  - Only Stripe is wired up; Paddle/LemonSqueezy would need a new file in
    `src/lib/billing/` implementing the same interface (see that folder's
    `types.ts`).

## Keeping the database awake (daily keep-alive)

Supabase's free tier **pauses a project after about a week with no database
activity**. A paused database then refuses connections in a way Prisma reports
as `P1000: Authentication failed`, which reads like a wrong password. Because
this project's Vercel build runs `prisma db push` before compiling, a pause
breaks every deploy — that is exactly what happened silently from 2026-09-08
until it was found and fixed on 2026-09-26.

To stop that recurring, `vercel.json` registers one Vercel Cron job that calls
`/api/cron/keep-alive` once a day. That endpoint runs a single `SELECT 1`. It
touches no table and writes nothing; it exists only so the database sees
traffic. Running daily against a ~7-day pause window leaves about six days of
slack, so one missed run is harmless.

**This only works if `CRON_SECRET` is set on the Vercel project.** Vercel sends
that value as a `Bearer` token, and without it the endpoint refuses to run
rather than sit on the internet unauthenticated. If it is missing, the cron will
appear to run while doing nothing and the database can pause again.

Setup, once per Vercel project that deploys this app:

1. Generate a secret: `openssl rand -base64 32`
2. Add it as `CRON_SECRET` in the Vercel project (Settings → Environment
   Variables), for Production.
3. Redeploy so the cron is registered.
4. Confirm it took: the project's **Cron Jobs** tab should list
   `/api/cron/keep-alive`, and after the first run its log should show
   `{"ok":true,...}`. A `503 Not configured` there means step 2 did not save.

Two caveats worth knowing:

- **A keep-alive prevents pausing; it cannot undo one.** If the database is
  already paused, the cron fails too. Restore the project in the Supabase
  dashboard first, then the job keeps it up from there.
- **This repo currently has two Vercel projects building this same folder**
  (`higgyd-productions` and `revenue-os`). Both will register the cron, so the
  database gets two harmless pings a day until one of those projects is
  retired.

## Where things live (if you want to look under the hood)

- `prisma/schema.prisma` — the data model (Workspace, Lead, AgentRun, Task,
  StageEvent, Subscription).
- `src/lib/agents.ts` — loads the real agent definitions from
  `../.claude/agents/*.md` as Claude API system prompts.
- `src/lib/automations.ts` — the one classic automation: stage change always
  creates a next-action task.
- `src/lib/billing/` — the provider-agnostic billing interface + Stripe
  implementation.
- `src/app/dashboard/` — the actual UI (pipeline board, lead detail, billing).
