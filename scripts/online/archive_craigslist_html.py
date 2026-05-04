"""SAVE THE DATA FOLDER BEFORE RUNNING THIS SCRIPT!"""

import json
import random
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

available_listings_urls = {
    "dallas": {
        "rentals": "https://dallas.craigslist.org/search/apa",
    },
}

BASE_OUTPUT_DIR = Path("data/raw_html")
SEARCH_PAGE_DELAY_RANGE = (2.0, 4.0)
LISTING_DELAY_RANGE = (0.5, 2.5)
REQUEST_TIMEOUT = 20

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def polite_sleep(delay_range: tuple[float, float]) -> None:
    time.sleep(random.uniform(*delay_range))


def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(HEADERS)
    return session


def fetch_html(session: requests.Session, url: str) -> str:
    response = session.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.text


def extract_listing_urls(search_html: str) -> list[str]:
    soup = BeautifulSoup(search_html, "html.parser")

    ol = soup.find("ol", class_="cl-static-search-results")
    if not ol:
        return []

    urls: list[str] = []
    for li in ol.find_all("li", class_="cl-static-search-result"):
        a = li.find("a", href=True)
        if a:
            urls.append(str(a["href"]).strip())

    return urls


def save_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def archive_segment(
    session: requests.Session, city: str, mode: str, search_url: str
) -> None:
    segment_dir = BASE_OUTPUT_DIR / city / mode
    segment_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== {city} / {mode} ===")
    print(f"Fetching search page: {search_url}")

    search_html = fetch_html(session, search_url)
    save_text(segment_dir / "_search_results.html", search_html)

    listing_urls = extract_listing_urls(search_html)
    listing_urls = list(dict.fromkeys(listing_urls))  # dedupe, preserve order

    save_json(
        segment_dir / "_listing_urls.json",
        {
            "city": city,
            "mode": mode,
            "search_url": search_url,
            "count": len(listing_urls),
            "listing_urls": listing_urls,
        },
    )

    print(f"Found {len(listing_urls)} listing URLs.")
    polite_sleep(SEARCH_PAGE_DELAY_RANGE)

    report = []

    for i, listing_url in enumerate(listing_urls, start=1):
        listing_id = listing_url.rstrip("/").split("/")[-1].replace(".html", "")
        html_path = segment_dir / f"{listing_id}.html"

        if html_path.exists():
            print(f"[{i}/{len(listing_urls)}] Skipping existing: {listing_id}")
            report.append(
                {
                    "listing_id": listing_id,
                    "source_url": listing_url,
                    "status": "skipped_existing",
                }
            )
            continue

        print(f"[{i}/{len(listing_urls)}] Fetching: {listing_url}")

        try:
            listing_html = fetch_html(session, listing_url)
            save_text(html_path, listing_html)
            report.append(
                {
                    "listing_id": listing_id,
                    "source_url": listing_url,
                    "status": "downloaded",
                }
            )
        except Exception as exc:
            print(f"  Failed: {exc}")
            report.append(
                {
                    "listing_id": listing_id,
                    "source_url": listing_url,
                    "status": "failed",
                    "error": str(exc),
                }
            )

        polite_sleep(LISTING_DELAY_RANGE)

    save_json(
        segment_dir / "_archive_report.json",
        {
            "city": city,
            "mode": mode,
            "search_url": search_url,
            "listing_count": len(listing_urls),
            "items": report,
        },
    )


def main() -> None:
    session = make_session()

    for city, modes in available_listings_urls.items():
        for mode, search_url in modes.items():
            archive_segment(session, city, mode, search_url)


if __name__ == "__main__":
    main()
