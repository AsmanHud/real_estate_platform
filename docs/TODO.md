# Next Tasks

## Task 1: Add filtering
Backend:
- GET /api/listings supports minPrice, maxPrice, bedrooms, minArea, maxArea
- Preserve pagination response shape: { data, page, limit, total }

Frontend:
- Add controls for price range, bedrooms, and area range
- Refetch listings when filters change

## Task 2: Improve UI
- Keep Redfin-inspired clean card layout
- Do not add maps
- Do not introduce heavy UI complexity

## Task 3: Add LLM enrichment later
- Generate normalized_title and summary for selected 100 listings