-- Arthur OS: lock the auto-generated Supabase REST API out of every table.
--
-- APPLIED to the arthur-os Supabase project on 2026-09-30 as migration
-- `enable_rls_deny_anon_on_all_public_tables`. This file is the record of that
-- change so it can be re-applied to a rebuilt database, because `prisma db push`
-- does not manage row-level security and will not recreate it for you.
--
-- WHY. Supabase exposes a PostgREST API over the `public` schema to the `anon`
-- and `authenticated` roles. This app never uses supabase-js — it reaches
-- Postgres through Prisma — so that REST surface is pure attack surface. With
-- RLS off, anyone holding the project's anon key could read or rewrite every
-- row, including the append-only AuditEvent log that governance rule 7 exists
-- to protect.
--
-- WHY IT IS SAFE. Prisma connects as the `postgres` role, which has
-- rolbypassrls = true and therefore ignores RLS entirely. Enabling RLS with NO
-- policies denies anon and authenticated everything while leaving the
-- application completely unaffected. Verified at apply time: as `postgres` a
-- probe row was visible and writable; as `anon` the same row was invisible and
-- an insert was rejected with "new row violates row-level security policy".
--
-- THE ABSENCE OF POLICIES IS DELIBERATE. Supabase's linter reports
-- `rls_enabled_no_policy` (INFO) for all 16 tables. That is the intended end
-- state, not unfinished work: deny-all is the goal, since no legitimate caller
-- reaches these tables through PostgREST. Do not "fix" it by adding permissive
-- policies.
--
-- This implements the "apply row-level tenant isolation" line in the SECURITY
-- section of ../../CLAUDE.md.
--
-- Re-applying is safe: ENABLE ROW LEVEL SECURITY is idempotent.

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ApprovalPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Artifact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."QAReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RedTeamReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Delivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."EmailEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditEvent" ENABLE ROW LEVEL SECURITY;
