import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
};

export default function ListingDetailsPage() {
    const { id } = useParams();
    const [listing, setListing] = useState<Listing | null>(null);

    useEffect(() => {
        if (id) {
            getListing(Number(id)).then((res) => setListing(res.data));
        }
    }, [id]);

    if (!listing) return <div>Loading...</div>;

    return (
        <div style={{ padding: 20 }}>
            <h1>{listing.title}</h1>

            {listing.image_url && (
                <img src={listing.image_url} width={400} />
            )}

            <h2>${listing.price_total.toLocaleString()}</h2>

            <p>
                {listing.bedrooms ?? "?"} bd • {listing.bathrooms ?? "?"} ba •{" "}
                {listing.area_sqft ?? "?"} sqft
            </p>

            {listing.address && <p>{listing.address}</p>}

            <hr />

            <p>{listing.description_raw}</p>
        </div>
    );
}