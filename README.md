# Real Estate Listings MVP

## Quick start with committed data

The repository includes two 100-listing JSON fixtures:

- `data/fixtures/mvp_listings_enriched.json`: ready-to-run data with `ai_title`
  and `ai_summary`.
- `data/fixtures/mvp_listings_raw.json`: the same MVP data before LLM enrichment.

Install Python prerequisites and start MySQL:

```bash
pip install -r requirements.txt
docker start real-estate-mysql
```

Load the enriched fixture into MySQL:

```bash
python3 scripts/import_mvp_to_mysql.py
```

Load the raw comparison fixture instead:

```bash
python3 scripts/import_mvp_to_mysql.py --input data/fixtures/mvp_listings_raw.json
```

## One time preparation, if generating data from scratch

### Scrape data from Craigslist and select 100 normalized listings
python3 scripts/online/archive_craigslist_html.py
python3 scripts/extract_raw_listing_dicts.py
python3 scripts/hard_coded_normalization.py
python3 scripts/select_mvp_dataset.py

## Import scratch-generated data
python3 scripts/import_mvp_to_mysql.py --input data/processed/mvp_listings.json

## Generate AI titles and summaries

Install Python prerequisites, then export your OpenAI API key in the terminal
where you run the script:

```bash
export OPENAI_API_KEY="your_api_key_here"
```

The script defaults to `gpt-5.4-mini`. You can override it with
`OPENAI_MODEL` or `--model`.

```bash
python3 scripts/enrich_listings_with_openai.py --limit 5 --dry-run
python3 scripts/enrich_listings_with_openai.py
```

The script adds `ai_title` and `ai_summary` columns to MySQL if needed, then
fills rows that do not already have AI copy. Use `--overwrite` to regenerate
existing values.

## Run backend
cd backend
npx ts-node src/server.ts

## Run frontend
cd frontend
npm run dev
