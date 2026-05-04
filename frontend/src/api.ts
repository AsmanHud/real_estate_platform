import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:3001/api",
});

export const getListings = () => api.get("/listings");
export const getListing = (id: number) => api.get(`/listings/${id}`);