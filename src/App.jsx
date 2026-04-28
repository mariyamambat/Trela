import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { generateItinerary } from "./api/ai";
import { getPlaces, getTripOverview, searchCities } from "./api/geoapify";
import { getWeather, getWeatherForecast } from "./api/weather";
import { auth } from "./services/firebase";
import { saveTrip } from "./api/savedTrips";
import { clearStoredUsername, getStoredUsername, USERNAME_STORAGE_KEY } from "./utils/authStorage";

const App = () => {
  const [startingLocation, setStartingLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [places, setPlaces] = useState([]);
  const [overview, setOverview] = useState(null);
  const [uiError, setUiError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [signedInUsername, setSignedInUsername] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [showCityOptions, setShowCityOptions] = useState(false);
  const searchTimerRef = useRef(null);

  /** After a generation run, allow save even if every API returned empty (still persist form + whatever we got). */
  const canSaveTrip = useMemo(
    () =>
      Boolean(
        user &&
          hasSearched &&
          startingLocation.trim() &&
          destination.trim() &&
          Number(days) > 0,
      ),
    [user, hasSearched, startingLocation, destination, days],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      setShowAuthModal(!firebaseUser);
      if (firebaseUser) {
        const storedUsername = getStoredUsername();
        setSignedInUsername(storedUsername || firebaseUser.displayName || firebaseUser.email || "user");
      } else {
        setSignedInUsername("");
      }
    });
    return unsubscribe;
  }, []);

  const handleDestinationChange = (value) => {
    setDestination(value);
    setUiError("");

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setCityOptions([]);
      setShowCityOptions(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      const results = await searchCities(trimmed);
      setCityOptions(results);
      setShowCityOptions(results.length > 0);
    }, 250);
  };

  const handleDestinationSelect = (option) => {
    setDestination(option.name || option.label);
    setCityOptions([]);
    setShowCityOptions(false);
  };

  const handlePlanTrip = async () => {
    if (!user) {
      setShowAuthModal(true);
      setUiError("Please log in to generate your trip.");
      return;
    }

    const trimmedStart = startingLocation.trim();
    const trimmedDestination = destination.trim();
    const numberOfDays = Number(days);

    if (!trimmedStart || !trimmedDestination || !numberOfDays) {
      setUiError("Please fill starting location, destination and number of days.");
      return;
    }

    setHasSearched(true);
    setLoading(true);
    setUiError("");

    try {
      const [placesData, currentWeather, forecastData, overviewData, planData] = await Promise.all([
        getPlaces(trimmedDestination),
        getWeather(trimmedDestination),
        getWeatherForecast(trimmedDestination),
        getTripOverview(trimmedStart, trimmedDestination),
        generateItinerary({
          startingLocation: trimmedStart,
          destination: trimmedDestination,
          days: numberOfDays,
        }),
      ]);

      setSaveMessage("");
      setPlaces(placesData);
      setWeather(currentWeather);
      setForecast(forecastData);
      setOverview(overviewData);
      setTripPlan(planData);

      if (
        !placesData.length &&
        !currentWeather &&
        !forecastData.length &&
        !planData?.itinerary?.length
      ) {
        setUiError("No travel data was returned. Please verify your API keys and try again.");
      } else if (planData?._error) {
        setUiError(`Itinerary incomplete: ${planData._error}`);
      }
    } catch (error) {
      console.error("handlePlanTrip failed:", error);
      setUiError(error?.message || "Something went wrong while planning your trip.");
      setPlaces([]);
      setWeather(null);
      setForecast([]);
      setOverview(null);
      setTripPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = Boolean(startingLocation.trim() && destination.trim() && Number(days) > 0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearStoredUsername();
      setSignedInUsername("");
      setHasSearched(false);
      setTripPlan(null);
      setWeather(null);
      setForecast([]);
      setPlaces([]);
      setOverview(null);
      setSaveMessage("");
      setShowAuthModal(true);
    } catch (error) {
      console.error("Logout failed:", error);
      setUiError("Could not log out. Please try again.");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      if (!authEmail.trim() || !authPassword.trim()) {
        throw new Error("Enter both email and password.");
      }

      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        const storedUsername = getStoredUsername();
        setSignedInUsername(storedUsername || authEmail.trim().split("@")[0] || "user");
      } else {
        if (!authUsername.trim()) {
          throw new Error("Enter username to sign up.");
        }
        await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        localStorage.setItem(USERNAME_STORAGE_KEY, authUsername.trim());
        setSignedInUsername(authUsername.trim());
      }

      setShowAuthModal(false);
      setAuthUsername("");
      setAuthPassword("");
      setUiError("");
    } catch (error) {
      console.error("Auth failed:", error);
      setAuthError(error?.message || "Authentication failed.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!canSaveTrip) return;
    setSavingTrip(true);
    setSaveMessage("");
    try {
      await saveTrip(user.uid, {
        startingLocation: startingLocation.trim(),
        destination: destination.trim(),
        days: Number(days),
        overview,
        tripPlan,
        weather,
        forecast,
        places,
      });
      setSaveMessage("Trip saved successfully.");
    } catch (error) {
      console.error("handleSaveTrip failed:", error);
      const hint =
        error?.code === "permission-denied"
          ? " Check Firestore rules allow writes to users/{uid}/trips."
          : "";
      setSaveMessage(`Failed to save trip.${hint}`);
    } finally {
      setSavingTrip(false);
    }
  };

  return (
    <div className="home-page min-h-screen text-slate-100">
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <div className="flex items-center justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {user && (
              <Link
                to="/saved-trips"
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                Saved trips
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                Log out
              </button>
            )}
          </div>
        </div>

        <section className="hero-shell relative overflow-hidden">
          <div className="hero-pattern" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <span className="eyebrow-pill">AI-Powered Travel Planning</span>
            <h1 className="hero-title mt-6">
              Planning now made easy
              <br />
              with <span className="hero-gradient-text">Trela AI</span>
            </h1>
            <p className="hero-subtitle mt-5">
              Get a complete day-by-day itinerary with places, food, and weather insights -
              including practical suggestions for each stop.
            </p>

            <div className="mt-7 flex flex-col gap-3 max-w-3xl mx-auto">
              <input
                value={startingLocation}
                onChange={(e) => setStartingLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePlanTrip();
                  }
                }}
                placeholder="Starting location"
                className="hero-input"
              />
              <div className="flex-1 relative">
                <input
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => setShowCityOptions(cityOptions.length > 0)}
                  onBlur={() => {
                    setTimeout(() => setShowCityOptions(false), 100);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePlanTrip();
                    }
                  }}
                  placeholder="Destination"
                  className="hero-input"
                />
                {showCityOptions && (
                  <div className="suggestions-dropdown">
                    {cityOptions.map((option, idx) => (
                      <button
                        key={`${option.label}-${idx}`}
                        type="button"
                        onMouseDown={() => handleDestinationSelect(option)}
                        className="suggestion-item"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePlanTrip();
                  }
                }}
                placeholder="No. of days"
                className="hero-input"
              />
              <button onClick={handlePlanTrip} disabled={loading || !canGenerate} className="hero-cta-button">
                {loading ? "Generating..." : "Generate My Trip"}
              </button>
            </div>

            <p className="helper-copy mt-3">
              Include starting location, destination and days.
            </p>

            <p className="text-xs text-slate-300/80 mt-2">
              {authLoading
                ? "Checking account..."
                : user
                  ? `Signed in as ${signedInUsername || "user"}`
                  : "You are not signed in"}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {uiError && <p className="text-sm text-rose-300">{uiError}</p>}
              {canSaveTrip && (
                <button
                  type="button"
                  onClick={handleSaveTrip}
                  disabled={savingTrip}
                  className="trip-chip disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTrip ? "Saving…" : "Save trip"}
                </button>
              )}
              {saveMessage && (
                <p
                  className={`text-sm ${saveMessage.startsWith("Failed") ? "text-rose-300" : "text-emerald-300"}`}
                >
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </section>

        {hasSearched && (
          <section className="result-grid">
          {canSaveTrip && (
            <article className="glass-card md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="result-title mb-1">Save this trip</h2>
                  <p className="text-sm text-slate-300">
                    Store this plan to your account. View it anytime from{" "}
                    <Link to="/saved-trips" className="text-orange-300 hover:text-orange-200 underline-offset-2 hover:underline">
                      Saved trips
                    </Link>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveTrip}
                  disabled={savingTrip}
                  className="trip-chip shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTrip ? "Saving…" : "Save trip"}
                </button>
              </div>
              {saveMessage && (
                <p
                  className={`mt-4 text-sm ${saveMessage.startsWith("Failed") ? "text-rose-300" : "text-emerald-300"}`}
                >
                  {saveMessage}
                </p>
              )}
            </article>
          )}

          <article className="glass-card md:col-span-2">
            <h2 className="result-title">Trip Overview</h2>
            <p className="text-sm text-slate-200">
              {tripPlan?.tripOverview?.summary || "Overview will appear after generation."}
            </p>
            <div className="mt-3 grid sm:grid-cols-3 gap-2 text-sm text-slate-200">
              <p>Distance: {typeof overview?.distanceKm === "number" ? `${overview.distanceKm} km` : "N/A"}</p>
              <p>Travel time: {typeof overview?.travelHours === "number" ? `${overview.travelHours} hrs` : "N/A"}</p>
              <p>Best transport: {overview?.bestTransport || "N/A"}</p>
            </div>
          </article>

          <article className="glass-card">
            <h2 className="result-title">AI Itinerary</h2>
            {!tripPlan?.itinerary?.length && !loading && <p className="empty-copy">No itinerary yet. Generate a trip to see details.</p>}
            {tripPlan?.itinerary?.length > 0 && (
              <div className="space-y-3 text-sm text-slate-200 leading-6">
                {tripPlan.itinerary.map((dayItem, idx) => (
                  <div key={`day-${idx}`} className="place-card">
                    <p className="font-semibold text-white">Day {dayItem.day || idx + 1}</p>
                    <p><span className="text-orange-300">Morning:</span> {dayItem.morning}</p>
                    <p><span className="text-orange-300">Afternoon:</span> {dayItem.afternoon}</p>
                    <p><span className="text-orange-300">Evening:</span> {dayItem.evening}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="glass-card">
            <h2 className="result-title">Weather Forecast</h2>
            {!weather && !loading && <p className="empty-copy">No weather data yet.</p>}
            {weather && (
              <div className="space-y-2 text-sm text-slate-200">
                <p>
                  Current temperature:{" "}
                  {typeof weather.temperature === "number" ? `${Math.round(weather.temperature)}°C` : "N/A"}
                </p>
                <p className="capitalize">Condition: {weather.description}</p>
                {forecast.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs">
                    {forecast.map((item) => (
                      <p key={item.date}>
                        {item.date}:{" "}
                        {typeof item.temperature === "number" ? `${Math.round(item.temperature)}°C` : "N/A"}{" "}
                        ({item.description})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="glass-card lg:col-span-2">
            <h2 className="result-title">Top Attractions</h2>
            {!places.length && !loading && <p className="empty-copy">No places found yet.</p>}

            {places.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {places.map((place, idx) => (
                  <div key={`${place.name}-${idx}`} className="place-card">
                    <h3 className="font-medium text-sm text-white">{place.name}</h3>
                    <p className="text-xs text-slate-300 mt-1">{place.address}</p>
                    {place.rating && <p className="text-xs text-slate-400 mt-1">Rating: {place.rating}</p>}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="glass-card md:col-span-2">
            <h2 className="result-title">Budget Estimate</h2>
            <div className="grid sm:grid-cols-3 gap-2 text-sm text-slate-200">
              <p>Stay: {tripPlan?.budgetEstimate?.stay || "N/A"}</p>
              <p>Food: {tripPlan?.budgetEstimate?.food || "N/A"}</p>
              <p>Travel: {tripPlan?.budgetEstimate?.travel || "N/A"}</p>
            </div>
          </article>

          </section>
        )}
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              {authMode === "login" ? "Log in" : "Sign up"}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              {authMode === "login"
                ? "Log in using your mail id and password."
                : "Create an account with mail id and password."}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-3">
              {authMode === "signup" && (
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                />
              )}
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              />

              {authError && <p className="text-sm text-rose-300">{authError}</p>}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authSubmitting
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Log in"
                    : "Sign up"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
                setAuthError("");
                setAuthUsername("");
              }}
              className="mt-4 text-sm text-orange-300 hover:text-orange-200"
            >
              {authMode === "login" ? "Not signed in? Sign up" : "Already signed in? Log in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
