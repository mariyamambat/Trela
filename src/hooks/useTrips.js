import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import * as svc from "../services/tripsService";

export const useTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    svc.getTrips(user.uid).then((data) => {
      setTrips(data);
      setLoading(false);
    });
  }, [user]);

  const createTrip = useCallback(
    async (data) => {
      const ref = await svc.addTrip(user.uid, data);
      setTrips((prev) => [{ id: ref.id, ...data }, ...prev]);
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

  return { trips: sortedTrips, loading, createTrip, removeTrip };
};
