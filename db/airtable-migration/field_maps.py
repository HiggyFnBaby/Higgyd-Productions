"""
Field-ID -> human-readable-name maps for the two audited Airtable bases,
captured 2026-08-14 while the Team-plan trial was still active (see
../../docs/airtable-migration-strategy.md for the full audit).

Airtable's REST API keys record data by field ID, not field name, so this
module is the single source of truth both scripts in this folder
(export_to_csv.py and import_to_postgres.py) use to turn `fld...` keys into
the column names in schema.sql.
"""

REVENUE_OS_CRM_BASE_ID = "apphhT2YHy5AupUeB"
CONTENT_OPS_BASE_ID = "apprfcwDHq7ElBQ3S"

# Each table: field_id -> (column_name, kind)
# kind is one of: "text", "number", "bool", "date", "datetime", "select",
# "multiselect", "link" (one or more linked record IDs), "computed" (rollup
# or formula field -- not imported, recomputed in Postgres as a view instead).
REVENUE_OS_CRM_TABLES = {
    "Contacts": {
        "id": "tblOYDWNuSJvme7zl",
        "fields": {
            "fldAco26lV9SODlF5": ("name", "text"),
            "fldQ3A0FADmVJ2S6F": ("email", "text"),
            "fldTD9ZZZrDijQ8Dm": ("phone", "text"),
            "flduqS2zMHIyLyh2d": ("company", "text"),
            "fldJ4dTDtauv54qxn": ("contact_type", "select"),
            "fldfIqJN7vrtQENa2": ("lifecycle_stage", "select"),
            "fldMpmZqVuRqV3Oa1": ("lead_source", "select"),
            "fldvXp1U5Fd8Pcpln": ("owner_agent", "select"),
            "fldmiYzwa6zF2f5JI": ("notes", "text"),
            "fld9dUPfdhLMm0gKb": ("date_added", "datetime"),
            "fld538paA0V8VVRrM": ("_link_deals", "link"),
            "fldWa72cKLGQlDFTY": ("_link_orders", "link"),
            "fldOG43iclGlF2h9p": ("_link_activities", "link"),
            "flddBQMwyEBG6bOT8": ("_link_content", "link"),
            "fldFIdhnWsVeKLQ8t": ("lifetime_value", "computed"),
            "fldTm6jprT2gYmZRM": ("open_pipeline_value", "computed"),
        },
    },
    "Deals": {
        "id": "tblGsnvfeTnTYa0JQ",
        "fields": {
            "fldcIOtfH7qOF8Pqh": ("deal_name", "text"),
            "fldxXob3dylNxdkMW": ("stage", "select"),
            "fldTTpaKK6bL2orQq": ("amount", "number"),
            "fld4FdYEAMH6ezpOy": ("probability", "number"),
            "fldjmhXUh37G9b8uW": ("expected_close", "date"),
            "fldioymbf3sFgJ3Wx": ("deal_type", "select"),
            "fldx2roiOJNenD691": ("priority", "select"),
            "fldyz8CEf5VdJ327j": ("owner_agent", "select"),
            "fldNnBwa5tPDuEL4Y": ("notes", "text"),
            "fldxJ1xi2OtYYvWMF": ("created", "datetime"),
            "fldWSpILTACxK33z2": ("_link_contact", "link"),
            "flde9fracUHSpAcV4": ("_link_products", "link"),
            "fldLv1HABITPwvwF1": ("_link_orders", "link"),
            "fld9gnYh8MKY7GnfH": ("_link_activities", "link"),
            "fldb8mwSDBFp0O4m8": ("_link_content", "link"),
            "fldleEALvTzLXGdsc": ("weighted_value", "computed"),
            "fldR42TiBnnTUia7R": ("days_in_pipeline", "computed"),
        },
    },
    "Products": {
        "id": "tblJgIKlteKxE6CDP",
        "fields": {
            "fldJjL5Qcw4fQ0QSv": ("product_name", "text"),
            "fld5ykiYMO3Ujq4bA": ("category", "select"),
            "fldOjbnAEkmcsmwgQ": ("production_stage", "select"),
            "fld4nfB79uuLNhOFz": ("price", "number"),
            "fldYYfKRjsGv9NRnn": ("tier", "select"),
            "fldzWzefXXZrZXLrn": ("produced_by_agent", "select"),
            "fldA4AuZ88EbHTZrj": ("tools_used", "multiselect"),
            "fldx2kGr0RN7EuWr4": ("trend_score", "number"),
            "fld7ZPMt9kKY7fFlh": ("marketplace_url", "text"),
            "fldoxXLQsFI2bNW09": ("download_link", "text"),
            "fldviT47L9PykZqP3": ("created", "datetime"),
            "fld5f71JOeXQVbQOI": ("_link_deals", "link"),
            "fldtwqtjCIOJF7svA": ("_link_orders", "link"),
            "fld5ye5lE7bBGAbz8": ("_link_content", "link"),
            "fldacUh43KRrJC1xI": ("units_sold", "computed"),
            "fldVYgD2TjX2a7Xv3": ("revenue_generated", "computed"),
        },
    },
    "Orders": {
        "id": "tblak92k5pB9DAwpe",
        "fields": {
            "fldmATw3soPTeASRn": ("order_number", "text"),
            "fldW4qgB6dylnw10j": ("order_date", "datetime"),
            "fldHBExYHYpq65rMI": ("amount", "number"),
            "fldD97umhNjndofc8": ("payment_status", "select"),
            "fldcRq9Ofoh9aGBl3": ("fulfillment", "select"),
            "fldWGQTIv2cNc6wi7": ("channel", "select"),
            "fld056HhC94x4Rh5E": ("notes", "text"),
            "fldycLdaMUyQ3677o": ("_link_customer", "link"),
            "fldPJMKNa1cZvjsBt": ("_link_products", "link"),
            "fld5Ts3ju3RfGLRuH": ("_link_deal", "link"),
        },
    },
    "Activities": {
        "id": "tblKkYLQccpvkJVTX",
        "fields": {
            "fldcBNDcW6TjVqBbs": ("activity", "text"),
            "fldKODtvC4SklAjxg": ("type", "select"),
            "fldMPEWB8zPjGHS3W": ("status", "select"),
            "fldnEbj1EPzgrAdR4": ("due_date", "date"),
            "fldMJQOVat5c0uMf0": ("agent", "select"),
            "fldAfuGJV4DlLxo7T": ("notes", "text"),
            "fldVyXCpjn2P7HSeJ": ("_link_contact", "link"),
            "fldvy6IiWi1Pr39zC": ("_link_deal", "link"),
        },
    },
    "Content": {
        "id": "tblSBiGMvcyyZeqcz",
        "fields": {
            "fldnbmUbiYX4a73qL": ("video_title", "text"),
            "fldvePGBW6pKQHNrJ": ("lane", "select"),
            "fldLZFR5kHeurbIHU": ("content_stage", "select"),
            "fld6L1a1UacoA3u5w": ("publish_date", "date"),
            "fldTgiH0qiWcLIvK8": ("hook_angle", "text"),
            "fldRl5wVvRIpFCM75": ("platforms", "multiselect"),
            "fldChghAKlmwiJvZE": ("impressions", "number"),
            "fldrQ7zpp3fSGSQX6": ("views", "number"),
            "fldHhrZYotqcWV4Y7": ("ctr", "number"),
            "fldFblpw3hwQLXpFV": ("first_30s_retention", "number"),
            "fldO10cb5tls9crcG": ("on_track", "select"),
            "fldGf1R7KM5JsTldE": ("notes", "text"),
            "fld5sGpXpidMdB5lJ": ("_link_promotes_products", "link"),
            "fldrgBktm6RbbsMYP": ("_link_attributed_deals", "link"),
            "fld591qLTv4IEGews": ("_link_leads_generated", "link"),
            "fldtUyIVELeZ4xvXk": ("influenced_revenue", "computed"),
        },
    },
}

CONTENT_OPS_TABLES = {
    "Content Calendar": {
        "id": "tblFa66dTvxtputEg",
        "fields": {
            "fld8bng4UH1jCOHhR": ("working_title", "text"),
            "fldjBe6zEmYuJ8iBz": ("publish_date", "date"),
            "fldRbPVr6ALKtqml1": ("lane", "select"),
            "fld2g1rxYxL3wXxaO": ("hook_angle", "text"),
            "fldjrW4vkvkuyTozn": ("status", "select"),
            "fldBJb9pJg6Z5CUqC": ("thumbnail_done", "bool"),
            "fldeEVsmdvh0uA1iS": ("script_done", "bool"),
            "fldZkcjAmurElWAHB": ("shorts_done", "bool"),
            "fldsbmnKCg0w6xpq4": ("notes", "text"),
        },
    },
    "Performance": {
        "id": "tblfoooSCRK10ZpQ4",
        "fields": {
            "fld9cdp2gqrOi4PyZ": ("title", "text"),
            "fldkIFWRgq9qCTUxb": ("publish_date", "date"),
            "fldnNUxJR4aVxApsW": ("impressions", "number"),
            "fldUvXC9ywFR4qlez": ("ctr", "number"),
            "fldlq3e6cRoqQJlf5": ("views", "number"),
            "fldsjJqRdpNLeOD7T": ("avg_view_duration", "number"),
            "fldZb5ehWmQBSxLz9": ("first_30s_retention", "number"),
            "fldJ68IaXDbPFoj6x": ("on_track", "select"),
        },
    },
    "Shorts": {
        "id": "tbljUHpO97nfECDsi",
        "fields": {
            "fldWYLNc0gTCAGME1": ("short_title", "text"),
            # Free-text reference to a Content Calendar row, not a real
            # Airtable link field -- see the audit doc's data-quality note.
            "fldbsWKssVmx92TEu": ("parent_video_title", "text"),
            "fldX0hL4k6t5DqW6F": ("angle", "text"),
            "fldkx4SmncjrnGr5E": ("status", "select"),
            "fldAGlfyCt8mdvZp6": ("youtube", "bool"),
            "fldl053D1PXpoa3oo": ("tiktok", "bool"),
            "fldxUBBuz4Jy20DhZ": ("ig_reels", "bool"),
            "fld91S3JOVbYqY8Sc": ("notes", "text"),
        },
    },
}
