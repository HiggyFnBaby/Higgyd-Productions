# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this repo is

**Higgyd-Productions** is Derrick Higgins' "Foundation OS" — a shared
knowledge base and project home across all of Derrick's apps, not a
single-app repo. Derrick is a **no-code creator**: he builds and directs apps
and automations with Claude's help, but does not write code himself and has
no prior developer background.

**This changes how you should write and explain things here, not just what
you build:**

- In docs, commit messages, and any explanation aimed at Derrick: use plain
  language. Define jargon on first use (e.g. "a **subagent** is a specialist
  Claude Code persona with its own job and instructions"). Never assume prior
  dev knowledge.
- In code: normal engineering conventions apply (see below) — the
  plain-language rule is for docs and explanations, not for variable names.
- Derrick's buyer profile for anything sellable is **B2B small businesses**
  — pricing and positioning guidance should default to that unless a doc
  says otherwise.

## Repository structure

```
.
├── README.md                      One-line repo description
├── CCB-NC 4.0                     License file (content is actually CC0 1.0 — see note below)
├── docs/
│   └── monetization-strategy.md   Living doc: persistent memory for the ~80+ app monetization effort
└── revenue-os/                    A self-contained multi-agent Claude Code project (see below)
    ├── business-brief.md
    ├── runbooks/revenue-agent-runbook.md
    ├── .claude/agents/*.md        4 subagent definitions (the actual product)
    └── app/                       Next.js + Prisma CRM that runs those agents
```

### `docs/monetization-strategy.md` — read this first, update it last

This file is explicitly **persistent session memory**: conversation history
disappears when a session ends, this file is what survives. It tracks the
strategy for monetizing Derrick's ~80+ app portfolio (stack decisions, buyer
profile, open decisions, a dated session log).

- **Before doing monetization-related work:** read this file for current
  state and open decisions.
- **After doing monetization-related work:** append a dated entry to the
  "Session log" section (follow the existing entries' style — what changed,
  why, what's still open, what's next). Don't just edit prior entries away;
  the log is a history, not a snapshot.
- Key standing facts from this doc: ~80+ apps already built with
  Claude/Claude Code, most already live; base44 (a no-code platform) is
  shelved but not abandoned; payment processor is not yet decided; the
  rollout plan is to prove a monetization template on 1–3 pilot apps before
  stamping it across the rest — never attempt all 80+ at once.

### `revenue-os/` — the Revenue OS project

A multi-agent "Revenue Operating System": four Claude Code subagents that
turn raw market signal into a working, priced, sellable sales conversation.
Read in this order if you're new to it:

1. `revenue-os/business-brief.md` — the thesis ("money is not a tool, money
   is in systems") and why it's structured as four agents.
2. `revenue-os/runbooks/revenue-agent-runbook.md` — the step-by-step
   operating manual for actually running the chain.
3. `revenue-os/app/README.md` — how to run the actual CRM application.

**The four-agent chain** (`revenue-os/.claude/agents/*.md`), each a strict
pipeline stage — never skip ahead or invent an upstream artifact:

| Order | Agent | Input | Output |
|---|---|---|---|
| 1 | `market-signal-researcher` | a niche/audience/app idea | signal report: evidenced pain points, not opinions |
| 2 | `offer-architect` | a signal report | offer brief: one promise, one buyer, one price, one format |
| 3 | `content-angle-strategist` | an offer brief (+ signal report) | 3–7 content angles mapped to funnel stage |
| 4 | `conversation-system-builder` | offer brief + angle set | conversation blueprint: branches, objections, the close |

Each agent's `description:` frontmatter states what NOT to use it for (e.g.
don't run `offer-architect` with no signal report behind it) — respect that
when deciding which agent to invoke. The chain is a loop, not a line: real
results from a conversation blueprint (what closed, what got objected to)
feed back in as new signal for round two.

Decisions that stay human, never automated away: whether a signal report is
strong enough to act on, whether an offer's price is right, which angle to
put your name behind, which conversation branches to automate vs. handle
personally.

## `revenue-os/app/` — the running application

A real multi-tenant Next.js 14 (App Router) + Prisma + PostgreSQL CRM. The
pipeline board's stages (`SIGNAL → OFFER → ANGLE → CONVERSATION → WON/LOST`)
are literally the four-agent chain — this is not a generic CRM with agents
bolted on afterward.

### Stack

- Next.js 14 (App Router), React 18, TypeScript
- Prisma 5 + PostgreSQL
- NextAuth (JWT sessions, credentials/email+password provider only)
- Tailwind CSS
- `@anthropic-ai/sdk` for the in-app "Run agent" button
- Stripe for billing, behind a provider-agnostic interface

### Setup and common commands

Run everything from `revenue-os/app/`:

```bash
cp .env.example .env      # then fill in real values — see .env.example comments
npm install
npm run db:push           # sync prisma/schema.prisma to the database
npm run dev                # http://localhost:3000

npm run typecheck          # tsc --noEmit
npm run lint                # next lint
npm run build                # production build
npm run db:migrate           # prisma migrate dev (use instead of db:push once schema is stable)
```

There is no test suite and no CI config in this repo yet. Before calling
application work done, run `npm run typecheck` and `npm run build` in
`revenue-os/app/` — the business brief records that both were last verified
clean on 2026-07-09, and any change should keep that true.

`.env` requires three external services to fully work (see
`revenue-os/app/.env.example` and `revenue-os/app/README.md` for exact
values and where to get them): a Postgres database (Supabase/Neon/etc.), an
Anthropic API key (`ANTHROPIC_API_KEY` — powers "Run agent"; without it
everything else still works), and a Stripe account (powers "Upgrade";
without it everything else still works). Nothing here has real credentials
committed — don't add any.

### Conventions specific to this app — follow these, don't reinvent them

- **Agents are loaded live from `.claude/agents/*.md`, never duplicated.**
  `src/lib/agents.ts` reads the actual subagent definition files (via
  `gray-matter` frontmatter parsing) and uses their content as the Claude
  API system prompt. This is intentional: the CRM and the planning docs
  must never drift apart because they're reading the same files. If you add
  a fifth agent, add it to `revenue-os/.claude/agents/`, then register it in
  `AGENT_FILES` and `AGENT_FOR_STAGE` in `src/lib/agents.ts` — don't
  hardcode a prompt string in the app.
- **Tenant isolation goes through one chokepoint.**
  `src/lib/currentWorkspace.ts`'s `requireWorkspaceId()` is the only place
  that resolves a workspace from the session. Every API route touching
  `Lead`/`Task`/`AgentRun` must call it first and return 401 on `null` —
  never trust a `workspaceId` from anywhere else (a request body, a query
  param).
- **Billing is provider-agnostic by design.** App code (checkout route,
  webhook route, billing page) talks only to the `BillingProvider` interface
  in `src/lib/billing/types.ts`, never to the Stripe SDK directly outside
  `src/lib/billing/stripe.ts`. Adding Paddle/LemonSqueezy later means one
  new file implementing that interface — not touching call sites. Keep this
  boundary intact when you touch billing code.
- **Stage change always creates a task.** `src/lib/automations.ts` is the
  one "classic" (non-AI) automation: every pipeline stage transition
  auto-creates a next-action `Task` via `NEXT_ACTION_BY_STAGE`, so a lead
  never silently goes quiet. If you add a new `PipelineStage`, you must add
  its entry here (and to `AGENT_FOR_STAGE` if an agent applies) or the
  `Record` type will fail to compile.
- **Schema changes:** edit `prisma/schema.prisma`, then run
  `npm run db:push` (fast, no migration history — fine during active
  development) or `npm run db:migrate` (generates a migration — prefer this
  once the schema stabilizes or before shipping to real users).
- v1 known shortcuts (see `revenue-os/app/README.md` for the full list):
  email+password auth only (no OAuth, no password reset), one user per
  workspace (no team invites), stage change via dropdown not drag-and-drop.
  Don't "fix" these unprompted — they're documented trade-offs, not bugs.

## General conventions across the repo

- **No CI, no automated tests currently exist anywhere in this repo.**
  Treat `npm run typecheck` / `npm run build` (inside `revenue-os/app/`) as
  the verification bar for app changes until a test suite exists.
- **Don't commit secrets.** `.env` is gitignored; only ever edit
  `.env.example` with placeholder/instructional values.
- **License note:** the file `CCB-NC 4.0` at the repo root is named for
  Creative Commons BY-NC 4.0 but its actual contents are the CC0 1.0
  Universal legal code. Flag this mismatch to Derrick rather than silently
  assuming either license is authoritative if it becomes relevant to a task.
- **Living docs vs. static docs:** `docs/monetization-strategy.md` is a
  living doc (append to its session log, don't just overwrite). Everything
  under `revenue-os/` (business brief, runbook, README) is closer to a
  static spec — update it in place when it goes stale, no session-log
  convention there.
