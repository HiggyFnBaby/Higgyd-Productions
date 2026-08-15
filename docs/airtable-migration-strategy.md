# Airtable Trial Migration Strategy

Audited both Airtable bases in this workspace and built the Postgres migration
target for them ahead of the Team-plan trial expiring. Everything below is
already in the repo — this doc is the map of what exists and what's still an
open call.

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

## Step 4: Automations → rebuilt

Of the 5 drafted (never-deployed) Airtable automations:

- **3 are pure DB logic** and are already live as Postgres triggers in
  `schema.sql`: new-contact → qualification Activity, Deal→Won → auto-create
  Order (+ carries over the deal's linked products), Product→Live → CMO
  distribution Activity.
- **2 send email** (executive stage-change alert, daily pipeline digest),
  which a plain Postgres trigger can't do on its own. I left these as a
  design note in `schema.sql` rather than half-implementing them: the digest
  query itself is there as `revenue_os_crm.open_pipeline_digest`, ready for
  either a Supabase Edge Function on a `pg_notify` channel or a small
  scheduled script to email its results — whichever matches how you end up
  running the rest of the backend.

## What's actually still an open decision

Given the trial's expiring days, not weeks, out, and the CSV/JSON backups
already exist regardless of what happens next — there's no urgency risk left
on data loss. The one real remaining choice is whether the `revenue_os_crm` /
`content_ops` schemas above should live in the **same Supabase/Postgres
project** `revenue-os/app` already uses, or a **separate database** — same
project is simpler to operate (one connection string, one place to look) and
is what the schema names (as Postgres schemas, not top-level DBs) are built
for, but a separate database keeps the CRM data fully isolated from the
`revenue-os/app` tenant data if that matters to you.
