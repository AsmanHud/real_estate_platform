"""Generate AI-normalized listing titles and summaries, then save them to MySQL."""

from __future__ import annotations

import argparse
import json
import os
import time
from decimal import Decimal
from typing import Any

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", "root"),
    "database": os.getenv("MYSQL_DATABASE", "real_estate"),
}

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
DESCRIPTION_CHAR_LIMIT = 5000


SYSTEM_PROMPT = """
You normalize scraped Dallas rental listings for a real estate browsing app.
Create clean, useful listing copy from noisy Craigslist data.

Rules:
- Use only facts present in the listing fields.
- Do not invent amenities, policies, neighborhood names, availability, or pricing.
- Remove contact info, URLs, timestamps, boilerplate, emojis, repeated metadata, and spammy phrasing.
- Keep the title natural and specific, not clickbait.
- Keep the summary factual, compact, and readable.
- If the raw description is low quality, fall back to the structured facts.
""".strip()


ENRICHMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "ai_title": {
            "type": "string",
            "description": "A clean listing title, 5 to 12 words, under 90 characters.",
            "maxLength": 120,
        },
        "ai_summary": {
            "type": "string",
            "description": "A concise 1 to 2 sentence summary, under 420 characters.",
            "maxLength": 500,
        },
    },
    "required": ["ai_title", "ai_summary"],
    "additionalProperties": False,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate ai_title and ai_summary for listings in MySQL."
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"OpenAI model to use. Defaults to OPENAI_MODEL or {DEFAULT_MODEL}.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Only process this many listings. Useful for a test run.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Regenerate rows even when ai_title and ai_summary already exist.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Call the model and print results without updating MySQL.",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.1,
        help="Seconds to wait between API calls.",
    )
    return parser.parse_args()


def ensure_ai_columns(cursor: Any) -> None:
    desired_columns = {
        "ai_title": "VARCHAR(255)",
        "ai_summary": "TEXT",
    }

    for column, column_type in desired_columns.items():
        cursor.execute("SHOW COLUMNS FROM listings LIKE %s", (column,))
        if cursor.fetchone() is None:
            cursor.execute(f"ALTER TABLE listings ADD COLUMN {column} {column_type}")
            print(f"Added column: {column}")


def fetch_listings(cursor: Any, *, limit: int | None, overwrite: bool) -> list[dict]:
    where_sql = "" if overwrite else "WHERE ai_title IS NULL OR ai_summary IS NULL"
    limit_sql = " LIMIT %s" if limit else ""
    params = (limit,) if limit else ()

    cursor.execute(
        f"""
        SELECT
            id,
            title,
            price_total,
            bedrooms,
            bathrooms,
            area_sqft,
            address,
            description_raw
        FROM listings
        {where_sql}
        ORDER BY id
        {limit_sql}
        """,
        params,
    )

    return list(cursor.fetchall())


def json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)

    return value


def build_listing_payload(listing: dict) -> dict:
    description = listing.get("description_raw") or ""

    return {
        "source_title": json_safe(listing.get("title")),
        "price_total": json_safe(listing.get("price_total")),
        "bedrooms": json_safe(listing.get("bedrooms")),
        "bathrooms": json_safe(listing.get("bathrooms")),
        "area_sqft": json_safe(listing.get("area_sqft")),
        "address": json_safe(listing.get("address")),
        "raw_description": description[:DESCRIPTION_CHAR_LIMIT],
    }


def generate_enrichment(client: Any, model: str, listing: dict) -> dict[str, str]:
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    build_listing_payload(listing),
                    ensure_ascii=False,
                ),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "listing_enrichment",
                "schema": ENRICHMENT_SCHEMA,
                "strict": True,
            }
        },
        max_output_tokens=350,
    )

    parsed = json.loads(response.output_text)

    return {
        "ai_title": parsed["ai_title"].strip()[:255],
        "ai_summary": parsed["ai_summary"].strip(),
    }


def main() -> None:
    args = parse_args()

    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set.")

    from openai import OpenAI
    import mysql.connector

    client = OpenAI()
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    try:
        ensure_ai_columns(cursor)
        conn.commit()

        listings = fetch_listings(
            cursor,
            limit=args.limit,
            overwrite=args.overwrite,
        )
        print(f"Listings to enrich: {len(listings)}")
        print(f"Model: {args.model}")

        for index, listing in enumerate(listings, start=1):
            listing_id = listing["id"]
            enrichment = generate_enrichment(client, args.model, listing)

            print(
                f"[{index}/{len(listings)}] #{listing_id}: "
                f"{enrichment['ai_title']}"
            )

            if args.dry_run:
                print(f"    {enrichment['ai_summary']}")
            else:
                cursor.execute(
                    """
                    UPDATE listings
                    SET ai_title = %s, ai_summary = %s
                    WHERE id = %s
                    """,
                    (
                        enrichment["ai_title"],
                        enrichment["ai_summary"],
                        listing_id,
                    ),
                )
                conn.commit()

            if args.sleep:
                time.sleep(args.sleep)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
