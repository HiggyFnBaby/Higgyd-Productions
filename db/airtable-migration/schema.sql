-- Postgres schema for the two audited Airtable bases:
--   1. Revenue OS CRM   (Contacts, Deals, Products, Orders, Activities, Content)
--   2. Content OPS      (Content Calendar, Performance, Shorts)
--
-- This supersedes db/workspace_schema.sql as the migration target for these
-- two bases -- that file was a generic contacts/projects/tasks placeholder
-- written before the actual Airtable schema was audited, and doesn't have a
-- Products/Orders/Content layer at all. See ../../docs/airtable-migration-strategy.md
-- for the full audit this schema is derived from.
--
-- Design choices carried over from Airtable, deliberately:
--  - Airtable record IDs are kept (airtable_record_id) so the CSV/JSON
--    exports in exports/ can be re-imported idempotently and cross-referenced
--    if a discrepancy ever needs to be traced back to the original base.
--  - Rollup and formula fields (Lifetime Value, Weighted Value, Days in
--    Pipeline, Units Sold, Revenue Generated, Influenced Revenue) are NOT
--    stored columns -- Airtable recomputes those live, and storing them as
--    plain columns would let them drift out of sync. They're recreated below
--    as SQL views so they stay derived, the same way Airtable treats them.
--  - Airtable's linked-record fields are bidirectional many-to-many under
--    the hood even where the data is really one-to-many (e.g. one Deal has
--    one Contact); join tables are only used where records showed genuine
--    many-to-many use (Orders<->Products, Content<->Products, Content<->Deals,
--    Content<->Contacts).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS revenue_os_crm;
CREATE SCHEMA IF NOT EXISTS content_ops;

-- =========================================================================
-- revenue_os_crm: mirrors the "Revenue OS CRM" Airtable base (apphhT2YHy5AupUeB)
-- =========================================================================

CREATE TABLE revenue_os_crm.contacts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    name                TEXT NOT NULL,
    email               TEXT,
    phone               TEXT,
    company             TEXT,
    contact_type        TEXT, -- Lead | Prospect | MQL | SQL | Customer | Evangelist | Partner
    lifecycle_stage     TEXT,
    lead_source         TEXT,
    owner_agent         TEXT, -- which Revenue OS agent owns this contact
    notes               TEXT,
    date_added          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_os_crm.products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    product_name        TEXT NOT NULL,
    category            TEXT,
    production_stage    TEXT, -- Minting | In Production | Live | Sold Out
    price               NUMERIC(12, 2),
    tier                TEXT,
    produced_by_agent   TEXT,
    tools_used          TEXT[], -- multi-select, e.g. {Claude, Canva, HeyGen}
    trend_score         INTEGER,
    marketplace_url     TEXT,
    download_link       TEXT,
    created             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_os_crm.deals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    deal_name           TEXT NOT NULL,
    stage               TEXT NOT NULL DEFAULT 'New Lead', -- New Lead | Qualified | Proposal Sent | Negotiation | Won | Lost
    amount              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    probability         NUMERIC(4, 3) NOT NULL DEFAULT 0, -- 0.0-1.0, matches Airtable percent field
    expected_close      DATE,
    deal_type           TEXT,
    priority            TEXT,
    owner_agent         TEXT,
    notes               TEXT,
    created             TIMESTAMPTZ,
    contact_id          UUID REFERENCES revenue_os_crm.contacts(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_os_crm.deal_products (
    deal_id             UUID NOT NULL REFERENCES revenue_os_crm.deals(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES revenue_os_crm.products(id) ON DELETE CASCADE,
    PRIMARY KEY (deal_id, product_id)
);

CREATE TABLE revenue_os_crm.orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    order_number        TEXT NOT NULL, -- e.g. "ORD-1001"
    order_date          TIMESTAMPTZ,
    amount              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status      TEXT, -- Pending | Paid
    fulfillment         TEXT, -- Awaiting | Delivered
    channel             TEXT,
    notes               TEXT,
    customer_id         UUID REFERENCES revenue_os_crm.contacts(id) ON DELETE SET NULL,
    deal_id             UUID REFERENCES revenue_os_crm.deals(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_os_crm.order_products (
    order_id            UUID NOT NULL REFERENCES revenue_os_crm.orders(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES revenue_os_crm.products(id) ON DELETE CASCADE,
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE revenue_os_crm.activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    activity             TEXT NOT NULL,
    type                TEXT, -- Follow-up | Meeting | Email | Agent Action | Content Drop
    status              TEXT NOT NULL DEFAULT 'To Do', -- To Do | In Progress | Done
    due_date            DATE,
    agent               TEXT,
    notes               TEXT,
    contact_id          UUID REFERENCES revenue_os_crm.contacts(id) ON DELETE CASCADE,
    deal_id             UUID REFERENCES revenue_os_crm.deals(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_os_crm.content (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    video_title         TEXT NOT NULL,
    lane                TEXT, -- Discovery | Authority | Conversion
    content_stage       TEXT, -- Idea | Scripting | Published
    publish_date        DATE,
    hook_angle          TEXT,
    platforms           TEXT[], -- multi-select, e.g. {YouTube, TikTok, IG Reels}
    impressions         INTEGER,
    views                INTEGER,
    ctr                 NUMERIC(6, 4),
    first_30s_retention NUMERIC(6, 4),
    on_track            TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_os_crm.content_products (
    content_id          UUID NOT NULL REFERENCES revenue_os_crm.content(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES revenue_os_crm.products(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, product_id)
);

CREATE TABLE revenue_os_crm.content_deals (
    content_id          UUID NOT NULL REFERENCES revenue_os_crm.content(id) ON DELETE CASCADE,
    deal_id              UUID NOT NULL REFERENCES revenue_os_crm.deals(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, deal_id)
);

CREATE TABLE revenue_os_crm.content_leads (
    content_id          UUID NOT NULL REFERENCES revenue_os_crm.content(id) ON DELETE CASCADE,
    contact_id          UUID NOT NULL REFERENCES revenue_os_crm.contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, contact_id)
);

CREATE INDEX idx_deals_contact_id ON revenue_os_crm.deals(contact_id);
CREATE INDEX idx_deals_stage ON revenue_os_crm.deals(stage);
CREATE INDEX idx_orders_customer_id ON revenue_os_crm.orders(customer_id);
CREATE INDEX idx_activities_contact_id ON revenue_os_crm.activities(contact_id);
CREATE INDEX idx_activities_deal_id ON revenue_os_crm.activities(deal_id);

-- ---- Recomputed rollup/formula fields (kept live, not stored) ----------

-- Airtable "Weighted Value" = Amount x Probability
-- Airtable "Days in Pipeline" = today - Created
CREATE VIEW revenue_os_crm.deals_computed AS
SELECT
    d.*,
    (d.amount * d.probability)::NUMERIC(12, 2) AS weighted_value,
    EXTRACT(DAY FROM now() - d.created)::INTEGER AS days_in_pipeline
FROM revenue_os_crm.deals d;

-- Airtable "Lifetime Value" = sum of paid Orders for this contact
-- Airtable "Open Pipeline Value" = sum of open (not Won/Lost) Deal amounts for this contact
CREATE VIEW revenue_os_crm.contacts_computed AS
SELECT
    c.*,
    COALESCE(paid.total, 0)::NUMERIC(12, 2) AS lifetime_value,
    COALESCE(open_deals.total, 0)::NUMERIC(12, 2) AS open_pipeline_value
FROM revenue_os_crm.contacts c
LEFT JOIN (
    SELECT customer_id, SUM(amount) AS total
    FROM revenue_os_crm.orders
    WHERE payment_status = 'Paid'
    GROUP BY customer_id
) paid ON paid.customer_id = c.id
LEFT JOIN (
    SELECT contact_id, SUM(amount) AS total
    FROM revenue_os_crm.deals
    WHERE stage NOT IN ('Won', 'Lost')
    GROUP BY contact_id
) open_deals ON open_deals.contact_id = c.id;

-- Airtable "Units Sold" = count of Orders for this product
-- Airtable "Revenue Generated" = sum of paid Order amounts for this product
CREATE VIEW revenue_os_crm.products_computed AS
SELECT
    p.*,
    COALESCE(sold.units, 0) AS units_sold,
    COALESCE(revenue.total, 0)::NUMERIC(12, 2) AS revenue_generated
FROM revenue_os_crm.products p
LEFT JOIN (
    SELECT op.product_id, COUNT(*) AS units
    FROM revenue_os_crm.order_products op
    GROUP BY op.product_id
) sold ON sold.product_id = p.id
LEFT JOIN (
    SELECT op.product_id, SUM(o.amount) AS total
    FROM revenue_os_crm.order_products op
    JOIN revenue_os_crm.orders o ON o.id = op.order_id AND o.payment_status = 'Paid'
    GROUP BY op.product_id
) revenue ON revenue.product_id = p.id;

-- Airtable "Influenced Revenue" = sum of amounts of Deals attributed to this video
CREATE VIEW revenue_os_crm.content_computed AS
SELECT
    ct.*,
    COALESCE(influenced.total, 0)::NUMERIC(12, 2) AS influenced_revenue
FROM revenue_os_crm.content ct
LEFT JOIN (
    SELECT cd.content_id, SUM(d.amount) AS total
    FROM revenue_os_crm.content_deals cd
    JOIN revenue_os_crm.deals d ON d.id = cd.deal_id
    GROUP BY cd.content_id
) influenced ON influenced.content_id = ct.id;

-- ---- Automations, rebuilt as triggers (all 5 were "undeployed" drafts in --
-- ---- Airtable -- nothing is live today, so nothing breaks by not having --
-- ---- these until you actually want them running; see the strategy doc) --

-- "1 - New Lead Intake -> Qualification Task": new Contact -> open Activity
CREATE OR REPLACE FUNCTION revenue_os_crm.fn_new_contact_qualification_task()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO revenue_os_crm.activities (activity, type, status, agent, contact_id)
    VALUES ('Qualify new contact: ' || NEW.name, 'Follow-up', 'To Do', NEW.owner_agent, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_new_contact_qualification_task
    AFTER INSERT ON revenue_os_crm.contacts
    FOR EACH ROW EXECUTE FUNCTION revenue_os_crm.fn_new_contact_qualification_task();

-- "2 - Deal Won -> Auto-Create Order": Deal.stage -> 'Won' -> new Order
CREATE OR REPLACE FUNCTION revenue_os_crm.fn_deal_won_creates_order()
RETURNS TRIGGER AS $$
DECLARE
    new_order_id UUID;
BEGIN
    IF NEW.stage = 'Won' AND (OLD.stage IS DISTINCT FROM 'Won') THEN
        INSERT INTO revenue_os_crm.orders (order_number, order_date, amount, payment_status, fulfillment, customer_id, deal_id)
        VALUES ('ORD-' || to_char(now(), 'YYYYMMDDHH24MISS'), now(), NEW.amount, 'Pending', 'Awaiting', NEW.contact_id, NEW.id)
        RETURNING id INTO new_order_id;

        INSERT INTO revenue_os_crm.order_products (order_id, product_id)
        SELECT new_order_id, dp.product_id
        FROM revenue_os_crm.deal_products dp
        WHERE dp.deal_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_won_creates_order
    AFTER UPDATE ON revenue_os_crm.deals
    FOR EACH ROW EXECUTE FUNCTION revenue_os_crm.fn_deal_won_creates_order();

-- "4 - Product Live -> Multi-Channel Distribution Task": Product goes Live -> CMO task
CREATE OR REPLACE FUNCTION revenue_os_crm.fn_product_live_distribution_task()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.production_stage = 'Live' AND (OLD.production_stage IS DISTINCT FROM 'Live') THEN
        INSERT INTO revenue_os_crm.activities (activity, type, status, agent)
        VALUES ('Schedule multi-channel drop: ' || NEW.product_name, 'Content Drop', 'To Do', 'CMO Agent');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_live_distribution_task
    AFTER UPDATE ON revenue_os_crm.products
    FOR EACH ROW EXECUTE FUNCTION revenue_os_crm.fn_product_live_distribution_task();

-- "3 - Deal Stage Change -> Executive Email Alert" and
-- "5 - Daily Open-Pipeline Digest" both send email, which a Postgres trigger
-- can't do on its own. Left as application/cron-layer jobs -- see the
-- strategy doc's automations section for the recommended equivalents
-- (a Supabase Edge Function on a `deal_stage_changes` NOTIFY channel, and a
-- pg_cron / scheduled script hitting the same digest query as
-- content_ops.open_pipeline_digest below).

CREATE VIEW revenue_os_crm.open_pipeline_digest AS
SELECT id, deal_name, stage, amount, owner_agent, expected_close
FROM revenue_os_crm.deals
WHERE stage NOT IN ('Won', 'Lost')
ORDER BY expected_close ASC NULLS LAST;

-- =========================================================================
-- content_ops: mirrors the "TheRealKingOfAI — Content OPS" base (apprfcwDHq7ElBQ3S)
-- =========================================================================

CREATE TABLE content_ops.content_calendar (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    working_title       TEXT NOT NULL,
    publish_date        DATE,
    lane                TEXT, -- Discovery | Authority | Conversion
    hook_angle          TEXT,
    status              TEXT, -- Scripting | ... | Published
    thumbnail_done      BOOLEAN NOT NULL DEFAULT false,
    script_done         BOOLEAN NOT NULL DEFAULT false,
    shorts_done         BOOLEAN NOT NULL DEFAULT false,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE content_ops.performance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    title               TEXT NOT NULL,
    publish_date        DATE,
    impressions         INTEGER,
    ctr                 NUMERIC(6, 4),
    views               INTEGER,
    avg_view_duration   NUMERIC(6, 4),
    first_30s_retention NUMERIC(6, 4),
    on_track            TEXT,
    content_calendar_id UUID REFERENCES content_ops.content_calendar(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTE (data quality, carried over from the audit): Shorts."Parent Video" is
-- a plain text field in Airtable, not a real linked-record field -- it just
-- happens to hold a Content Calendar working_title. parent_video_id below is
-- populated by the importer via a title match where possible, but treat it
-- as best-effort, not a guaranteed foreign key the way the others are.
CREATE TABLE content_ops.shorts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airtable_record_id  TEXT UNIQUE,
    short_title         TEXT NOT NULL,
    parent_video_title  TEXT, -- raw text as stored in Airtable
    parent_video_id     UUID REFERENCES content_ops.content_calendar(id) ON DELETE SET NULL,
    angle               TEXT,
    status              TEXT,
    youtube             BOOLEAN NOT NULL DEFAULT false,
    tiktok              BOOLEAN NOT NULL DEFAULT false,
    ig_reels            BOOLEAN NOT NULL DEFAULT false,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_content_calendar_id ON content_ops.performance(content_calendar_id);
CREATE INDEX idx_shorts_parent_video_id ON content_ops.shorts(parent_video_id);
