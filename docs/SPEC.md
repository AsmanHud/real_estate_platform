# MVP Spec

Goal:
Build a real estate listings platform using scraped Craigslist data.

Pipeline:
HTML → raw extraction → deterministic normalization → select 100 listings → MySQL → API → frontend

Features:
- Browse listings
- View listing details
- Basic search/filter

Constraints:
- No manual data cleanup
- No live scraping during user queries

Definition of done:
- 100 listings stored in MySQL
- API serves listings and details
- Frontend can display and open listings