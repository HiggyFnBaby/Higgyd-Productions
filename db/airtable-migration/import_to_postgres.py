#!/usr/bin/env python3
"""
Load the raw Airtable exports in exports/raw/**/*.json into the Postgres
schema defined in schema.sql.

Two-pass import so linked-record fields (which reference other Airtable
records by ID) resolve correctly regardless of insert order:
  1. Insert every row's scalar fields, keyed by airtable_record_id.
  2. Resolve every link field (single-link -> FK column update,
     multi-link -> join-table insert) using the airtable_record_id -> UUID
     map built in pass 1.

Requires: psycopg2-binary (pip install psycopg2-binary)
Usage:
    export DATABASE_URL=postgresql://user:pass@host:5432/dbname
    psql "$DATABASE_URL" -f schema.sql   # create tables first, once
    python3 import_to_postgres.py
"""
import json
import os
from pathlib import Path

import psycopg2
import psycopg2.extras

from field_maps import REVENUE_OS_CRM_TABLES, CONTENT_OPS_TABLES

ROOT = Path(__file__).parent
RAW = ROOT / "exports" / "raw"

FILENAMES = {
    "Contacts": "contacts",
    "Deals": "deals",
    "Products": "products",
    "Orders": "orders",
    "Activities": "activities",
    "Content": "content",
    "Content Calendar": "content-calendar",
    "Performance": "performance",
    "Shorts": "shorts",
}

# table name -> (pg schema, pg table, base export subdir)
PG_TARGET = {
    "Contacts": ("revenue_os_crm", "contacts", "revenue-os-crm"),
    "Deals": ("revenue_os_crm", "deals", "revenue-os-crm"),
    "Products": ("revenue_os_crm", "products", "revenue-os-crm"),
    "Orders": ("revenue_os_crm", "orders", "revenue-os-crm"),
    "Activities": ("revenue_os_crm", "activities", "revenue-os-crm"),
    "Content": ("revenue_os_crm", "content", "revenue-os-crm"),
    "Content Calendar": ("content_ops", "content_calendar", "content-ops"),
    "Performance": ("content_ops", "performance", "content-ops"),
    "Shorts": ("content_ops", "shorts", "content-ops"),
}

# single-link field (as named in field_maps) -> FK column it resolves to,
# per table. Multi-link fields not listed here go through a join table
# in populate_join_tables() instead.
SINGLE_LINK_FK = {
    "Deals": {"_link_contact": "contact_id"},
    "Orders": {"_link_customer": "customer_id", "_link_deal": "deal_id"},
    "Activities": {"_link_contact": "contact_id", "_link_deal": "deal_id"},
}

# (table, multi-link field) -> (join table, this-table fk column, other fk column, other airtable table)
JOIN_TABLES = [
    ("Deals", "_link_products", "revenue_os_crm.deal_products", "deal_id", "product_id", "Products"),
    ("Orders", "_link_products", "revenue_os_crm.order_products", "order_id", "product_id", "Products"),
    ("Content", "_link_promotes_products", "revenue_os_crm.content_products", "content_id", "product_id", "Products"),
    ("Content", "_link_attributed_deals", "revenue_os_crm.content_deals", "content_id", "deal_id", "Deals"),
    ("Content", "_link_leads_generated", "revenue_os_crm.content_leads", "content_id", "contact_id", "Contacts"),
]


def load_raw(table_name):
    subdir = PG_TARGET[table_name][2]
    path = RAW / subdir / f"{FILENAMES[table_name]}.json"
    return json.loads(path.read_text())["records"]


def scalar_value(cell, kind):
    if cell is None:
        return None
    if kind == "select":
        return cell.get("name") if isinstance(cell, dict) else cell
    if kind == "multiselect":
        if not isinstance(cell, list):
            return None
        return [v.get("name") if isinstance(v, dict) else v for v in cell]
    if kind == "link" or kind == "computed":
        return None  # handled separately (links) or recomputed as a view (computed)
    return cell


def insert_scalars(cur, table_name, field_map):
    schema, table, _ = PG_TARGET[table_name]
    records = load_raw(table_name)
    id_map = {}  # airtable_record_id -> new UUID

    scalar_cols = [col for col, kind in field_map.values() if kind not in ("link", "computed")]
    placeholders = ", ".join(["%s"] * (len(scalar_cols) + 1))
    col_list = ", ".join(["airtable_record_id"] + scalar_cols)
    sql = (
        f"INSERT INTO {schema}.{table} ({col_list}) VALUES ({placeholders}) "
        f"ON CONFLICT (airtable_record_id) DO UPDATE SET "
        + ", ".join(f"{c} = EXCLUDED.{c}" for c in scalar_cols)
        + " RETURNING id, airtable_record_id"
    )

    for record in records:
        cells = record.get("cellValuesByFieldId", {})
        values = [record["id"]]
        for field_id, (col, kind) in field_map.items():
            if kind in ("link", "computed"):
                continue
            values.append(scalar_value(cells.get(field_id), kind))
        cur.execute(sql, values)
        row = cur.fetchone()
        id_map[row[1]] = row[0]

    return id_map


def resolve_single_links(cur, table_name, field_map, id_maps):
    if table_name not in SINGLE_LINK_FK:
        return
    schema, table, _ = PG_TARGET[table_name]
    field_id_by_col = {v[0]: k for k, v in field_map.items()}
    records = load_raw(table_name)

    for link_col, fk_col in SINGLE_LINK_FK[table_name].items():
        field_id = field_id_by_col[link_col]
        for record in records:
            cells = record.get("cellValuesByFieldId", {})
            links = cells.get(field_id) or []
            if not links:
                continue
            target_airtable_id = links[0]["id"]
            # search all id_maps since we don't track per-field target table here
            target_uuid = next((m[target_airtable_id] for m in id_maps.values() if target_airtable_id in m), None)
            if target_uuid is None:
                continue
            cur.execute(
                f"UPDATE {schema}.{table} SET {fk_col} = %s WHERE airtable_record_id = %s",
                (target_uuid, record["id"]),
            )


def populate_join_tables(cur, id_maps, field_maps_by_table):
    for table_name, link_field, join_table, this_col, other_col, other_table in JOIN_TABLES:
        field_map = field_maps_by_table[table_name]
        field_id_by_col = {v[0]: k for k, v in field_map.items()}
        field_id = field_id_by_col[link_field]
        records = load_raw(table_name)
        this_id_map = id_maps[table_name]
        other_id_map = id_maps[other_table]

        for record in records:
            this_uuid = this_id_map.get(record["id"])
            if this_uuid is None:
                continue
            cells = record.get("cellValuesByFieldId", {})
            for linked in cells.get(field_id) or []:
                other_uuid = other_id_map.get(linked["id"])
                if other_uuid is None:
                    continue
                cur.execute(
                    f"INSERT INTO {join_table} ({this_col}, {other_col}) VALUES (%s, %s) "
                    f"ON CONFLICT DO NOTHING",
                    (this_uuid, other_uuid),
                )


def resolve_shorts_parent_video(cur):
    """Best-effort match on Shorts.parent_video_title -> Content Calendar.working_title
    (see the data-quality note in schema.sql -- this is a free-text field in
    Airtable, not a real link, so this is a title match, not a guaranteed FK)."""
    cur.execute(
        """
        UPDATE content_ops.shorts s
        SET parent_video_id = cc.id
        FROM content_ops.content_calendar cc
        WHERE s.parent_video_title = cc.working_title
        """
    )


def main():
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("Set DATABASE_URL first, e.g. postgresql://user:pass@host:5432/dbname")

    field_maps_by_table = {**REVENUE_OS_CRM_TABLES, **CONTENT_OPS_TABLES}
    field_maps_by_table = {k: v["fields"] for k, v in field_maps_by_table.items()}

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            id_maps = {}
            # Pass 1: scalars, in an order where nothing links to something
            # not yet inserted matters less since FKs are resolved in pass 2.
            for table_name in ["Contacts", "Products", "Deals", "Orders", "Activities", "Content", "Content Calendar", "Performance", "Shorts"]:
                id_maps[table_name] = insert_scalars(cur, table_name, field_maps_by_table[table_name])
                print(f"inserted {len(id_maps[table_name])} rows into {PG_TARGET[table_name][0]}.{PG_TARGET[table_name][1]}")

            # Pass 2: single-link FK columns
            for table_name in ["Deals", "Orders", "Activities"]:
                resolve_single_links(cur, table_name, field_maps_by_table[table_name], id_maps)

            # Pass 3: multi-link join tables
            populate_join_tables(cur, id_maps, field_maps_by_table)

            # Pass 4: Performance -> Content Calendar (title match, same idea
            # as Shorts below -- Performance has no Airtable link field for
            # this either, both tables just repeat the video title as text)
            cur.execute(
                """
                UPDATE content_ops.performance p
                SET content_calendar_id = cc.id
                FROM content_ops.content_calendar cc
                WHERE p.title = cc.working_title
                """
            )
            resolve_shorts_parent_video(cur)

        conn.commit()
        print("Import complete.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
