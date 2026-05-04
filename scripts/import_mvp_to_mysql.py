import json
import os
from pathlib import Path

import mysql.connector

INPUT_PATH = Path("data/processed/mvp_listings.json")


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
    %(posted_at)s,
    %(updated_at)s
);
"""


def main() -> None:
    listings = json.loads(INPUT_PATH.read_text(encoding="utf-8"))

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(CREATE_TABLE_SQL)

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

    print(f"Loaded {len(listings)} listings from {INPUT_PATH}")
    print(f"Inserted {inserted} listings into MySQL table: listings")


if __name__ == "__main__":
    main()
