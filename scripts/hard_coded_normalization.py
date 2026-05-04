"""LEVEL 1 NORMALIZATION: Deterministic rules-based normalization for key fields like price, bedrooms, bathrooms, and area_sqft."""

import json
import re
from pathlib import Path
from typing import Any


def parse_price(price_raw: str | None) -> int | None:
    if not price_raw:
        return None

    cleaned = re.sub(r"[^\d.]", "", price_raw)
    if not cleaned:
        return None

    try:
        return int(float(cleaned))
    except ValueError:
        return None


def parse_float(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


# for bedrooms and bathrooms, we want to preserve half-baths as 0.5, but convert whole numbers to int for easier analysis
def number_maybe_int(value: str | None) -> int | float | None:
    if not value:
        return None

    try:
        number = float(value)
    except ValueError:
        return None

    if number.is_integer():
        return int(number)

    return round(number, 1)


def parse_bedrooms_bathrooms_from_structured_attrs(
    raw: dict[str, Any],
) -> tuple[int | float | None, int | float | None]:
    important_attrs = raw.get("important_attrs_raw") or []

    pattern = re.compile(
        r"(\d+(?:\.\d+)?)\s*BR\s*/\s*(\d+(?:\.\d+)?)\s*Ba",
        re.IGNORECASE,
    )

    for attr in important_attrs:
        match = pattern.search(attr)
        if match:
            bedrooms = number_maybe_int(match.group(1))
            bathrooms = number_maybe_int(match.group(2))
            return bedrooms, bathrooms

    return None, None


def parse_area_sqft_from_structured_attrs(raw: dict[str, Any]) -> int | None:
    important_attrs = raw.get("important_attrs_raw") or []
    housing_raw = raw.get("housing_raw") or ""

    candidates = important_attrs + [housing_raw]

    # Intentionally simple: Craigslist commonly stores area as "600ft 2" or "600ft2".
    pattern = re.compile(r"\b(\d{2,5})\s*ft\s*2?\b", re.IGNORECASE)

    for text in candidates:
        match = pattern.search(text)
        if match:
            return int(match.group(1))

    return None


def normalize_raw_listing_level_1(raw: dict[str, Any]) -> dict[str, Any] | None:
    price_total = parse_price(raw.get("price_raw"))
    bedrooms, bathrooms = parse_bedrooms_bathrooms_from_structured_attrs(raw)
    area_sqft = parse_area_sqft_from_structured_attrs(raw)

    normalized = {
        "post_id": raw.get("post_id"),
        "title": raw.get("title"),
        "price_total": price_total,
        "housing_raw": raw.get("housing_raw"),
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "area_sqft": area_sqft,
        "address": raw.get("address_raw"),
        "image_url": raw.get("first_image_url"),
        "latitude": parse_float(raw.get("latitude_raw")),
        "longitude": parse_float(raw.get("longitude_raw")),
        "important_attrs_raw": raw.get("important_attrs_raw") or [],
        "attrs_raw": raw.get("attrs_raw") or [],
        "description_raw": raw.get("description_raw"),
        "posted_at": raw.get("posted_at_raw"),
        "updated_at": raw.get("updated_at_raw"),
        "normalization_level": "deterministic_v1",
    }

    required_fields = [
        "post_id",
        "title",
        "price_total",
        "description_raw",
    ]

    if any(normalized[field] in (None, "") for field in required_fields):
        return None

    return normalized


def normalize_raw_json_file_level_1(
    input_path: str | Path,
    output_path: str | Path,
) -> None:
    input_path = Path(input_path)
    output_path = Path(output_path)

    raw_listings = json.loads(input_path.read_text(encoding="utf-8"))

    normalized_listings = []
    discarded = []

    for raw in raw_listings:
        normalized = normalize_raw_listing_level_1(raw)

        if normalized is None:
            discarded.append(
                {
                    "post_id": raw.get("post_id"),
                    "title": raw.get("title"),
                    "price_raw": raw.get("price_raw"),
                    "reason": "missing required level-1 field",
                }
            )
        else:
            normalized_listings.append(normalized)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(normalized_listings, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    discard_path = output_path.with_name(output_path.stem + "_discarded.json")
    discard_path.write_text(
        json.dumps(discarded, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Input raw listings: {len(raw_listings)}")
    print(f"Level-1 normalized listings: {len(normalized_listings)}")
    print(f"Discarded listings: {len(discarded)}")
    print(f"Saved normalized listings to: {output_path}")
    print(f"Saved discarded listings to: {discard_path}")


if __name__ == "__main__":
    normalize_raw_json_file_level_1(
        input_path="data/raw_json/dallas_rentals_raw.json",
        output_path="data/processed/dallas_rentals_level1.json",
    )
