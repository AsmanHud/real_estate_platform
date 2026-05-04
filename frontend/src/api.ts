import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:3001/api",
});

export const getListings = (page: number, limit: number) =>
    api.get(`/listings?page=${page}&limit=${limit}`);
export const getListing = (id: number) => api.get(`/listings/${id}`);