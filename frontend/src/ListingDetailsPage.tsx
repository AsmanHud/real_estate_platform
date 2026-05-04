import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { getListing } from "./api";

type Listing = {
    id: number;
    title: string;
    price_total: number;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqft: number | null;
    address: string | null;
    image_url: string | null;
    description_raw: string;
    ai_title: string | null;
    ai_summary: string | null;
};

const formatMetric = (value: number | null, fallback = "?") =>
    value === null ? fallback : value.toLocaleString();

export default function ListingDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) {
            return;
        }

        let active = true;

        getListing(Number(id))
            .then((res) => {
                if (active) {
                    setListing(res.data);
                    setError("");
                }
            })
            .catch(() => {
                if (active) {
                    setError("Listing could not be loaded.");
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
    }, [id]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                    Back to listings
                </Button>

                {!id && (
                    <Alert severity="error">Listing id is missing.</Alert>
                )}

                {id && loading && (
                    <Stack spacing={2}>
                        <Skeleton height={420} variant="rounded" />
                        <Skeleton height={180} variant="rounded" />
                    </Stack>
                )}

                {!loading && error && <Alert severity="error">{error}</Alert>}

                {!loading && listing && (
                    <Stack spacing={3}>
                        <Card variant="outlined" sx={{ overflow: "hidden" }}>
                            {listing.image_url ? (
                                <Box
                                    alt={listing.ai_title || listing.title}
                                    component="img"
                                    src={listing.image_url}
                                    sx={{
                                        aspectRatio: { xs: "4 / 3", md: "16 / 7" },
                                        display: "block",
                                        objectFit: "cover",
                                        width: "100%",
                                    }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        alignItems: "center",
                                        aspectRatio: { xs: "4 / 3", md: "16 / 7" },
                                        bgcolor: "#eef0f2",
                                        color: "text.secondary",
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    No photo available
                                </Box>
                            )}

                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="h1">
                                            ${listing.price_total.toLocaleString()}
                                        </Typography>
                                        <Typography color="text.primary" variant="h2">
                                            {listing.ai_title || listing.title}
                                        </Typography>
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ flexWrap: "wrap" }}
                                    >
                                        <Chip
                                            label={`${formatMetric(
                                                listing.bedrooms
                                            )} bd`}
                                        />
                                        <Chip
                                            label={`${formatMetric(
                                                listing.bathrooms
                                            )} ba`}
                                        />
                                        <Chip
                                            label={`${formatMetric(
                                                listing.area_sqft
                                            )} sqft`}
                                        />
                                    </Stack>

                                    {listing.address && (
                                        <Typography color="text.secondary">
                                            {listing.address}
                                        </Typography>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card variant="outlined">
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Typography variant="h2">About this home</Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography
                                    color="text.secondary"
                                    sx={{ whiteSpace: "pre-wrap" }}
                                >
                                    {listing.ai_summary || listing.description_raw}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                )}
            </Container>
        </Box>
    );
}
