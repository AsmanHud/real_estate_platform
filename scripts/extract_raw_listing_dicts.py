import json
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag


def clean_text(text: str | None) -> str | None:
    if text is None:
        return None
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned or None


def extract_first_image_url(soup: BeautifulSoup) -> str | None:
    thumb = soup.select_one("#thumbs a.thumb[href]")
    if thumb:
        return str(thumb["href"]).strip()

    for script in soup.find_all("script"):
        script_text = script.string or script.get_text()
        match = re.search(r'"url"\s*:\s*"([^"]+)"', script_text)
        if match:
            return match.group(1).strip()

    img = soup.select_one("div.slide.first img[src]")
    if img:
        return str(img["src"]).strip()

    return None


def extract_datetime_by_label(soup: BeautifulSoup, label: str) -> str | None:
    for p in soup.select("div.postinginfos p.postinginfo"):
        text = clean_text(p.get_text(" ", strip=True))
        if not text:
            continue

        if text.lower().startswith(f"{label.lower()}:"):
            time_el = p.find("time", attrs={"datetime": True})
            if time_el:
                return str(time_el["datetime"]).strip()

    return None


def extract_description_raw(soup: BeautifulSoup) -> str | None:
    postingbody = soup.select_one("section#postingbody")
    if not postingbody:
        return None

    qr_block = postingbody.select_one(".print-qrcode-container")
    if qr_block:
        qr_block.decompose()

    text = postingbody.get_text("\n", strip=True)
    text = re.sub(r"\n{2,}", "\n", text)
    return clean_text(text)


def extract_important_attrs_raw(soup: BeautifulSoup) -> list[str]:
    values = []
    for span in soup.select("span.attr.important"):
        text = clean_text(span.get_text(" ", strip=True))
        if text:
            values.append(text)
    return values


def extract_attrs_raw(soup: BeautifulSoup) -> list[dict[str, Any]]:
    attrs = []

    for div in soup.select("div.attrgroup div.attr"):
        if not isinstance(div, Tag):
            continue

        label_el = div.select_one("span.labl")
        value_el = div.select_one("span.valu")
        link_el = value_el.select_one("a[href]") if value_el else None

        attrs.append(
            {
                "classes": div.get("class") or [],
                "label": (
                    clean_text(label_el.get_text(" ", strip=True)) if label_el else None
                ),
                "value": (
                    clean_text(value_el.get_text(" ", strip=True)) if value_el else None
                ),
                "href": str(link_el["href"]).strip() if link_el else None,
            }
        )

    return attrs


def extract_raw_listing_from_file(html_path: str | Path) -> dict[str, Any]:
    html_path = Path(html_path)
    html = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.select_one("h1.postingtitle #titletextonly")
    price_el = soup.select_one("h1.postingtitle span.price")
    housing_el = soup.select_one("h1.postingtitle span.housing")

    address_el = soup.select_one("h2.street-address")
    map_address_el = soup.select_one("div.mapbox > div.mapaddress")

    map_el = soup.select_one("#map")

    return {
        "post_id": html_path.stem,
        "title": clean_text(title_el.get_text(" ", strip=True)) if title_el else None,
        "price_raw": (
            clean_text(price_el.get_text(" ", strip=True)) if price_el else None
        ),
        "housing_raw": (
            clean_text(housing_el.get_text(" ", strip=True)) if housing_el else None
        ),
        "address_raw": (
            clean_text(address_el.get_text(" ", strip=True))
            if address_el
            else (
                clean_text(map_address_el.get_text(" ", strip=True))
                if map_address_el
                else None
            )
        ),
        "first_image_url": extract_first_image_url(soup),
        "latitude_raw": (
            str(map_el["data-latitude"]).strip()
            if map_el and map_el.has_attr("data-latitude")
            else None
        ),
        "longitude_raw": (
            str(map_el["data-longitude"]).strip()
            if map_el and map_el.has_attr("data-longitude")
            else None
        ),
        "important_attrs_raw": extract_important_attrs_raw(soup),
        "attrs_raw": extract_attrs_raw(soup),
        "description_raw": extract_description_raw(soup),
        "posted_at_raw": extract_datetime_by_label(soup, "posted"),
        "updated_at_raw": extract_datetime_by_label(soup, "updated"),
    }


def parse_raw_directory(input_dir: str | Path, output_path: str | Path) -> None:
    input_dir = Path(input_dir)
    output_path = Path(output_path)

    raw_listings = []

    for html_file in sorted(input_dir.glob("*.html")):
        if html_file.name.startswith("_"):
            continue

        raw = extract_raw_listing_from_file(html_file)
        raw_listings.append(raw)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(raw_listings, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Extracted {len(raw_listings)} raw listings.")
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    parse_raw_directory(
        input_dir="data/raw_html/dallas/rentals",
        output_path="data/raw_json/dallas_rentals_raw.json",
    )
