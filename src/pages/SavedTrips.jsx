import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { getSavedTrips } from "../api/savedTrips";

const USERNAME_STORAGE_KEY = "trelaSignedInUsername";
const LEGACY_USERNAME_STORAGE_KEY = "treloSignedInUsername";

const SavedTrips = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setTrips([]);
        setListLoading(false);
        return;
      }
      setListLoading(true);
      const data = await getSavedTrips(firebaseUser.uid);
      setTrips(data);
      setListLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(USERNAME_STORAGE_KEY);
      localStorage.removeItem(LEGACY_USERNAME_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const formatCreated = (trip) => {
    const ts = trip.createdAt;
    if (ts?.toDate) {
      return ts.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return "";
  };

  return (
    <div className="home-page min-h-screen text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back to planner
          </Link>
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

        <header>
          <span className="eyebrow-pill">Your library</span>
          <h1 className="hero-title mt-4 text-left">Saved trips</h1>
          <p className="hero-subtitle mt-3 text-left max-w-xl">
            Trips you saved from Trela AI appear here. Open the planner to generate a new one.
          </p>
        </header>

        {authLoading && <p className="text-sm text-slate-300">Loading…</p>}

        {!authLoading && !user && (
          <article className="glass-card">
            <p className="text-sm text-slate-200">
              Sign in from the home page to see your saved trips.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Go to planner
            </Link>
          </article>
        )}

        {!authLoading && user && listLoading && <p className="text-sm text-slate-300">Loading trips…</p>}

        {!authLoading && user && !listLoading && trips.length === 0 && (
          <article className="glass-card">
            <p className="empty-copy">No saved trips yet. Plan a trip on the home page and tap Save Trip.</p>
            <Link to="/" className="inline-block mt-4 text-sm text-orange-300 hover:text-orange-200">
              ← Back to planner
            </Link>
          </article>
        )}

        {!authLoading && user && !listLoading && trips.length > 0 && (
          <ul className="space-y-4">
            {trips.map((trip) => (
              <li key={trip.id}>
                <article className="glass-card">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {trip.startingLocation} → {trip.destination}
                      </p>
                      <p className="text-xs text-orange-300/90 mt-1">{trip.days} days</p>
                    </div>
                    {formatCreated(trip) && (
                      <p className="text-xs text-slate-400 shrink-0">{formatCreated(trip)}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    {trip.tripPlan?.tripOverview?.summary || "Saved itinerary — open planner to build a similar trip."}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default SavedTrips;
