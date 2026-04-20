import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { useBudget } from "../hooks/useBudget";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORIES = ["Food", "Transport", "Accommodation", "Activities", "Shopping", "Other"];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const Budget = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { activeTrip } = useTrip();
  const { expenses, loading, addExpense, removeExpense, categoryTotals, totalSpent } = useBudget(
    user?.uid,
    tripId,
  );
  const [form, setForm] = useState({ amount: "", category: "Food", description: "", date: "" });

  const handleAdd = async (e) => {
    e.preventDefault();
    await addExpense(form);
    setForm({ amount: "", category: "Food", description: "", date: "" });
  };

  const remaining = Number(activeTrip?.totalBudget || 0) - totalSpent;
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  if (loading) return <p className="text-sm text-gray-400">Loading budget...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Budget</p>
          <p className="text-xl font-semibold text-gray-800">
            {activeTrip?.currency} {Number(activeTrip?.totalBudget || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Spent</p>
          <p className="text-xl font-semibold text-red-500">
            {activeTrip?.currency} {totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Remaining</p>
          <p className={`text-xl font-semibold ${remaining >= 0 ? "text-green-600" : "text-red-500"}`}>
            {activeTrip?.currency} {remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-700 mb-4 text-sm">Spending by category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `${activeTrip?.currency} ${val.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-3">
        <input
          type="number"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          type="date"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <button
          type="submit"
          className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Add Expense
        </button>
      </form>

      <div className="space-y-2">
        {expenses.map((exp) => (
          <div
            key={exp.id}
            className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{exp.description}</p>
              <p className="text-xs text-gray-400">
                {exp.category} · {exp.date}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-red-500">
                - {activeTrip?.currency} {Number(exp.amount).toLocaleString()}
              </span>
              <button onClick={() => removeExpense(exp.id)} className="text-red-400 hover:text-red-600 text-xs">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Budget;
