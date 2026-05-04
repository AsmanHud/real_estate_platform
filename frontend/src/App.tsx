import { Routes, Route } from "react-router-dom";
import ListingsPage from "./ListingsPage";
import ListingDetailsPage from "./ListingDetailsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ListingsPage />} />
      <Route path="/listing/:id" element={<ListingDetailsPage />} />
    </Routes>
  );
}