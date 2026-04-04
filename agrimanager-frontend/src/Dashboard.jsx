import { useState, useEffect } from "react";
import api from "./api/axios";
import MapComponent from "./MapComponent";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/stats/dashboard")
      .then(response => {
        setStats(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Σφάλμα:", err);
        setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων.");
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <p className="text-green-600 font-bold animate-pulse text-xl">Φόρτωση δεδομένων από το χωράφι...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
       

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Συνολικά Χωράφια" value={stats?.totalFields} color="border-green-500" />
          <StatCard title="Ενεργές Καλλιέργειες" value={stats?.activeCrops} color="border-blue-500" />
          <StatCard title="Εκκρεμείς Εργασίες" value={stats?.pendingTasks} color="border-orange-500" />
        </div>

        <MapComponent />
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-b-4 ${color}`}>
      <p className="text-gray-400 uppercase text-xs font-bold tracking-wider">{title}</p>
      <p className="text-4xl font-black text-gray-800 mt-2">{value || 0}</p>
    </div>
  );
}