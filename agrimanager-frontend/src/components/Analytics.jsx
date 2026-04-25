import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";

const PIE_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#6366f1"];

function StatCard({ title, value, accentClass }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-black tracking-tight ${accentClass}`}>{value}</p>
    </div>
  );
}

export default function Analytics() {
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError("");
      try {
        const fieldsRes = await api.get("/api/fields");
        const availableFields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        setFields(availableFields);

        const cropResults = await Promise.allSettled(
          availableFields.map((field) => api.get(`/api/crops/field/${field.id}`))
        );

        const allCrops = [];
        cropResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const fieldCrops = Array.isArray(result.value?.data) ? result.value.data : [];
          allCrops.push(...fieldCrops);
        });
        setCrops(allCrops);

        const taskResults = await Promise.allSettled(allCrops.map((crop) => api.get(`/api/tasks/crop/${crop.id}`)));
        const allTasks = [];
        taskResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const cropTasks = Array.isArray(result.value?.data) ? result.value.data : [];
          allTasks.push(...cropTasks);
        });
        setTasks(allTasks);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης analytics:", err);
        setError("Αποτυχία φόρτωσης στατιστικών. Προσπαθήστε ξανά.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const cropTypeById = useMemo(() => {
    const lookup = {};
    crops.forEach((crop) => {
      lookup[crop.id] = crop.type || "Άγνωστος τύπος";
    });
    return lookup;
  }, [crops]);

  const stats = useMemo(() => {
    const totalArea = crops.reduce((sum, crop) => sum + Number(crop.zoneArea || 0), 0);
    const pendingTasks = tasks.filter((task) => task.status === "PENDING").length;
    const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
    return {
      totalArea,
      totalCrops: crops.length,
      pendingTasks,
      completedTasks,
      totalFields: fields.length,
    };
  }, [crops, tasks, fields.length]);

  const cropsByAreaData = useMemo(() => {
    const grouped = crops.reduce((acc, crop) => {
      const type = crop.type || "Άγνωστος τύπος";
      const area = Number(crop.zoneArea || 0);
      acc[type] = (acc[type] || 0) + area;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([type, area]) => ({ type, area: Number(area.toFixed(2)) }))
      .sort((a, b) => b.area - a.area);
  }, [crops]);

  const taskStatusByCropTypeData = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      const cropType = cropTypeById[task.cropId] || "Άγνωστος τύπος";
      if (!grouped[cropType]) {
        grouped[cropType] = { cropType, PENDING: 0, COMPLETED: 0 };
      }
      if (task.status === "PENDING") grouped[cropType].PENDING += 1;
      if (task.status === "COMPLETED") grouped[cropType].COMPLETED += 1;
    });

    return Object.values(grouped).sort((a, b) => a.cropType.localeCompare(b.cropType, "el"));
  }, [tasks, cropTypeById]);

  if (loading) {
    return <div className="text-center py-12 font-bold text-green-700">Φόρτωση στατιστικών...</div>;
  }

  if (error) {
    return <div className="text-center py-12 font-bold text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Analytics Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Επιχειρησιακή εικόνα καλλιεργειών και εργασιών για {stats.totalFields} χωράφια.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Συνολική Διαχειριζόμενη Έκταση" value={`${stats.totalArea.toFixed(2)} στρ.`} accentClass="text-green-700" />
        <StatCard title="Σύνολο Καλλιεργειών" value={stats.totalCrops} accentClass="text-sky-700" />
        <StatCard title="Εκκρεμείς Εργασίες" value={stats.pendingTasks} accentClass="text-amber-600" />
        <StatCard title="Ολοκληρωμένες Εργασίες" value={stats.completedTasks} accentClass="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-gray-900">Κατανομή Καλλιεργειών ανά Έκταση</h3>
          <p className="text-xs text-gray-500 mt-1">Ομαδοποίηση κατά τύπο καλλιέργειας (στρέμματα).</p>
          <div className="h-[340px] mt-4">
            {cropsByAreaData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Δεν υπάρχουν αρκετά δεδομένα καλλιεργειών.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cropsByAreaData}
                    dataKey="area"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {cropsByAreaData.map((entry, index) => (
                      <Cell key={`${entry.type}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} στρ.`, "Έκταση"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-gray-900">Επισκόπηση Κατάστασης Εργασιών</h3>
          <p className="text-xs text-gray-500 mt-1">Πλήθος εκκρεμών και ολοκληρωμένων εργασιών ανά τύπο καλλιέργειας.</p>
          <div className="h-[340px] mt-4">
            {taskStatusByCropTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Δεν υπάρχουν αρκετά δεδομένα εργασιών.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusByCropTypeData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="cropType" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                    formatter={(value, name) => [value, name === "PENDING" ? "ΕΚΚΡΕΜΕΙ" : "ΟΛΟΚΛΗΡΩΘΗΚΕ"]}
                  />
                  <Legend formatter={(value) => (value === "PENDING" ? "ΕΚΚΡΕΜΕΙ" : "ΟΛΟΚΛΗΡΩΘΗΚΕ")} />
                  <Bar dataKey="PENDING" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="COMPLETED" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
