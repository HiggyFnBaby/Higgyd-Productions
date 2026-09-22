# Monetization Strategy — Living Doc

This file is the persistent memory for Higgyd Productions' app monetization work.
Every session (this app or the next one) should read this before doing anything,
and update it before finishing. Conversation memory disappears when a session
ends — this file is what survives.

## Who this is for

Derrick Higgins (Higgyd Productions), building apps and CRMs with workflows and
automations as a **no-code creator**, not a traditional developer. Explanations
should always be plain-language: what a concept is, why it matters, and what it
costs in money or effort — never assume prior dev knowledge.

## Stack

- **Build platform(s):** Claude (Claude Code / Claude-assisted builds) —
  **current focus**. base44 is shelved for now, not abandoned; revisit later.
- **Payment processor:** Stripe — resolved, see "Open decisions" below.
- **This repo's role:** shared knowledge base / "Foundation OS" across all
  apps, not a single-app repo. Per-app details get their own section below as
  they're built out.

### Why the platform choice matters here

base44 is a no-code builder — it handles hosting, database, and often payments
for you inside its own walls. Building "with Claude" is different: Claude Code
writes real, custom code. That unlocks anything (any pricing model, any
integration) but it also means *you* (with my help) now own decisions base44
used to make for you automatically — where the app is hosted, what database it
uses, how login/accounts work, and how billing is wired in. None of that is
decided yet.

## Buyer profile

- **Primary buyer:** Small businesses (B2B)
- Implication: pricing should lean toward per-seat / per-account / per-workspace
  subscriptions rather than consumer micro-pricing. B2B buyers tolerate higher
  price points ($20–$200+/mo) if the app solves a clear operational pain
  (the CRM/workflow angle fits this well), but expect a legitimate business
  entity, invoicing, and support — not a hobby-project feel.

## Open decisions (need Derrick's input before building)

- [x] **Payment processor**: resolved in practice — Stripe. Both live apps
      (`revenue-os/app`, and `first-reply/` via PR #11) are built on Stripe
      behind a provider-agnostic billing interface, so switching to a
      merchant-of-record (Paddle/LemonSqueezy) later is one new file, not a
      rewrite. Sales tax stays Derrick's responsibility under Stripe.
- [ ] **Pricing model per app**: subscription vs. usage-based vs. one-time vs.
      freemium-with-upsells vs. selling templates/builds to other builders.
- [ ] **App inventory**: list of apps already built, what each does, current
      monetization status (free / paid / unreleased) — needs to be filled in.
- [ ] **Supabase free-tier pausing**: the free tier puts a database to sleep
      after ~7 idle days, which breaks every deploy and login until someone
      un-pauses it (see the 2026-09-17 session log entry). Pick one: upgrade
      the Supabase org to Pro (~$25/mo, never pauses), live with manually
      un-pausing before demos, or add a small daily "keep-alive" job.

## App inventory

**Scale: ~80+ apps already built with Claude/Claude Code.** This is the
single biggest fact shaping this whole strategy — it means the goal is NOT
"add billing to one app," it's "build one reusable monetization template
(auth + billing + hosting) that gets stamped onto a portfolio," because
hand-wiring payments into 80 apps individually doesn't scale.

**Deployment status:** most of the 80+ are already live/deployed.

**Rollout plan:** prove the monetization template on 1–3 apps first, then
stamp it across the rest of the portfolio. Do NOT attempt all 80+ at once.

**Auth status:** varies by app — some have login/accounts, some are open
access with no login. This is a per-app gating factor: no login means adding
one is a prerequisite step before billing can work.

**Pilot selection:** Derrick asked for help choosing the 1–3 pilot apps.
Criteria to use: (1) already has real usage/traction, (2) solves a clear
painful problem for a small business, (3) has or can easily get login, (4)
isn't the most complex build in the portfolio. Waiting on Derrick to share a
shortlist of candidate apps (name + one-liner + login status + usage) so we
can pick.

Still need to find out: whether the 80+ apps share a common structure/template
or are all bespoke one-off builds.

| App name | Platform | What it does | Buyer | Monetization status | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## Related project: Revenue OS

`../revenue-os/` — a real Claude Code multi-agent project (business brief +
4 subagents + runbook), built to answer "how do we actually monetize this"
in a repeatable way. Purpose is **both**: (1) internal engine for picking and
monetizing pilot apps from this portfolio, and (2) a future sellable
SaaS/CRM product for other entrepreneur-creators. See
`../revenue-os/business-brief.md` for the thesis ("money is not a tool, the
money is in systems") and `../revenue-os/runbooks/revenue-agent-runbook.md`
for how to actually run it. Still open: whether Revenue OS itself becomes
pilot #1.

## Session log

- **2026-07-05** — Initial setup. Clarified the ask: Derrick wants a reusable
  monetization *system*, not one-off advice, plus persistent memory across
  sessions/apps. Captured stack (base44 + Claude) and buyer profile (B2B small
  business). No monetization system built yet — next session should start by
  confirming payment processor choice, then inventorying existing apps.
- **2026-07-05 (cont.)** — Major scope update: focus narrowed to Claude-built
  apps only (base44 shelved, not abandoned). Discovered Derrick already has
  **~80+ apps built with Claude/Claude Code**, most already live/deployed,
  auth status varies per app. This reframes the whole project: not "add
  billing to one app" but "build one reusable monetization template (auth +
  billing + hosting) to stamp across a portfolio." Agreed rollout plan: pilot
  on 1–3 apps first, prove it, then roll out wider — not all 80+ at once.
  Waiting on Derrick to shortlist candidate pilot apps (name, one-liner, login
  status, usage) before picking pilots or building anything.
- **2026-07-06** — Pilot-selection work put on hold; Derrick started a new,
  bigger initiative: `revenue-os/`, a multi-agent Revenue Operating System
  (market-signal-researcher → offer-architect → content-angle-strategist →
  conversation-system-builder, plus a runbook). Built as a real Claude Code
  project (business brief + 4 real subagent definitions + runbook), not a
  single chat answer. Purpose is both internal (run Derrick's own portfolio)
  and productized (sell to other entrepreneur-creators later) — internal use
  proves it before it's sold. This is the mechanism for the pilot-app
  monetization work above, not a separate track. Next: come back to the
  pilot-app shortlist, and decide whether Revenue OS itself is pilot #1.
- **2026-07-09** — Turned Revenue OS from planning docs into a real running
  app: `revenue-os/app/`, a multi-tenant Next.js + Prisma CRM. Pipeline
  stages mirror the four-agent chain exactly; leads are prospective
  customers (not portfolio apps); built as full multi-tenant SaaS from day
  one (auth + billing included, not deferred). Billing built
  provider-agnostic with Stripe as the concrete v1 implementation — Derrick's
  answer on payment processor was "both," read as "architect for either,
  ship one first." AI-agent automation calls the Claude API in-app using the
  real `.claude/agents/*.md` files as system prompts. Verified: `npm install`,
  `prisma generate`, `tsc --noEmit`, and `next build` all pass clean. See
  `revenue-os/business-brief.md` for the fuller v1 summary and
  `revenue-os/app/README.md` for how to actually run it (needs a Postgres DB,
  an Anthropic API key, and a Stripe account — none wired to real credentials
  yet). Next: get real credentials in, run it end-to-end, then return to the
  pilot-app shortlist.
- **2026-07-29** — Revenue OS is now live in production, not just locally
  verified. Wired up a real Supabase Postgres database and a real Anthropic
  API key, then deployed `revenue-os/app` to Vercel at
  `higgyd-productions.vercel.app`. Verified end-to-end on the live site:
  signup creates a real workspace/user/membership, login works, the pipeline
  board loads, and moving a lead between stages auto-creates the next-action
  task exactly as designed. Billing/Stripe is still not wired up (env vars
  left blank) — that's the one piece of the v1 app that remains unproven for
  real; everything else (auth, multi-tenancy, the agent chain automation,
  hosting) is now confirmed working outside a sandbox.
  Notes for next time:
  - **Use Supabase's connection *pooler* string, not the "direct connection"
    one.** The direct connection host is IPv6-only and fails to connect from
    a lot of environments (this sandbox included); the pooler host
    (`aws-*.pooler.supabase.com`, port 5432 for a normal server app) works
    everywhere. Also: any password with `@` or `%` in it must be
    percent-encoded before it'll work inside the connection string URL.
  - Vercel's "Root Directory" for this project must be set to
    `revenue-os/app` (the app lives in a subfolder, not the repo root), and
    the "Include source files outside of the Root Directory" toggle must be
    turned on — the "Run agent" feature reads `.claude/agents/*.md` from
    *outside* that folder, and silently can't find them without this.
  - The Vercel **Build Command** needs to run `npx prisma db push` before
    `next build`, so schema changes actually apply to the real database on
    every deploy.
  - Derrick already had an unrelated, older Vercel project also named
    similarly (`revenue-os-ai`, connected to a separate `Revenue-OS-AI`
    repo) from an earlier abandoned attempt — cost real time getting
    confused between the two. The correct project for this repo is
    `higgyd-productions` on Vercel, connected to
    `HiggyFnBaby/Higgyd-Productions`.
  - Both the Supabase database password and the Anthropic API key had to be
    rotated mid-session after being pasted in chat — a reminder to generate
    credentials directly into a password manager or the target dashboard
    where possible, rather than typing/pasting them through a conversation.
  Next: decide on and wire up a payment processor (open decision above is
  still open), then return to picking the 1–3 pilot apps from the 80+
  portfolio now that the monetization template (auth + hosting + database +
  AI automation) is proven live end-to-end, not just in theory.
- **2026-07-29 (cont.)** — Started wiring up Stripe (test mode): created one
  recurring Price and added `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` to
  Vercel. `STRIPE_WEBHOOK_SECRET` still not set up — subscription status
  won't update after a real checkout until that's added. Note: the app only
  supports a single price/tier right now, not multiple plans; adding real
  tiers would need new app code (a plan picker + multiple Stripe Prices),
  not just Stripe config — flagging as a future decision, not started.
  Separately, discovered a **second, disconnected repo**
  (`HiggyFnBaby/Revenue-OS-AI`) from an earlier, abandoned session — same
  four-agent scaffold as `revenue-os/`, but it had actually been *run*
  against a real niche. Its research is real and evidenced (see
  methodology caveats inside each file): a signal report, offer brief,
  content angles, and conversation blueprint for **"RealEstateOS
  Enterprise"** — a real-estate-agent CRM angle on slow lead response time
  (the signal report itself already pointed back at this doc, so it always
  belonged here). Copied all four files into `revenue-os/signal-reports/`,
  `revenue-os/offer-briefs/`, `revenue-os/content-angles/`, and
  `revenue-os/conversation-blueprints/` so this repo has one home for
  Revenue OS work going forward — treat `Revenue-OS-AI` as superseded, not
  a second active project. Next: finish the Stripe webhook, then decide
  whether "RealEstateOS Enterprise" is worth pursuing as pilot #1 — the
  groundwork (evidenced pain point + priced offer + angles + a close
  script) is already sitting in `revenue-os/`, unlike every other portfolio
  app which still has none of that.
- **2026-07-29 (cont. 2)** — Stripe billing finished and verified live:
  webhook endpoint added (`customer.subscription.created/updated/deleted`),
  `STRIPE_WEBHOOK_SECRET` set in Vercel, then tested end-to-end with a real
  Stripe test-mode checkout — billing page correctly flipped from
  `Status: NONE` to `Status: ACTIVE` after payment, confirming the full
  chain (checkout to Stripe to webhook to database) works. `revenue-os/app`
  is now a complete, working v1: auth, multi-tenancy, the pipeline board,
  AI-agent automation, and billing all proven live, not just locally.
  Derrick decided to move forward on FirstReply (the RealEstateOS
  Enterprise offer) as the next thing to actually build, asked to be led
  through it. Next: scope and build FirstReply as its own project.
- **2026-09-08** — Built FirstReply v1 as its own project (`first-reply/`,
  Next.js + Prisma, same stack shape as `revenue-os/app`): an agent's
  lead-capture link triggers an instant auto-reply email plus a 3-day/
  10-day follow-up cadence via Resend, so a slow response never loses a
  lead — priced at **$129/month per agent** per the offer brief. Then
  merged the long-open "Add CLAUDE.md" PR (#2), which had gone stale while
  other sessions merged `arthur-os/` (a second full project), the Airtable
  → Postgres migration tooling (`db/airtable-migration/`, covering both
  Revenue OS CRM and a **Content OPS** Airtable base), and a shelved
  `self-hosted-baas/` experiment into `main` — main had independently
  grown its own CLAUDE.md (from a different PR) describing that
  multi-project shape. Resolved the resulting add/add conflict by hand:
  merged main's up-to-date "multiple projects" repository shape with this
  branch's no-code-creator/plain-language guidance and the license-file
  naming mismatch note, and added `first-reply/` to the project list so
  the doc doesn't go stale again immediately. No code conflicts — only
  CLAUDE.md collided. Next: decide whether to launch FirstReply to real
  agents (billing wiring, live email sending) or continue treating it as a
  proven-in-test v1; revisit the still-open payment-processor decision
  before either.
- **2026-09-17** — Diagnosed why every Vercel deploy of `revenue-os/app`
  (the `higgyd-productions` Vercel project) has failed since Sep 8, which
  was also putting a red check on the FirstReply launch-prep PR (#11). The
  build dies at `prisma db push` with "P1000: Authentication failed" at
  the Supabase pooler. Two things were wrong at once:
  1. The **"Revenue OS" Supabase project was paused.** Supabase's free
     tier pauses a database after about a week with no traffic, and a
     paused database rejects connections in a way Prisma reports as bad
     credentials. Every Supabase project on the account (Revenue OS,
     arthur-os, Foundation OS, and four unrelated ones) was paused —
     nobody had used the apps, so they went to sleep. Restored the
     Revenue OS project from this session (took ~4 minutes to come back);
     the other paused projects were left alone.
  2. **The database password stored in the `higgyd-productions` Vercel
     project is also stale.** With the database confirmed healthy and its
     tables intact, a fresh build still failed with the exact same P1000
     error, so the earlier guess on PR #11 was half right. Fixing this is
     a Vercel dashboard change (Environment Variables → `DATABASE_URL`),
     which can't be done from a coding session — see the steps handed to
     Derrick in the 2026-09-17 session. The `first-reply` Vercel project
     was also red (stale Prisma Client); ported PR #11's one-line
     `prisma generate && next build` fix onto this branch and it went green.
  Notes for next time:
  - **A paused Supabase project looks like a wrong password.** If a build
    or login fails with "Authentication failed against database server"
    and nothing changed, check the Supabase dashboard for a "Paused"
    badge before rotating anything.
  - **This will happen again on the free tier** every ~7 idle days. The
    options are: upgrade the Supabase org to Pro (~$25/mo, no pausing),
    accept manually un-pausing before each demo/deploy, or add a tiny
    scheduled job that touches the database daily. Added to the open-decisions list above.
  - The `revenue-os` Vercel project (created Aug 25) builds the same
    folder as `higgyd-productions` but does **not** run `prisma db push`
    in its build, so it stays green even when the database is unreachable.
    Two Vercel projects for one app is the same confusion the Jul 29 notes
    warned about — worth picking one and deleting the other.
  Next: Derrick updates `DATABASE_URL` on the `higgyd-productions` Vercel
  project and redeploys `main`; once that build is green, merge PR #11 and
  run its test-mode launch checklist.
- **2026-09-22** — Housekeeping session. Closed PR #3 (a standalone browser
  todo app from an old experiment) as out of scope — this repo holds business
  projects with a buyer attached, and that one had none. The branch still
  exists if it's ever wanted. Marked the **payment-processor decision
  resolved: Stripe**, which had sat open in this doc since day one while
  being quietly answered in practice. Resolving it doesn't make it free:
  under Stripe, **sales tax and VAT are Derrick's to handle**, where a
  merchant-of-record like Paddle would have done it for a bigger cut. That
  only bites when selling into the EU at volume, so it's recorded in the
  decision rather than reopened.
  Two things came out of the session that weren't planned:
  - **The `first-reply` build was broken on `main`, not just in open
    branches.** Opening the doc PR (#13) ran CI and the FirstReply deploy
    failed. Reproduced it locally by deleting the generated Prisma Client to
    recreate what a fresh CI checkout starts from; `next build` doesn't
    generate one, so type checking dies on the first Prisma type it sees.
    Ported the same one-line `prisma generate && next build` fix #12 carries
    and confirmed it green in CI. So PR #13 ended up carrying a code change
    as well as the doc change.
  - **The duplicate Vercel projects accidentally proved the DATABASE_URL
    diagnosis.** On one identical commit, `revenue-os` deployed fine while
    `higgyd-productions` failed. Both build `revenue-os/app`; the only
    difference is that the failing one runs `prisma db push`. Same code, same
    commit, and only the one that talks to the database dies. That rules out
    the code entirely — useful the next time this looks ambiguous, and one
    more reason to collapse the two projects into one.
  Merged #12 and #13. Next is still blocked on the dashboard fix only Derrick
  can make: update the stale `DATABASE_URL` on the `higgyd-productions`
  Vercel project, which is the last red check on #11. Then merge #11 and run
  FirstReply's live launch checklist to put it in front of one paying agent.
