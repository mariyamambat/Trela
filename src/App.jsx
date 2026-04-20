import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TripProvider } from "./context/TripContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Navbar from "./components/layout/Navbar";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const Budget = lazy(() => import("./pages/Budget"));
const Documents = lazy(() => import("./pages/Documents"));

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TripProvider>
        <Navbar />
        <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:tripId"
              element={
                <ProtectedRoute>
                  <TripDetail />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="itinerary" replace />} />
              <Route path="itinerary" element={<Itinerary />} />
              <Route path="budget" element={<Budget />} />
              <Route path="documents" element={<Documents />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </TripProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
