import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import * as svc from "../services/tripsService";

export const useTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const loading = user === undefined || (Boolean(user) && loadedUserId !== user.uid);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) return;
    if (loadedUserId === user.uid) return;

    svc
      .getTrips(user.uid)
      .then((data) => {
        setTrips(data);
      })
      .catch((err) => {
        console.error("Failed to load trips:", err);
        setError(err?.message || "Could not load trips.");
        setTrips([]);
      })
      .finally(() => {
        setLoadedUserId(user.uid);
      });
  }, [user, loadedUserId]);

  const createTrip = useCallback(
    async (data) => {
      if (!user?.uid) throw new Error("You are not signed in.");
      setCreating(true);
      setError("");
      try {
        const ref = await svc.addTrip(user.uid, data);
        setTrips((prev) => [{ id: ref.id, ...data }, ...prev]);
      } catch (err) {
        const message = err?.message || "Failed to create trip.";
        setError(message);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [user],
  );

  const removeTrip = useCallback(
    async (tripId) => {
      await svc.deleteTrip(user.uid, tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    },
    [user],
  );

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    [trips],
  );

  return { trips: sortedTrips, loading, error, creating, createTrip, removeTrip };
};
