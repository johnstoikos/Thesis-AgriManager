import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CheckCircle2, LandPlot, Sprout, UsersRound } from "lucide-react";
import api from "../api/axios";
import { EmptyState, ErrorState, PageHeader, SectionCard, SkeletonLines, StatCard, Surface } from "./ui";

const COLORS = ["#0891b2", "#16a34a", "#f59e0b", "#e11d48", "#7c3aed", "#0f766e", "#ea580c", "#2563eb"];

const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));

const formatMonth = (value) => {
  if (!value) return "";
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("el-GR", { month: "short", year: "2-digit" });
};

export default function AdminDashboard({ focus }) {
  const isCropsView = focus === "crops";
  const [overview, setOverview] = useState(null);
  const [cropDistribution, setCropDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isCropsView) {
          const cropsResponse = await api.get("/api/admin/stats/crops-dist");
          if (!isMounted) return;
          setCropDistribution(Array.isArray(cropsResponse.data) ? cropsResponse.data : []);
          return;
        }

        const overviewResponse = await api.get("/api/admin/stats/overview");
        if (!isMounted) return;
        setOverview(overviewResponse.data || {});
      } catch (err) {
        console.error("Σφάλμα φόρτωσης admin στατιστικών:", err);
        if (isMounted) setError("Δεν ήταν δυνατή η φόρτωση των admin στατιστικών.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdminStats();

    return () => {
      isMounted = false;
    };
  }, [isCropsView]);

  const chartData = useMemo(
    () =>
      cropDistribution.map((item) => ({
        name: item.cropType,
        value: Number(item.totalAcres || 0),
      })),
    [cropDistribution]
  );

  const activityData = useMemo(
    () =>
      (overview?.monthlyActivity || []).map((item) => ({
        month: item.month,
        label: formatMonth(item.month),
        completedTasksCount: Number(item.completedTasksCount || 0),
      })),
    [overview]
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title={isCropsView ? "Στατιστικά Καλλιεργειών" : "Επισκόπηση Πλατφόρμας"}
          description={isCropsView ? "Φόρτωση κατανομής καλλιεργειών." : "Φόρτωση system-level metrics της εφαρμογής."}
        />
        <Surface className="p-6">
          <SkeletonLines lines={6} />
        </Surface>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <ErrorState title="Σφάλμα Admin Dashboard" description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
      {isCropsView ? (
        <SectionCard
          title="Στατιστικά Καλλιεργειών"
          description="Συγκεντρωτική κατανομή στρεμμάτων ανά τύπο καλλιέργειας για Recharts Pie Chart."
          side={
            <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/20">
              <Sprout className="h-4 w-4" />
              {chartData.length} τύποι
            </div>
          }
        >
          {chartData.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="Δεν υπάρχουν ακόμα δεδομένα καλλιεργειών"
              description="Το γράφημα θα εμφανιστεί όταν οι αγρότες καταχωρήσουν καλλιέργειες σε χωράφια."
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
              <div className="h-[380px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={132}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${formatNumber(percent * 100, 1)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${formatNumber(value, 2)} στρ.`, "Έκταση"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgb(226 232 240)",
                        fontWeight: 700,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {chartData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{item.name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-black text-slate-600 dark:text-slate-300">
                      {formatNumber(item.value, 2)} στρ.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      ) : (
        <>
          <PageHeader
            eyebrow="ADMIN MODULE"
            title="Επισκόπηση Πλατφόρμας"
            description="System-level εικόνα της εφαρμογής: χρήστες, χωράφια, εργασίες και μηνιαία δραστηριότητα."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={UsersRound}
              title="Συνολικοί Χρήστες"
              value={formatNumber(overview?.totalFarmers)}
              tone="sky"
              helper="Όλοι οι εγγεγραμμένοι λογαριασμοί"
            />
            <StatCard
              icon={LandPlot}
              title="Συνολικά Χωράφια"
              value={formatNumber(overview?.totalFields)}
              tone="emerald"
              helper="Χωράφια που υπάρχουν στην πλατφόρμα"
            />
            <StatCard
              icon={CheckCircle2}
              title="Συνολικές Εργασίες"
              value={formatNumber(overview?.totalTasks)}
              tone="amber"
              helper="Όλες οι καταχωρημένες εργασίες"
            />
          </div>

          <SectionCard
            title="Δραστηριότητα Πλατφόρμας"
            description="Ολοκληρωμένες εργασίες ανά μήνα από όλους τους χρήστες."
            side={
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                <Activity className="h-4 w-4" />
                {activityData.length} μήνες
              </div>
            }
          >
            {activityData.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Δεν υπάρχει ακόμα μηνιαία δραστηριότητα"
                description="Το γράφημα θα εμφανιστεί όταν υπάρξουν ολοκληρωμένες εργασίες με ημερομηνία."
              />
            ) : (
              <div className="h-[360px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="platformActivityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${formatNumber(value)} εργασίες`, "Ολοκληρώθηκαν"]}
                      labelFormatter={(_, payload) => formatMonth(payload?.[0]?.payload?.month)}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgb(226 232 240)",
                        fontWeight: 700,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completedTasksCount"
                      stroke="#0891b2"
                      strokeWidth={3}
                      fill="url(#platformActivityGradient)"
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
