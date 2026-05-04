# Real Estate Listings MVP

## One time preparation, if data/ is empty

### Install Python prerequisites
pip install -r requirements.txt

### Scrape data from Craigslist and select 100 normalized listings
python3 scripts/online/archive_craigslist_html.py
python3 scripts/extract_raw_listing_dicts.py
python3 scripts/hard_coded_normalization.py
python3 scripts/select_mvp_dataset.py

## Run MySQL
docker start real-estate-mysql

## Import data
python3 scripts/import_mvp_to_mysql.py

## Run backend
cd backend
npx ts-node src/server.ts

## Run frontend
cd frontend
npm run dev