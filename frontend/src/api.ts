import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:3001/api",
});

export type ListingFilters = {
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    minArea?: string;
    maxArea?: string;
};

export const getListings = (
    page: number,
    limit: number,
    filters: ListingFilters = {}
) => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    return api.get(`/listings?${params.toString()}`);
};

export const getListing = (id: number) => api.get(`/listings/${id}`);
