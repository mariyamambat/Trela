import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { useItinerary } from "../hooks/useItinerary";
import { generateItinerary } from "../services/aiService";

const Itinerary = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { activeTrip } = useTrip();
  const { days, loading, addDay, updateDay, removeDay } = useItinerary(user?.uid, tripId);
  const [newDay, setNewDay] = useState({ date: "", label: "", activities: [] });
  const [activityInputs, setActivityInputs] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAddDay = async (e) => {
    e.preventDefault();
    await addDay({ ...newDay, activities: [] });
    setNewDay({ date: "", label: "", activities: [] });
  };

  const handleAddActivity = async (dayId, currentActivities) => {
    const input = activityInputs[dayId] || { time: "", title: "", location: "", notes: "" };
    if (!input.title) return;
    const updated = [...(currentActivities || []), input];
    await updateDay(dayId, { activities: updated });
    setActivityInputs((prev) => ({ ...prev, [dayId]: { time: "", title: "", location: "", notes: "" } }));
  };

  const handleRemoveActivity = async (dayId, currentActivities, idx) => {
    const updated = currentActivities.filter((_, i) => i !== idx);
    await updateDay(dayId, { activities: updated });
  };

  const handleGenerateAI = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey.includes("your-gemini-api-key-here")) {
      setAiError("Set VITE_GEMINI_API_KEY in .env (Google AI Studio), then restart npm run dev.");
      return;
    }
    if (!activeTrip?.destination) {
      setAiError("Trip details are still loading. Wait a moment, or open this trip from My Trips.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      // Calculate number of days from trip dates
      const start = new Date(activeTrip.startDate);
      const end = new Date(activeTrip.endDate);
      const numDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

      const generated = await generateItinerary(
        activeTrip.destination,
        numDays,
        activeTrip.currency
      );

      // Save each generated day to Firestore
      for (const day of generated) {
        await addDay(day);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setAiError(msg ? `Could not generate: ${msg}` : "Failed to generate itinerary. Try again.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading itinerary...</p>;

  return (
    <div className="space-y-6">
      {/* AI Generate Button */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-indigo-800 text-sm">AI Itinerary Generator</h2>
            <p className="text-xs text-indigo-500 mt-1">
              Auto-generate a full itinerary for {activeTrip?.destination || "your destination"} using Google Gemini
            </p>
          </div>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {aiLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating...
              </>
            ) : (
              "✨ Generate with AI"
            )}
          </button>
        </div>
        {aiError && <p className="text-red-500 text-xs mt-2">{aiError}</p>}
      </div>

      {/* Manual Add Day Form */}
      <form onSubmit={handleAddDay} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-3 flex-wrap">
        <input
          type="date"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={newDay.date}
          onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
          required
        />
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
          placeholder='Day label e.g. "Day 1 – Paris"'
          value={newDay.label}
          onChange={(e) => setNewDay({ ...newDay, label: e.target.value })}
          required
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Add Day
        </button>
      </form>

      {days.length === 0 && !aiLoading && (
        <p className="text-sm text-gray-400 text-center py-8">No days yet — generate with AI or add manually above.</p>
      )}

      {days.map((day) => (
        <div key={day.id} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium text-gray-800">{day.label}</h2>
              <p className="text-xs text-gray-400">{day.date}</p>
            </div>
            <button onClick={() => removeDay(day.id)} className="text-red-400 hover:text-red-600 text-sm">
              Remove day
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {(day.activities || []).map((act, idx) => (
              <div key={idx} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                <div>
                  <span className="text-indigo-600 font-medium mr-2">{act.time}</span>
                  <span className="font-medium text-gray-800">{act.title}</span>
                  {act.location && <span className="text-gray-400 ml-2">📍 {act.location}</span>}
                  {act.notes && <p className="text-gray-400 text-xs mt-1">{act.notes}</p>}
                </div>
                <button onClick={() => handleRemoveActivity(day.id, day.activities, idx)} className="text-red-400 hover:text-red-600 ml-4 text-xs">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Time (e.g. 9:00 AM)"
              value={activityInputs[day.id]?.time || ""}
              onChange={(e) => setActivityInputs((prev) => ({ ...prev, [day.id]: { ...prev[day.id], time: e.target.value } }))}
            />
            <input
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Activity title"
              value={activityInputs[day.id]?.title || ""}
              onChange={(e) => setActivityInputs((prev) => ({ ...prev, [day.id]: { ...prev[day.id], title: e.target.value } }))}
            />
            <input
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Location (optional)"
              value={activityInputs[day.id]?.location || ""}
              onChange={(e) => setActivityInputs((prev) => ({ ...prev, [day.id]: { ...prev[day.id], location: e.target.value } }))}
            />
            <input
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Notes (optional)"
              value={activityInputs[day.id]?.notes || ""}
              onChange={(e) => setActivityInputs((prev) => ({ ...prev, [day.id]: { ...prev[day.id], notes: e.target.value } }))}
            />
            <button
              onClick={() => handleAddActivity(day.id, day.activities)}
              className="col-span-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition"
            >
              + Add activity
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Itinerary;
