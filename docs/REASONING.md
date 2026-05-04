# Reasoning

## Data Extracted

I focused on the minimum set of fields needed to make a real estate browsing
experience useful: listing id, title, total price, bedrooms, bathrooms, square
footage, address, image URL, latitude/longitude, raw description, posted/updated
timestamps, and later AI-generated title and summary fields. These fields support
the core user actions in the MVP: scan listings, filter by basic constraints,
open a detail page, and understand whether a listing is worth investigating.

## Handling Low-Quality Data

Craigslist data is inconsistent, noisy, and often unstructured, so the pipeline
uses deterministic normalization before anything reaches the app. Raw HTML is
converted into raw listing dictionaries, then hard-coded parsing extracts stable
fields such as price, bed/bath counts, and square footage. The MVP selection step
chooses 100 higher-quality listings by favoring records with images, area,
address, and location data. I avoided manual cleanup so the pipeline remains
repeatable and honest about the source quality.

For the original raw descriptions, I kept `description_raw` in the database as
source evidence. This matters because enrichment can make the app easier to read,
but the raw source should remain available for auditability and future re-runs.

## Where AI Is Used

AI is used only after deterministic extraction, in a one-shot enrichment script.
The script sends structured listing facts plus the raw description to OpenAI and
stores two generated fields: `ai_title` and `ai_summary`. I used AI here because
the raw Craigslist title and description often contain duplicated metadata,
contact text, promotional boilerplate, odd casing, or irrelevant fragments. This
is exactly the kind of text-normalization task where an LLM can improve user
readability without becoming part of the live request path.

The app does not call the LLM during browsing. Enrichment is offline, saved in
MySQL, and also exported into a committed enriched JSON fixture so the project can
run without an API key.

## Key Assumption

The main assumption is that a small, curated set of 100 Dallas rental listings is
enough to demonstrate the product workflow. The MVP optimizes for a complete,
understandable browse/filter/detail experience rather than comprehensive market
coverage.

## Success Metric

One product success metric would be the percentage of users who apply at least
one filter and then open a listing detail page. That measures whether the data,
filters, and card summaries are helping users narrow options and continue deeper
into the browsing flow.

## Failure Mode

The biggest limitation is that scraped marketplace data can be stale,
incomplete, duplicated, or misleading. Deterministic parsing can miss unusual
formats, and AI summaries can smooth over rough text while still depending on the
quality of the source fields. The app should therefore treat AI copy as a
readability layer, not as verified listing truth.

## Improvements With More Time

With more time, I would add automated data-quality checks, duplicate detection,
freshness tracking, and an evaluation set for the AI enrichment prompt. I would
also make the import/export workflow more production-like, with migrations
instead of ad hoc table creation, richer search, better error handling, and a
repeatable scheduled pipeline for refreshing listings.
