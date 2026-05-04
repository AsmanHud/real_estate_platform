# Listing Fixtures

These committed snapshots let the app run without scraping Craigslist or calling
the OpenAI API.

- `mvp_listings_raw.json`: selected 100-listing MVP dataset before LLM enrichment.
- `mvp_listings_enriched.json`: same dataset exported from MySQL after generating
  `ai_title` and `ai_summary`.

Load the enriched dataset:

```bash
python3 scripts/import_mvp_to_mysql.py
```

Load the raw comparison dataset:

```bash
python3 scripts/import_mvp_to_mysql.py --input data/fixtures/mvp_listings_raw.json
```
