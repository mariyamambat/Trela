import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import SavedTrips from "./pages/SavedTrips";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/saved-trips" element={<SavedTrips />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
