import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrips } from "../hooks/useTrips";
import { useTrip } from "../context/TripContext";

const Dashboard = () => {
  const { trips, loading, error, creating, createTrip, removeTrip } = useTrips();
  const { setActiveTrip } = useTrip();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    totalBudget: "",
    currency: "INR",
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      await createTrip(form);
      setShowForm(false);
      setForm({
        title: "",
        destination: "",
        startDate: "",
        endDate: "",
        totalBudget: "",
        currency: "INR",
      });
    } catch (err) {
      const message = err?.message || "Could not create trip. Please try again.";
      setCreateError(message);
    }
  };

  const openTrip = (trip) => {
    setActiveTrip(trip);
    navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Trips</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + New Trip
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
            placeholder="Trip title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
            placeholder="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            required
          />
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
          <input
            type="number"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Total budget"
            value={form.totalBudget}
            onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
            required
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            <option>INR</option>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Trip"}
          </button>
          {createError && <p className="col-span-2 text-sm text-red-500">{createError}</p>}
        </form>
      )}

      {error && !showForm && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading trips...</p>
      ) : trips.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🗺</p>
          <p className="text-sm">No trips planned yet !</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-indigo-300 transition cursor-pointer"
              onClick={() => openTrip(trip)}
            >
              <div>
                <h2 className="font-medium text-gray-800">{trip.title}</h2>
                <p className="text-sm text-gray-500">
                  {trip.destination} · {trip.startDate} → {trip.endDate}
                </p>
                <p className="text-sm text-indigo-600 font-medium mt-1">
                  Budget: {trip.currency} {Number(trip.totalBudget).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTrip(trip.id);
                }}
                className="text-red-400 hover:text-red-600 text-sm ml-4"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
