import { useState, useEffect, useCallback, useMemo } from "react";
import * as svc from "../services/tripsService";

export const useBudget = (userId, tripId) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !tripId) return;
    svc.getExpenses(userId, tripId).then((data) => {
      setExpenses(data);
      setLoading(false);
    });
  }, [userId, tripId]);

  const addExpense = useCallback(
    async (data) => {
      const ref = await svc.addExpense(userId, tripId, data);
      setExpenses((prev) => [{ id: ref.id, ...data }, ...prev]);
    },
    [userId, tripId],
  );

  const removeExpense = useCallback(
    async (id) => {
      await svc.deleteExpense(userId, tripId, id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    [userId, tripId],
  );

  const categoryTotals = useMemo(() => {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
  }, [expenses]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses],
  );

  return { expenses, loading, addExpense, removeExpense, categoryTotals, totalSpent };
};
