import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { useItinerary } from "../hooks/useItinerary";
import { generateItinerary } from "../services/aiService";
import { buildDirectionsUrl, getTopAttractions, getWeatherInsights } from "../services/travelDataService";

const Itinerary = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { activeTrip } = useTrip();
  const { days, loading, addDay, updateDay, removeDay } = useItinerary(user?.uid, tripId);
  const [newDay, setNewDay] = useState({ date: "", label: "", activities: [] });
  const [activityInputs, setActivityInputs] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [attractions, setAttractions] = useState([]);
  const [weather, setWeather] = useState(null);

  const loadTravelInsights = async () => {
    if (!activeTrip?.destination) return;
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const [places, weatherInfo] = await Promise.all([
        getTopAttractions(activeTrip.destination),
        getWeatherInsights(activeTrip.destination),
      ]);
      setAttractions(places);
      setWeather(weatherInfo);
    } catch (err) {
      console.error(err);
      setInsightsError("Could not load places/weather insights. Check API keys and billing setup.");
    } finally {
      setInsightsLoading(false);
    }
  };

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
      let places = attractions;
      let weatherInfo = weather;
      if (!places.length && !weatherInfo) {
        const fresh = await Promise.all([
          getTopAttractions(activeTrip.destination),
          getWeatherInsights(activeTrip.destination),
        ]);
        places = fresh[0];
        weatherInfo = fresh[1];
        setAttractions(places);
        setWeather(weatherInfo);
      }

      // Calculate number of days from trip dates
      const start = new Date(activeTrip.startDate);
      const end = new Date(activeTrip.endDate);
      const numDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

      const generated = await generateItinerary(
        activeTrip.destination,
        numDays,
        activeTrip.currency,
        {
          attractions: places,
          weatherSummary: weatherInfo
            ? `${weatherInfo.current?.description || "Unknown"}, ${weatherInfo.current?.tempC ?? "N/A"}C`
            : "",
          packingSummary: weatherInfo?.packingSuggestions?.join(", ") || "",
        }
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

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-800">Travel Intelligence</h3>
            <p className="text-xs text-gray-500">Places, routes and weather for smarter planning.</p>
          </div>
          <button
            onClick={loadTravelInsights}
            disabled={insightsLoading}
            className="text-xs bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-1.5 disabled:opacity-50"
          >
            {insightsLoading ? "Refreshing..." : "Refresh insights"}
          </button>
        </div>
        {insightsError && <p className="text-xs text-red-500">{insightsError}</p>}

        {weather && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium">
              Weather in {weather.locationLabel}: {weather.current?.description || "N/A"}{" "}
              {typeof weather.current?.tempC === "number" ? `(${Math.round(weather.current.tempC)}C)` : ""}
            </p>
            <p className="text-xs text-blue-600 mt-1">Best time to visit: {weather.bestTimeToVisit}</p>
            <p className="text-xs text-blue-600 mt-1">
              Packing suggestions: {(weather.packingSuggestions || []).join(", ")}
            </p>
          </div>
        )}

        {attractions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Top attractions</p>
            <div className="grid gap-2">
              {attractions.slice(0, 6).map((place) => (
                <div key={place.name} className="text-xs border border-gray-200 rounded-md px-3 py-2">
                  <p className="font-medium text-gray-800">
                    {place.name}
                    {typeof place.rating === "number" ? ` • ${place.rating.toFixed(1)}★` : ""}
                  </p>
                  {place.address && <p className="text-gray-500">{place.address}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
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
                  {(act.location || act.title) && (
                    <a
                      href={buildDirectionsUrl(activeTrip?.destination || "", act.location || act.title)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                    >
                      Open route in Maps
                    </a>
                  )}
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
