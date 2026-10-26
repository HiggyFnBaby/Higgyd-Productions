-- =========================================================================
-- Email automations for the Revenue OS CRM schema (revenue_os_crm).
--
-- These are the 2 of the 5 original Airtable automations that schema.sql
-- left as a design note because a plain Postgres trigger can't send email
-- on its own:
--   3. Deal stage changes -> email an executive alert
--   5. Daily 8am cron -> email a digest of open (not Won/Lost) deals
--
-- Built entirely inside Postgres/Supabase -- no separate app code or Edge
-- Function needed:
--   - pg_net gives Postgres an async outbound HTTP client, so a trigger or
--     a pg_cron job can call the Resend API directly.
--   - pg_cron runs the daily digest query on a schedule.
--   - Supabase Vault holds the Resend API key encrypted in the database
--     instead of as plaintext SQL (which this file, being committed to
--     git, must never contain).
--
-- SAFE BY DEFAULT: email_provider starts set to 'test' below, which means
-- every alert/digest just writes a row to revenue_os_crm.email_events
-- instead of calling Resend. Nothing sends real email until you
-- explicitly flip it to 'resend' and fill in the 3 settings marked
-- "REQUIRED FOR REAL SENDING" -- see the "Going live" section at the
-- bottom of this file. This matches the "test/sandbox mode until
-- explicitly authorized" rule in the repo's top-level CLAUDE.md.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---- Configuration -------------------------------------------------------
-- Non-secret settings (provider switch + recipients + From address). The
-- Resend API key itself goes in Supabase Vault instead (see bottom).
CREATE TABLE IF NOT EXISTS revenue_os_crm.automation_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO revenue_os_crm.automation_settings (key, value) VALUES
    ('email_provider', 'test'),               -- 'test' (log only) | 'resend' (really send)
    ('email_from', NULL),                      -- REQUIRED FOR REAL SENDING, e.g. 'alerts@yourdomain.com'
    ('deal_stage_alert_recipient', NULL),       -- REQUIRED FOR REAL SENDING
    ('pipeline_digest_recipient', NULL)         -- REQUIRED FOR REAL SENDING
ON CONFLICT (key) DO NOTHING;

-- ---- Audit log -------------------------------------------------------
-- Every alert/digest attempt lands here, test-mode or real, so you can see
-- what the automations would have sent (or did send) without digging
-- through pg_net's internal queue tables.
CREATE TABLE IF NOT EXISTS revenue_os_crm.email_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type  TEXT NOT NULL,                 -- 'deal_stage_alert' | 'pipeline_digest'
    to_email    TEXT,
    subject     TEXT NOT NULL,
    html        TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('sent_test', 'queued', 'failed')),
    provider    TEXT NOT NULL,
    error       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Shared sender -------------------------------------------------------
-- Mirrors the test/resend EmailProvider split already used in
-- arthur-os/app/src/lib/email/ -- same "test by default, real sending is
-- an explicit opt-in" shape, just implemented as SQL instead of
-- TypeScript since these callers are Postgres triggers/cron jobs, not
-- Next.js route handlers.
CREATE OR REPLACE FUNCTION revenue_os_crm.send_email(
    p_to         TEXT,
    p_subject    TEXT,
    p_html       TEXT,
    p_event_type TEXT
) RETURNS VOID AS $$
DECLARE
    v_provider TEXT;
    v_from     TEXT;
    v_api_key  TEXT;
BEGIN
    SELECT value INTO v_provider FROM revenue_os_crm.automation_settings WHERE key = 'email_provider';
    v_provider := COALESCE(v_provider, 'test');

    IF p_to IS NULL OR p_to = '' THEN
        INSERT INTO revenue_os_crm.email_events (event_type, to_email, subject, html, status, provider, error)
        VALUES (p_event_type, p_to, p_subject, p_html, 'failed', v_provider,
                'no recipient configured in revenue_os_crm.automation_settings');
        RETURN;
    END IF;

    IF v_provider = 'test' THEN
        INSERT INTO revenue_os_crm.email_events (event_type, to_email, subject, html, status, provider)
        VALUES (p_event_type, p_to, p_subject, p_html, 'sent_test', v_provider);
        RETURN;
    END IF;

    IF v_provider = 'resend' THEN
        SELECT value INTO v_from FROM revenue_os_crm.automation_settings WHERE key = 'email_from';
        SELECT decrypted_secret INTO v_api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';

        IF v_from IS NULL OR v_api_key IS NULL THEN
            INSERT INTO revenue_os_crm.email_events (event_type, to_email, subject, html, status, provider, error)
            VALUES (p_event_type, p_to, p_subject, p_html, 'failed', v_provider,
                    'email_from setting or resend_api_key vault secret is not configured');
            RETURN;
        END IF;

        -- pg_net is fire-and-forget: this queues the HTTP call and returns
        -- immediately, so a trigger never blocks waiting on Resend. Status
        -- is logged as 'queued' rather than 'sent' for that reason -- check
        -- Resend's own dashboard/logs to confirm delivery.
        PERFORM net.http_post(
            url     := 'https://api.resend.com/emails',
            headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
            body    := jsonb_build_object('from', v_from, 'to', p_to, 'subject', p_subject, 'html', p_html)
        );

        INSERT INTO revenue_os_crm.email_events (event_type, to_email, subject, html, status, provider)
        VALUES (p_event_type, p_to, p_subject, p_html, 'queued', v_provider);
        RETURN;
    END IF;

    INSERT INTO revenue_os_crm.email_events (event_type, to_email, subject, html, status, provider, error)
    VALUES (p_event_type, p_to, p_subject, p_html, 'failed', v_provider,
            format('unknown email_provider %L (only ''test'' and ''resend'' are implemented)', v_provider));
END;
$$ LANGUAGE plpgsql
SET search_path = revenue_os_crm, vault, net, pg_catalog;

-- ---- Automation 3: Deal stage change -> executive alert -------------------
CREATE OR REPLACE FUNCTION revenue_os_crm.fn_deal_stage_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient    TEXT;
    v_contact_name TEXT;
BEGIN
    SELECT value INTO v_recipient FROM revenue_os_crm.automation_settings WHERE key = 'deal_stage_alert_recipient';
    SELECT name INTO v_contact_name FROM revenue_os_crm.contacts WHERE id = NEW.contact_id;

    PERFORM revenue_os_crm.send_email(
        v_recipient,
        format('Deal stage changed: %s (%s -> %s)', NEW.deal_name, OLD.stage, NEW.stage),
        format(
            '<p><strong>%s</strong> moved from <strong>%s</strong> to <strong>%s</strong>.</p>' ||
            '<p>Contact: %s<br>Amount: $%s<br>Expected close: %s</p>',
            NEW.deal_name, OLD.stage, NEW.stage,
            COALESCE(v_contact_name, 'n/a'),
            to_char(NEW.amount, 'FM999,999,999.00'),
            COALESCE(to_char(NEW.expected_close, 'YYYY-MM-DD'), 'n/a')
        ),
        'deal_stage_alert'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = revenue_os_crm, vault, net, pg_catalog;

DROP TRIGGER IF EXISTS trg_deal_stage_alert ON revenue_os_crm.deals;
CREATE TRIGGER trg_deal_stage_alert
    AFTER UPDATE ON revenue_os_crm.deals
    FOR EACH ROW
    WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
    EXECUTE FUNCTION revenue_os_crm.fn_deal_stage_alert();

-- ---- Automation 5: Daily open-pipeline digest -----------------------------
CREATE OR REPLACE FUNCTION revenue_os_crm.run_pipeline_digest()
RETURNS VOID AS $$
DECLARE
    v_recipient TEXT;
    v_rows_html TEXT;
    v_count     INT;
BEGIN
    SELECT value INTO v_recipient FROM revenue_os_crm.automation_settings WHERE key = 'pipeline_digest_recipient';

    SELECT
        count(*),
        COALESCE(string_agg(
            format(
                '<tr><td>%s</td><td>%s</td><td>$%s</td><td>%s</td></tr>',
                deal_name, stage, to_char(amount, 'FM999,999,999.00'),
                COALESCE(to_char(expected_close, 'YYYY-MM-DD'), '-')
            ),
            ''
        ), '')
    INTO v_count, v_rows_html
    FROM revenue_os_crm.open_pipeline_digest;

    PERFORM revenue_os_crm.send_email(
        v_recipient,
        format('Daily pipeline digest: %s open deal(s)', v_count),
        format(
            '<h2>%s open deal(s)</h2>' ||
            '<table border="1" cellpadding="6" cellspacing="0">' ||
            '<tr><th>Deal</th><th>Stage</th><th>Amount</th><th>Expected close</th></tr>%s</table>',
            v_count, v_rows_html
        ),
        'pipeline_digest'
    );
END;
$$ LANGUAGE plpgsql
SET search_path = revenue_os_crm, vault, net, pg_catalog;

-- Runs daily at 08:00 UTC. pg_cron has no timezone setting -- if 8am is
-- meant to be local time, adjust the cron expression below (e.g. 8am
-- Eastern during EST is '0 13 * * *' UTC) and re-run this one line.
SELECT cron.schedule(
    'revenue-os-pipeline-digest',
    '0 8 * * *',
    $$SELECT revenue_os_crm.run_pipeline_digest();$$
);

-- =========================================================================
-- Going live (nothing here runs automatically -- do this when you're ready
-- for real email instead of the email_events test log):
--
-- 1. Store your Resend API key in Vault (never as plaintext in a migration
--    or anywhere else in this repo):
--      SELECT vault.create_secret('re_xxx...', 'resend_api_key');
--
-- 2. Fill in the real settings:
--      UPDATE revenue_os_crm.automation_settings SET value = 'you@yourdomain.com'
--        WHERE key = 'email_from';
--      UPDATE revenue_os_crm.automation_settings SET value = 'derrick@...'
--        WHERE key = 'deal_stage_alert_recipient';
--      UPDATE revenue_os_crm.automation_settings SET value = 'derrick@...'
--        WHERE key = 'pipeline_digest_recipient';
--
-- 3. Flip the switch:
--      UPDATE revenue_os_crm.automation_settings SET value = 'resend'
--        WHERE key = 'email_provider';
--
-- Until step 3, every trigger fire and every daily cron run still executes
-- for real -- they just log to revenue_os_crm.email_events with
-- status = 'sent_test' instead of calling Resend.
-- =========================================================================
