import { useState, useEffect, useCallback } from "react";
import * as svc from "../services/tripsService";

export const useItinerary = (userId, tripId) => {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !tripId) return;
    svc.getItinerary(userId, tripId).then((data) => {
      setDays(data);
      setLoading(false);
    });
  }, [userId, tripId]);

  const addDay = useCallback(
    async (dayData) => {
      const ref = await svc.addDay(userId, tripId, dayData);
      setDays((prev) => [...prev, { id: ref.id, ...dayData }]);
    },
    [userId, tripId],
  );

  const updateDay = useCallback(
    async (dayId, data) => {
      await svc.updateDay(userId, tripId, dayId, data);
      setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...data } : d)));
    },
    [userId, tripId],
  );

  const removeDay = useCallback(
    async (dayId) => {
      await svc.deleteDay(userId, tripId, dayId);
      setDays((prev) => prev.filter((d) => d.id !== dayId));
    },
    [userId, tripId],
  );

  return { days, loading, addDay, updateDay, removeDay };
};
