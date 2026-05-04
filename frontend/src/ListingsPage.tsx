import { useEffect, useState } from "react";
import { getListings } from "./api";
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

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        getListings().then((res) => setListings(res.data));
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h1>Listings</h1>

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
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                    >
                        {l.image_url && (
                            <img src={l.image_url} width={140} />
                        )}

                        <div>
                            <h3>{l.title}</h3>
                            <p>${l.price_total.toLocaleString()}</p>
                            <p>
                                {l.bedrooms ?? "?"} bd • {l.bathrooms ?? "?"} ba •{" "}
                                {l.area_sqft ?? "?"} sqft
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}