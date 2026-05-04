import { useEffect, useState } from "react";
import { getListings } from "./api";
import { useNavigate } from "react-router-dom";

export default function ListingsPage() {
    const [listings, setListings] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const limit = 20;
    const navigate = useNavigate();

    useEffect(() => {
        getListings(page, limit).then((res) => {
            setListings(res.data.data);
            setTotal(res.data.total);
        });
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div style={{ padding: 20 }}>
            <h1>Listings</h1>

            <div style={{ display: "grid", gap: 16 }}>
                {listings.map((l: any) => (
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
                            <p>${l.price_total}</p>
                            <p>
                                {l.bedrooms ?? "?"} bd • {l.bathrooms ?? "?"} ba
                            </p>
                        </div>
                    </div>
                ))}
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
                    Page {page} / {totalPages}
                </span>

                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}