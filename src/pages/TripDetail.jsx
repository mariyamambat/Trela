import { useEffect } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { getTrip } from "../services/tripsService";

const TripDetail = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { activeTrip, setActiveTrip } = useTrip();

  useEffect(() => {
    if (!user?.uid || !tripId) return;
    let cancelled = false;
    getTrip(user.uid, tripId).then((trip) => {
      if (cancelled) return;
      setActiveTrip(trip);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, tripId, setActiveTrip]);

  const tabs = [
    { label: "Itinerary", path: "itinerary" },
    { label: "Budget", path: "budget" },
    { label: "Documents", path: "documents" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{activeTrip?.title || "Trip"}</h1>
        <p className="text-sm text-gray-500">
          {activeTrip?.destination} · {activeTrip?.startDate} → {activeTrip?.endDate}
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={`/trip/${tripId}/${tab.path}`}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 transition ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
};

export default TripDetail;
