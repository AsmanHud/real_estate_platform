import json
from pathlib import Path

INPUT_PATH = Path("data/processed/dallas_rentals_level1.json")
OUTPUT_PATH = Path("data/processed/mvp_listings.json")
LIMIT = 100


def listing_score(listing: dict) -> int:
    score = 0

    if listing.get("image_url"):
        score += 2

    if listing.get("area_sqft"):
        score += 2

    if listing.get("address"):
        score += 1

    if listing.get("latitude") is not None and listing.get("longitude") is not None:
        score += 1

    return score


def main() -> None:
    listings = json.loads(INPUT_PATH.read_text(encoding="utf-8"))

    selected = sorted(
        listings,
        key=lambda listing: (
            listing_score(listing),
            listing.get("posted_at") or "",
        ),
        reverse=True,
    )[:LIMIT]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(selected, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Input listings: {len(listings)}")
    print(f"Selected listings: {len(selected)}")
    print(f"Saved to: {OUTPUT_PATH}")

    print("\nSelected dataset quality:")
    for field in ["image_url", "area_sqft", "address", "latitude", "longitude"]:
        missing = sum(1 for listing in selected if listing.get(field) in (None, ""))
        print(f"{field}: missing {missing} / {len(selected)}")


if __name__ == "__main__":
    main()
