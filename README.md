# Real Estate Listings MVP

## Quick Start From A Fresh Clone

This path uses committed fixture data, so you do not need to scrape Craigslist
or call the OpenAI API.

### 1. Install dependencies

From the repository root:

```bash
pip install -r requirements.txt

cd backend
npm install

cd ../frontend
npm install

cd ..
```

### 2. Start MySQL

Create the MySQL container the first time:

```bash
docker run --name real-estate-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=real_estate \
  -p 3306:3306 \
  -d mysql:8
```

After the first time, start the existing container with:

```bash
docker start real-estate-mysql
```

If port `3306` is already in use, either stop the other MySQL server or map a
different port and set `MYSQL_PORT` before importing/running the backend.

### 3. Load Fixture Data

The default import loads `data/fixtures/mvp_listings_enriched.json`, which
contains 100 listings with `ai_title` and `ai_summary`.

```bash
python3 scripts/import_mvp_to_mysql.py
```

To compare against the pre-LLM dataset, load the raw fixture instead:

```bash
python3 scripts/import_mvp_to_mysql.py --input data/fixtures/mvp_listings_raw.json
```

### 4. Run The App

Run the backend in one terminal:

```bash
cd backend
npx ts-node src/server.ts
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the frontend terminal.

## Fixture Files

- `data/fixtures/mvp_listings_enriched.json`: ready-to-run data with `ai_title`
  and `ai_summary`.
- `data/fixtures/mvp_listings_raw.json`: the same MVP data before LLM enrichment.

## Generate Data From Scratch

### Scrape data from Craigslist and select 100 normalized listings
python3 scripts/online/archive_craigslist_html.py
python3 scripts/extract_raw_listing_dicts.py
python3 scripts/hard_coded_normalization.py
python3 scripts/select_mvp_dataset.py

## Import scratch-generated data
python3 scripts/import_mvp_to_mysql.py --input data/processed/mvp_listings.json

## Generate AI Titles And Summaries

Export your OpenAI API key in the terminal where you run the script:

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
