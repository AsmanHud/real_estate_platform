import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Container,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { getListings, type ListingFilters } from "./api";
import { useNavigate } from "react-router-dom";

type Listing = {
    id: number;
    title: string;
    price_total: number;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqft: number | null;
    address?: string | null;
    image_url: string | null;
    ai_title: string | null;
    ai_summary: string | null;
};

const emptyFilters: ListingFilters = {
    q: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    minArea: "",
    maxArea: "",
};

const formatMetric = (value: number | null, fallback = "?") =>
    value === null ? fallback : value.toLocaleString();

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<ListingFilters>(emptyFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const limit = 20;
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        getListings(page, limit, filters)
            .then((res) => {
                if (!active) {
                    return;
                }

                setListings(res.data.data);
                setTotal(res.data.total);
                setError("");
            })
            .catch(() => {
                if (active) {
                    setError("Listings could not be loaded.");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [page, filters]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const resultStart = total === 0 ? 0 : (page - 1) * limit + 1;
    const resultEnd = Math.min(page * limit, total);
    const hasFilters = Object.values(filters).some(Boolean);

    const updateFilter = (key: keyof ListingFilters, value: string) => {
        setPage(1);
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <Box
                component="header"
                sx={{
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Container maxWidth="lg" sx={{ py: 3 }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ justifyContent: "space-between" }}
                    >
                        <Box>
                            <Typography variant="h1">Dallas rentals</Typography>
                            <Typography color="text.secondary">
                                Search and filter Craigslist-sourced listings.
                            </Typography>
                        </Box>

                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                        >
                            <Chip
                                label={`${total.toLocaleString()} matches`}
                                color="primary"
                                variant="outlined"
                            />
                            {hasFilters && (
                                <Chip label="Filtered" variant="outlined" />
                            )}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Card
                    variant="outlined"
                    sx={{ mb: 3, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}
                >
                    <CardContent>
                        <Stack spacing={2}>
                            <Typography variant="h3">Filters</Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, 1fr)",
                                        md: "repeat(6, 1fr)",
                                    },
                                }}
                            >
                                <TextField
                                    label="Search"
                                    placeholder="City, title, amenity"
                                    size="small"
                                    value={filters.q}
                                    onChange={(event) =>
                                        updateFilter("q", event.target.value)
                                    }
                                    sx={{ gridColumn: { md: "span 2" } }}
                                />

                                <TextField
                                    label="Min price"
                                    size="small"
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(event) =>
                                        updateFilter("minPrice", event.target.value)
                                    }
                                />

                                <TextField
                                    label="Max price"
                                    size="small"
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(event) =>
                                        updateFilter("maxPrice", event.target.value)
                                    }
                                />

                                <FormControl size="small">
                                    <InputLabel id="bedrooms-label">
                                        Bedrooms
                                    </InputLabel>
                                    <Select
                                        label="Bedrooms"
                                        labelId="bedrooms-label"
                                        value={filters.bedrooms}
                                        onChange={(event) =>
                                            updateFilter(
                                                "bedrooms",
                                                event.target.value
                                            )
                                        }
                                    >
                                        <MenuItem value="">Any</MenuItem>
                                        <MenuItem value="0">Studio</MenuItem>
                                        <MenuItem value="1">1</MenuItem>
                                        <MenuItem value="2">2</MenuItem>
                                        <MenuItem value="3">3</MenuItem>
                                        <MenuItem value="4">4</MenuItem>
                                        <MenuItem value="5">5</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Min area"
                                    size="small"
                                    type="number"
                                    value={filters.minArea}
                                    onChange={(event) =>
                                        updateFilter("minArea", event.target.value)
                                    }
                                />

                                <TextField
                                    label="Max area"
                                    size="small"
                                    type="number"
                                    value={filters.maxArea}
                                    onChange={(event) =>
                                        updateFilter("maxArea", event.target.value)
                                    }
                                />

                                <Button
                                    disabled={!hasFilters}
                                    onClick={() => {
                                        setPage(1);
                                        setFilters(emptyFilters);
                                    }}
                                    variant="outlined"
                                >
                                    Clear
                                </Button>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ justifyContent: "space-between" }}
                    >
                        <Typography variant="h2">Available homes</Typography>
                        <Typography color="text.secondary">
                            Showing {resultStart.toLocaleString()}-
                            {resultEnd.toLocaleString()} of{" "}
                            {total.toLocaleString()}
                        </Typography>
                    </Stack>

                    {error && <Alert severity="error">{error}</Alert>}

                    {loading
                        ? Array.from({ length: 4 }).map((_, index) => (
                              <Skeleton
                                  height={174}
                                  key={index}
                                  sx={{ borderRadius: 1 }}
                                  variant="rounded"
                              />
                          ))
                        : listings.map((listing) => {
                              const displayTitle = listing.ai_title || listing.title;

                              return (
                                  <Card
                                      key={listing.id}
                                      variant="outlined"
                                      sx={{
                                          overflow: "hidden",
                                          transition:
                                              "box-shadow 160ms ease, transform 160ms ease",
                                          "&:hover": {
                                              boxShadow:
                                                  "0 10px 24px rgba(15, 23, 42, 0.12)",
                                              transform: "translateY(-1px)",
                                          },
                                      }}
                                  >
                                      <CardActionArea
                                          onClick={() =>
                                              navigate(`/listing/${listing.id}`)
                                          }
                                          sx={{
                                              alignItems: "stretch",
                                              display: "flex",
                                              flexDirection: {
                                                  xs: "column",
                                                  sm: "row",
                                              },
                                          }}
                                      >
                                          {listing.image_url ? (
                                              <Box
                                                  alt={displayTitle}
                                                  component="img"
                                                  src={listing.image_url}
                                                  sx={{
                                                      aspectRatio: {
                                                          xs: "16 / 10",
                                                          sm: "4 / 3",
                                                      },
                                                      flexShrink: 0,
                                                      objectFit: "cover",
                                                      width: {
                                                          xs: "100%",
                                                          sm: 220,
                                                      },
                                                  }}
                                              />
                                          ) : (
                                              <Box
                                                  sx={{
                                                      alignItems: "center",
                                                      aspectRatio: {
                                                          xs: "16 / 10",
                                                          sm: "4 / 3",
                                                      },
                                                      bgcolor: "#eef0f2",
                                                      color: "text.secondary",
                                                      display: "flex",
                                                      flexShrink: 0,
                                                      justifyContent: "center",
                                                      width: {
                                                          xs: "100%",
                                                          sm: 220,
                                                      },
                                                  }}
                                              >
                                                  No photo
                                              </Box>
                                          )}

                                          <CardContent sx={{ flex: 1, p: 2.5 }}>
                                              <Stack spacing={1.5}>
                                                  <Box>
                                                      <Typography variant="h2">
                                                          $
                                                          {listing.price_total.toLocaleString()}
                                                      </Typography>
                                                      <Typography
                                                          color="text.primary"
                                                          sx={{ fontWeight: 700 }}
                                                          variant="body1"
                                                      >
                                                          {displayTitle}
                                                      </Typography>
                                                  </Box>

                                                  {listing.ai_summary && (
                                                      <Typography color="text.secondary">
                                                          {listing.ai_summary}
                                                      </Typography>
                                                  )}

                                                  <Stack
                                                      direction="row"
                                                      divider={
                                                          <Divider
                                                              flexItem
                                                              orientation="vertical"
                                                          />
                                                      }
                                                      spacing={1.5}
                                                      sx={{ flexWrap: "wrap" }}
                                                  >
                                                      <Typography>
                                                          <strong>
                                                              {formatMetric(
                                                                  listing.bedrooms
                                                              )}
                                                          </strong>{" "}
                                                          bd
                                                      </Typography>
                                                      <Typography>
                                                          <strong>
                                                              {formatMetric(
                                                                  listing.bathrooms
                                                              )}
                                                          </strong>{" "}
                                                          ba
                                                      </Typography>
                                                      <Typography>
                                                          <strong>
                                                              {formatMetric(
                                                                  listing.area_sqft
                                                              )}
                                                          </strong>{" "}
                                                          sqft
                                                      </Typography>
                                                  </Stack>

                                                  {listing.address && (
                                                      <Typography color="text.secondary">
                                                          {listing.address}
                                                      </Typography>
                                                  )}
                                              </Stack>
                                          </CardContent>
                                      </CardActionArea>
                                  </Card>
                              );
                          })}

                    {!loading && listings.length === 0 && !error && (
                        <Card variant="outlined">
                            <CardContent>
                                <Typography>No listings match these filters.</Typography>
                            </CardContent>
                        </Card>
                    )}

                    <Stack sx={{ alignItems: "center", py: 2 }}>
                        <Pagination
                            color="primary"
                            count={totalPages}
                            onChange={(_, nextPage) => setPage(nextPage)}
                            page={page}
                            showFirstButton
                            showLastButton
                        />
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}
