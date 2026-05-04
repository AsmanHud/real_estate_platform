import { useEffect, useState } from "react";
import { getListings, type ListingFilters } from "./api";
import { useNavigate } from "react-router-dom";

type Listing = {
    id: number;
    title: string;
    price_total: number;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqft: number | null;
    image_url: string | null;
};

const emptyFilters: ListingFilters = {
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    minArea: "",
    maxArea: "",
};

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<ListingFilters>(emptyFilters);

    const limit = 20;
    const navigate = useNavigate();

    useEffect(() => {
        getListings(page, limit, filters).then((res) => {
            setListings(res.data.data);
            setTotal(res.data.total);
        });
    }, [page, filters]);

    const totalPages = Math.ceil(total / limit);
    const hasFilters = Object.values(filters).some(Boolean);

    const updateFilter = (key: keyof ListingFilters, value: string) => {
        setPage(1);
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Listings</h1>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 12,
                    marginBottom: 20,
                    textAlign: "left",
                }}
            >
                <label>
                    Min price
                    <input
                        min="0"
                        type="number"
                        value={filters.minPrice}
                        onChange={(event) =>
                            updateFilter("minPrice", event.target.value)
                        }
                        style={{ boxSizing: "border-box", width: "100%" }}
                    />
                </label>

                <label>
                    Max price
                    <input
                        min="0"
                        type="number"
                        value={filters.maxPrice}
                        onChange={(event) =>
                            updateFilter("maxPrice", event.target.value)
                        }
                        style={{ boxSizing: "border-box", width: "100%" }}
                    />
                </label>

                <label>
                    Bedrooms
                    <select
                        value={filters.bedrooms}
                        onChange={(event) =>
                            updateFilter("bedrooms", event.target.value)
                        }
                        style={{ boxSizing: "border-box", width: "100%" }}
                    >
                        <option value="">Any</option>
                        <option value="0">Studio</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </label>

                <label>
                    Min area
                    <input
                        min="0"
                        type="number"
                        value={filters.minArea}
                        onChange={(event) =>
                            updateFilter("minArea", event.target.value)
                        }
                        style={{ boxSizing: "border-box", width: "100%" }}
                    />
                </label>

                <label>
                    Max area
                    <input
                        min="0"
                        type="number"
                        value={filters.maxArea}
                        onChange={(event) =>
                            updateFilter("maxArea", event.target.value)
                        }
                        style={{ boxSizing: "border-box", width: "100%" }}
                    />
                </label>

                <button
                    disabled={!hasFilters}
                    onClick={() => {
                        setPage(1);
                        setFilters(emptyFilters);
                    }}
                    style={{ alignSelf: "end" }}
                >
                    Clear
                </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
                {listings.map((l) => (
                    <div
                        key={l.id}
                        onClick={() => navigate(`/listing/${l.id}`)}
                        style={{
                            border: "1px solid #ddd",
                            padding: 12,
                            display: "flex",
                            gap: 12,
                            cursor: "pointer",
                        }}
                    >
                        {l.image_url && <img src={l.image_url} width={140} />}

                        <div>
                            <h3>{l.title}</h3>
                            <p>${l.price_total.toLocaleString()}</p>
                            <p>
                                {l.bedrooms ?? "?"} bd • {l.bathrooms ?? "?"} ba
                                {" • "}
                                {l.area_sqft ?? "?"} sqft
                            </p>
                        </div>
                    </div>
                ))}

                {listings.length === 0 && <p>No listings match these filters.</p>}
            </div>

            {/* pagination controls */}
            <div style={{ marginTop: 20 }}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    Prev
                </button>

                <span style={{ margin: "0 10px" }}>
                    Page {page} / {totalPages || 1}
                </span>

                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
