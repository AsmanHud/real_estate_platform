import argparse
import json
import os
from pathlib import Path

DEFAULT_INPUT_PATH = Path("data/fixtures/mvp_listings_enriched.json")


DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", "root"),
    "database": os.getenv("MYSQL_DATABASE", "real_estate"),
}


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    price_total INT NOT NULL,
    bedrooms DECIMAL(3,1),
    bathrooms DECIMAL(3,1),
    area_sqft INT,
    address VARCHAR(255),
    image_url TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    description_raw TEXT NOT NULL,
    ai_title VARCHAR(255),
    ai_summary TEXT,
    posted_at VARCHAR(64),
    updated_at VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


INSERT_SQL = """
INSERT INTO listings (
    post_id,
    title,
    price_total,
    bedrooms,
    bathrooms,
    area_sqft,
    address,
    image_url,
    latitude,
    longitude,
    description_raw,
    ai_title,
    ai_summary,
    posted_at,
    updated_at
)
VALUES (
    %(post_id)s,
    %(title)s,
    %(price_total)s,
    %(bedrooms)s,
    %(bathrooms)s,
    %(area_sqft)s,
    %(address)s,
    %(image_url)s,
    %(latitude)s,
    %(longitude)s,
    %(description_raw)s,
    %(ai_title)s,
    %(ai_summary)s,
    %(posted_at)s,
    %(updated_at)s
);
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import listing JSON into the MySQL listings table."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help=f"JSON file to import. Defaults to {DEFAULT_INPUT_PATH}.",
    )
    return parser.parse_args()


def ensure_ai_columns(cursor) -> None:
    desired_columns = {
        "ai_title": "VARCHAR(255)",
        "ai_summary": "TEXT",
    }

    for column, column_type in desired_columns.items():
        cursor.execute("SHOW COLUMNS FROM listings LIKE %s", (column,))
        if cursor.fetchone() is None:
            cursor.execute(f"ALTER TABLE listings ADD COLUMN {column} {column_type}")
            print(f"Added column: {column}")


def main() -> None:
    args = parse_args()
    listings = json.loads(args.input.read_text(encoding="utf-8"))

    import mysql.connector

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(CREATE_TABLE_SQL)
    ensure_ai_columns(cursor)

    # MVP behavior: replace dataset completely.
    cursor.execute("DELETE FROM listings;")
    cursor.execute("ALTER TABLE listings AUTO_INCREMENT = 1;")

    inserted = 0

    INSERT_FIELDS = [
        "post_id",
        "title",
        "price_total",
        "bedrooms",
        "bathrooms",
        "area_sqft",
        "address",
        "image_url",
        "latitude",
        "longitude",
        "description_raw",
        "ai_title",
        "ai_summary",
        "posted_at",
        "updated_at",
    ]

    for listing in listings:
        payload = {field: listing.get(field) for field in INSERT_FIELDS}
        cursor.execute(INSERT_SQL, payload)
        inserted += 1

    conn.commit()

    cursor.close()
    conn.close()

    print(f"Loaded {len(listings)} listings from {args.input}")
    print(f"Inserted {inserted} listings into MySQL table: listings")


if __name__ == "__main__":
    main()
