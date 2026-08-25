# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This is Derrick Higgins's "Foundation OS" repo — not a single app. It holds
multiple, independent, self-contained projects, each with its own docs,
`.claude/agents/`, and (usually) its own Next.js + Prisma app under `app/`.
Projects do **not** share a database or codebase with each other, even when
they share buyers or lessons. Always work inside one project's directory;
don't assume conventions in one project apply to another without checking.

Current projects:

- **`arthur-os/`** — Arthur Digital Works OS: a one-person, AI-operated
  white-label digital-product studio (order-to-delivery). Start with
  `arthur-os/CLAUDE.md` (the full mission/governance spec) before touching
  code — it defines non-negotiable governance rules (payment/delivery/QA
  approval gates, no agent marks its own homework, audit-log everything)
  that the code in `arthur-os/app/` must respect.
- **`revenue-os/`** — a four-agent lead-to-conversation Revenue OS
  (market-signal-researcher → offer-architect → content-angle-strategist →
  conversation-system-builder), implemented as a multi-tenant CRM. Start
  with `revenue-os/business-brief.md` and
  `revenue-os/runbooks/revenue-agent-runbook.md`.
- **`docs/monetization-strategy.md`** — a living cross-portfolio doc about
  monetizing Derrick's ~80+ other (non-repo) apps. `revenue-os/` is the
  engine for that work. Read it before starting monetization-strategy work,
  and update its "Session log" before finishing such a session — that log is
  the only memory that survives between sessions.
- **`db/workspace_schema.sql`** — a standalone Postgres schema (contacts /
  projects / tasks) for a generic workspace database, not tied to either app
  above.

When a task only concerns one project, `cd` into it (or scope file
operations to it) and rely on that project's own README/CLAUDE.md for
specifics rather than duplicating those details here.

## Both Next.js apps: common commands

`arthur-os/app/` and `revenue-os/app/` are both Next.js 14 (App Router) +
Prisma + TypeScript + Tailwind, with an identical script surface. Run these
from inside the relevant `app/` directory:

```bash
npm install
npm run dev            # start dev server at localhost:3000
npm run build           # production build
npm run typecheck       # tsc --noEmit
npm run lint             # next lint
npm run db:generate      # prisma generate
npm run db:push          # push prisma/schema.prisma to the database (no migration files)
npm run db:migrate       # prisma migrate dev
```

There is no configured test runner (no `test` script, no test files) in
either app as of this writing — don't assume Jest/Vitest exists. Verifying a
change means: `npm run typecheck`, `npm run build`, and, for anything
touching a live flow, actually exercising it against local Stripe
test-mode/webhooks as described in each app's README.

`arthur-os/app` additionally has `npm run db:seed` (creates the single
seeded Owner login from `OWNER_EMAIL`/`OWNER_PASSWORD` — this app has no
public signup).

Both apps need their own `.env` (copy from `.env.example` in that `app/`
dir) and a Postgres database before `dev`/`build` will fully work — see each
app's README for the exact required variables. Never put real production
credentials in `.env.example` or commit a filled-in `.env`.

## Shared architectural pattern: `.claude/agents/` is the source of truth

Both `arthur-os/` and `revenue-os/` define their specialist AI agents as
markdown files with YAML frontmatter under `<project>/.claude/agents/*.md`
(name, description, tools, model, then the standing task-contract prose).
These are not just planning docs — the running app code loads them directly
as system prompts for real Anthropic API calls, so the CRM/product and the
agent-contract docs cannot drift apart:

- `revenue-os/app/src/lib/agents.ts` reads `../.claude/agents/*.md` and
  calls the Claude API with that file's content as the system prompt, when
  a user clicks "Run agent" on a lead.
- `arthur-os/.claude/agents/*.md` define the contracts that
  `arthur-os/app/src/lib/*` (e.g. `qualification.ts`, `production.ts`)
  implement or will eventually call into.

**When changing agent behavior, edit the relevant `.claude/agents/<name>.md`
file, not just the app code** — for `revenue-os` especially, the app reads
that file at runtime, so editing only TypeScript won't change what the
Claude API call actually does. Every agent file follows the same task-
contract shape: objective, approved inputs, allowed tools/data, prohibited
actions, output format, acceptance criteria, confidence score, escalation
triggers, QA reviewer/expiration — keep new or edited agents consistent
with that structure.

## Cross-project conventions worth knowing

- **Provider-agnostic integration points.** Both apps wrap billing behind an
  interface rather than calling Stripe directly everywhere:
  `revenue-os/app/src/lib/billing/` (`types.ts` defines the interface,
  `stripe.ts` is the concrete implementation). `arthur-os/app/src/lib/email/`
  does the same for email (`test` provider logs to the `EmailEvent` table
  and sends nothing; a `resend` implementation exists behind
  `EMAIL_PROVIDER=resend`). Follow this pattern — add a new provider as a
  new file implementing the existing interface, don't inline a second
  payment/email SDK call site.
- **API-first, server-side business rules.** Every consequential action
  (payment, delivery, approval, QA sign-off) is a server-side `/api` route
  handler with its own auth check and an audit-log write. The UI calls
  these routes; it does not embed business logic itself. This matters most
  in `arthur-os`, where governance rule 5/6 (approval gates, no agent
  approves its own work) is enforced at this layer, not by convention.
- **Idempotency on webhooks.** Stripe webhook handlers key off the Stripe
  session/event ID so replays don't double-create Orders/Projects — follow
  this when touching `api/stripe/webhook` or `api/billing/webhook` in
  either app.
- **Test/sandbox mode until explicitly authorized.** Both apps default to
  Stripe test-mode keys and non-production email sending. Do not wire in
  live payment keys or enable real outbound email unless the user
  explicitly authorizes going to production — this is a repeated,
  intentional constraint in both projects' docs, not an oversight to "fix."
- **v1 is a deliberately small vertical slice, not the full design.** Each
  project's docs describe a much larger target platform than what's
  currently built (see `arthur-os/docs/vertical-slice-plan.md` and the
  "What's real vs. what's a v1 shortcut" sections in both `app/README.md`
  files). Don't build toward the full target architecture unless asked —
  extend the existing vertical slice, and check `docs/owner-decisions-needed.md`
  (arthur-os) before making a call the owner hasn't made yet.
