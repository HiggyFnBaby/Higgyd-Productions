# Airtable Trial Migration Strategy

**Status: done.** Both Airtable bases are audited, the Postgres schema and
importer are built and validated end-to-end, the actual data is now
loaded into the real `revenue_os_crm` / `content_ops` schemas in the live
Revenue OS Supabase database (see Step 5), and all 5 of the original
Airtable automations — including the 2 that send email — are now live as
Postgres triggers/cron jobs (see Step 4). Everything below is already in
the repo — this doc is the map of what exists and what was decided along
the way.

## Step 1: Audit — what's actually in Airtable

Two bases, both on the free/undeployed side of things — nothing described
below is currently live-firing:

### Base 1 — "Revenue OS CRM" (`apphhT2YHy5AupUeB`)

| Table | Rows | Purpose |
|---|---|---|
| Contacts | 6 | Leads/prospects/customers, with rollup fields for Lifetime Value and Open Pipeline Value |
| Deals | 6 | Sales pipeline (New Lead → Qualified → Proposal Sent → Negotiation → Won/Lost), with formula fields Weighted Value and Days in Pipeline |
| Products | 6 | The "Digital Equity Auto-Inventory" — assets tracked from Minting → In Production → Live → Sold Out |
| Orders | 5 | Fulfilled sales, linking a customer, product(s), and the originating deal |
| Activities | 10 | Touchpoints, follow-ups, and agent-to-agent audit log entries |
| Content | 5 | YouTube/short-form content, with attribution links back to leads and deals it influenced |

All linked-record fields, rollups, and formulas are documented field-by-field
in `db/airtable-migration/field_maps.py`. Every table only has the default
Grid view — no Kanban/Calendar/filtered views to replicate.

**Automations** (`list_automations`): 5 defined, **all in `undeployed`
(draft) status** — none of these are actually running against your data
today:

1. New Contact created → auto-create a qualification Activity
2. Deal stage → Won → auto-create an Order (carrying amount/customer/products)
3. Deal stage changes → email an executive alert
4. Product → Live → create a CMO "multi-channel distribution" Activity
5. Daily 8am cron → email a digest of open (not Won/Lost) deals

### Base 2 — "TheRealKingOfAI — Content OPS" (`apprfcwDHq7ElBQ3S`)

| Table | Rows | Purpose |
|---|---|---|
| Content Calendar | 6 | Production pipeline, one row per video |
| Performance | 1 | Published metrics vs. CTR/retention benchmarks |
| Shorts | 9 | 3 shorts per long-form video and where each is posted |

No automations configured on this base. One data-quality note: `Shorts →
Parent Video` is a plain text field, not a real Airtable link — it just holds
the parent video's title as a string. The Postgres schema below preserves the
raw text and adds a best-effort resolved foreign key via title match; treat
`parent_video_id` as "probably right," not guaranteed, the way the Airtable
field itself was.

Both bases are small (record counts above) — this reads as demo/seed data
for the four-agent Revenue OS system, not years of accumulated production
data. That changes the risk calculus for Step 3 below: there's very little
to lose, and no reason to delay.

## Step 2: Build environment — already decided, mostly

This repo already committed to Claude Code + a real Postgres backend before
this task started:

- `revenue-os/app/` is a working Next.js + Prisma app with `datasource db {
  provider = "postgresql" }`, meant to run against Supabase/Neon (see its
  README).
- `db/workspace_schema.sql` already exists as a (generic, pre-audit)
  Postgres schema explicitly written to replace "the Airtable-based
  contact/project/task trackers."

So the Claude Code / Postgres path was the standing decision, not a fresh
choice — I didn't need to re-litigate Cowork-vs-Code here.

**What wasn't already decided, and I flagged rather than guessed:** the
audited "Revenue OS CRM" base is a materially different data model from
`revenue-os/app`'s existing Prisma schema. The Prisma app models one thing —
a `Lead` moving through SIGNAL → OFFER → ANGLE → CONVERSATION → WON/LOST, the
pipeline for *selling Revenue OS itself*. The Airtable base models something
else — Contacts/Deals/Products/Orders/Activities/Content, i.e. the actual
day-to-day sales ops for Derrick's digital-product business. Forcing the
Airtable data into the `Lead` model would drop the Products/Orders/Content
layer entirely, so I didn't do that. Instead:

- `db/airtable-migration/schema.sql` adds two **new** Postgres schemas,
  `revenue_os_crm` and `content_ops`, alongside (not replacing) the existing
  `public` schema Prisma manages. Same database, no collision, nothing in
  `revenue-os/app` has to change to adopt this.
- `db/workspace_schema.sql` is now superseded by
  `db/airtable-migration/schema.sql` for these two bases specifically — it
  was written before the real audit and doesn't have a Products/Orders/
  Content layer at all. I left the old file in place rather than deleting it
  in case it's referenced elsewhere; it's just no longer the migration
  target.

## Step 3: Export & schema — done

- **CSV safety backups**, one file per table, human-readable (matches what
  Airtable's own "export CSV" would give you):
  `db/airtable-migration/exports/csv/{revenue-os-crm,content-ops}/*.csv`
- **Raw JSON exports** (full fidelity, including Airtable record IDs — this
  is what the importer actually reads, since CSV's flattened link columns
  aren't enough to rebuild foreign keys reliably):
  `db/airtable-migration/exports/raw/{revenue-os-crm,content-ops}/*.json`
- **Relational schema**: `db/airtable-migration/schema.sql` — full DDL for
  both bases, with linked-record fields turned into real foreign keys and
  join tables (`deal_products`, `order_products`, `content_products`,
  `content_deals`, `content_leads`), and every Airtable rollup/formula field
  (Lifetime Value, Weighted Value, Days in Pipeline, Units Sold, Revenue
  Generated, Influenced Revenue) rebuilt as a SQL view instead of a stored
  column, so they stay derived instead of drifting out of sync the way a
  plain copied number would.
- **Ingestion script**: `db/airtable-migration/import_to_postgres.py` — a
  two-pass loader (insert scalars keyed by `airtable_record_id`, then resolve
  every link field/join table using that ID map) that reads the raw JSON
  exports and bulk-loads them. Run once you have a `DATABASE_URL`:
  ```bash
  psql "$DATABASE_URL" -f db/airtable-migration/schema.sql
  pip install psycopg2-binary
  DATABASE_URL=postgresql://... python3 db/airtable-migration/import_to_postgres.py
  ```

## Step 4: Automations → rebuilt (all 5, including the 2 that email)

Of the 5 drafted (never-deployed) Airtable automations, all 5 are now live
against the real database:

- **3 are pure DB logic** and are live as Postgres triggers in
  `schema.sql`: new-contact → qualification Activity, Deal→Won → auto-create
  Order (+ carries over the deal's linked products), Product→Live → CMO
  distribution Activity.
- **2 send email** (executive stage-change alert, daily pipeline digest).
  A plain Postgres trigger can't call an email API on its own, so these are
  built in `db/airtable-migration/email_automations.sql` using three
  Supabase/Postgres pieces instead of a separate app or Edge Function:
  - **`pg_net`** — an async HTTP client inside Postgres, so a trigger or a
    scheduled job can call the Resend API directly.
  - **`pg_cron`** — runs the daily digest on a schedule (`0 8 * * *` UTC by
    default; adjust the cron expression if 8am is meant to be local time).
  - **Supabase Vault** — holds the Resend API key encrypted in the
    database; it's never written to this repo as plaintext.

  Both automations default to **test mode**: `revenue_os_crm.automation_settings`
  starts with `email_provider = 'test'` and all 3 recipient/from settings
  unset, so every trigger fire and every daily cron run executes for real
  and logs a row to `revenue_os_crm.email_events` — you can see exactly what
  would have been sent — but no real email goes out, matching this repo's
  "test/sandbox mode until explicitly authorized" rule. `email_automations.sql`
  has step-by-step instructions at the bottom for going live (store the
  Resend key in Vault, fill in `email_from`/the two recipient settings, flip
  `email_provider` to `'resend'`) whenever you're ready for real sends.

  Verified end-to-end against the live database: flipping a deal's stage
  fired `trg_deal_stage_alert` and logged a `deal_stage_alert` row; calling
  `revenue_os_crm.run_pipeline_digest()` logged a `pipeline_digest` row with
  the correct open-deal count; both correctly refused to "send" (status
  `failed`, with an explanatory error) when no recipient was configured,
  and correctly logged `sent_test` once a recipient was set. Settings were
  left back at their safe, unconfigured defaults afterward.

## Step 5: Loaded into the real database — done

The one open decision below ("same Supabase project vs. a separate
database") is resolved: it's the same project. `db/airtable-migration/schema.sql`
is applied as a migration to the **"Revenue OS" Supabase project**
(`wyaqpsnceqctufpmgmpr`) — confirmed as the right one by its existing
`public` tables (`Workspace`, `User`, `Membership`, `Lead`, `AgentRun`,
`Task`, `StageEvent`, `Subscription`) matching `revenue-os/app`'s Prisma
schema exactly. `revenue_os_crm` and `content_ops` are new schemas there,
additive alongside `public` — nothing about `revenue-os/app` changed.

Before touching the live database, the full schema + import path was run
end-to-end against a disposable local Postgres to validate it for real
(not just `py_compile`). That surfaced two real bugs in
`import_to_postgres.py`, both now fixed on `main` (PR #26):

1. Airtable omits an unchecked checkbox field entirely rather than sending
   `false`, which was crashing the import against the `NOT NULL DEFAULT
   false` boolean columns.
2. One Content Calendar row (`recbI4pGQJYcEcKDs`) is a completely blank
   Airtable record (empty title and all) — the importer now skips a
   record with no cell data instead of crashing.

Since Supabase's MCP tools don't expose a raw Postgres connection string
(by design), the actual load against the live project went through
Supabase's `execute_sql`/`apply_migration` tools rather than running
`import_to_postgres.py` directly: the same logic, reading the same JSON
exports, just emitting SQL text with subquery-based foreign-key resolution
instead of psycopg2. Verified after loading:

- All 9 tables' row counts match the original Airtable audit exactly.
- `activities` is 16, not 10 — confirming the new-contact → qualification
  trigger fired for real on each of the 6 inserted Contacts.
- All 5 join tables (`deal_products`, `order_products`, `content_products`,
  `content_deals`, `content_leads`) resolved to the expected counts.
- The `contacts_computed` / `deals_computed` rollup views match
  hand-calculated expectations.
- Both state-transition triggers (`fn_deal_won_creates_order`,
  `fn_product_live_distribution_task`) were exercised directly and fired
  correctly.
- All 9 Shorts and the 1 Performance row resolved their title-matched
  foreign keys.
- Ran Supabase's security advisor afterward (standard practice after a
  schema change) — it flagged a real gap in the 3 new trigger functions
  (mutable `search_path`), fixed with a follow-up migration. The only
  remaining advisory item is a pre-existing, unrelated Auth setting
  (leaked-password protection) that predates this work and wasn't touched.

The 2 email automations (executive stage-change alert, daily pipeline
digest) that Step 4 originally left as a design note are now built the
same way — see Step 4 above for how they work and how to turn on real
sending.
