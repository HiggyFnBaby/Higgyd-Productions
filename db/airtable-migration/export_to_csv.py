#!/usr/bin/env python3
"""
Turn the raw Airtable exports in exports/raw/**/*.json into human-readable
CSVs in exports/csv/**/*.csv -- the "static safety backup" called for before
the Team-plan trial expires.

Linked-record fields are flattened to semicolon-separated display names
(matching Airtable's own CSV-export behavior). The raw JSON keeps the actual
record IDs for referential integrity; that's what import_to_postgres.py
reads, not these CSVs.

Usage: python3 export_to_csv.py
"""
import csv
import json
from pathlib import Path

from field_maps import REVENUE_OS_CRM_TABLES, CONTENT_OPS_TABLES

ROOT = Path(__file__).parent
RAW = ROOT / "exports" / "raw"
OUT = ROOT / "exports" / "csv"

BASES = {
    "revenue-os-crm": REVENUE_OS_CRM_TABLES,
    "content-ops": CONTENT_OPS_TABLES,
}

# table name -> raw JSON filename (slugified separately since a couple of
# table names don't slugify the same way as their file names)
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


def flatten(value, kind):
    if value is None:
        return ""
    if kind == "select":
        return value.get("name", "") if isinstance(value, dict) else value
    if kind == "multiselect" or kind == "link":
        if not isinstance(value, list):
            return value
        return "; ".join(v.get("name", "") if isinstance(v, dict) else str(v) for v in value)
    return value


def main():
    for base_dir, tables in BASES.items():
        (OUT / base_dir).mkdir(parents=True, exist_ok=True)
        for table_name, table_def in tables.items():
            slug = FILENAMES[table_name]
            raw_path = RAW / base_dir / f"{slug}.json"
            data = json.loads(raw_path.read_text())

            field_map = table_def["fields"]
            columns = ["airtable_record_id", "created_time"] + [
                col for col, _kind in field_map.values()
            ]

            out_path = OUT / base_dir / f"{slug}.csv"
            with out_path.open("w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=columns)
                writer.writeheader()
                for record in data["records"]:
                    row = {
                        "airtable_record_id": record["id"],
                        "created_time": record.get("createdTime", ""),
                    }
                    cells = record.get("cellValuesByFieldId", {})
                    for field_id, (col, kind) in field_map.items():
                        row[col] = flatten(cells.get(field_id), kind)
                    writer.writerow(row)

            print(f"wrote {out_path.relative_to(ROOT)} ({len(data['records'])} rows)")


if __name__ == "__main__":
    main()
