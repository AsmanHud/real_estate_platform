# Example User Journeys

## Scenario A: Filtered Apartment Search

A user wants a two-bedroom rental near Dallas/Fort Worth under $2,000. They open
the listing page, search for `Fort Worth`, set bedrooms to `2`, and set max
price to `2000`. The result cards show normalized prices, bed/bath counts,
square footage, and AI summaries, so the user can scan the options quickly and
open a promising detail page.

## Scenario B: Compare Raw vs Enriched Copy

A reviewer wants to see what the AI enrichment changed. They load the raw fixture
with `python3 scripts/import_mvp_to_mysql.py --input data/fixtures/mvp_listings_raw.json`
and browse the app, seeing noisier scraped titles and raw descriptions. Then
they reload the enriched fixture with `python3 scripts/import_mvp_to_mysql.py`
and see the same listings with cleaner `ai_title` and `ai_summary` text.
