import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CircleDollarSign, LayoutGrid, MapPinned, Sprout, TrendingDown } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/auth-context";
import { useAppPreferences } from "../i18n";
import MapComponent from "./MapComponent";
import { PageHeader, SectionCard, StatCard, Surface } from "./ui";

const EMPTY_FINANCIAL_STATS = {
  totalRevenue: 0,
  totalExpenses: 0,
  monthlyFinancials: [],
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatMonth = (month) => {
  const date = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString("el-GR", { month: "short", year: "2-digit" });
};

function persistAssistantContext({ fields, tasks, weather }) {
  try {
    window.localStorage.setItem(
      "aiAssistantContext",
      JSON.stringify({ fields, tasks, weather })
    );
  } catch (err) {
    console.warn("Αδυναμία αποθήκευσης context AI:", err);
  }
}

export default function Dashboard() {
  const { t } = useAppPreferences();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [financialStats, setFinancialStats] = useState(EMPTY_FINANCIAL_STATS);
  const [advisorContext, setAdvisorContext] = useState({
    weather: null,
    profile: user || {},
    fields: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [, setAdvisorLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/stats/dashboard"),
      api.get("/api/stats/farmer-dashboard"),
    ])
      .then(([dashboardResponse, financialResponse]) => {
        setStats(dashboardResponse.data);
        setFinancialStats({
          ...EMPTY_FINANCIAL_STATS,
          ...(financialResponse.data || {}),
          monthlyFinancials: Array.isArray(financialResponse.data?.monthlyFinancials)
            ? financialResponse.data.monthlyFinancials
            : [],
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Σφάλμα:", err);
        setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων.");
        setLoading(false);
      });
  }, []);

  const monthlyFinancialData = useMemo(
    () =>
      financialStats.monthlyFinancials.map((item) => ({
        month: item.month,
        label: formatMonth(item.month),
        expenses: Number(item.expenses || 0),
        revenue: Number(item.revenue || 0),
      })),
    [financialStats.monthlyFinancials]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchAdvisorContext = async () => {
      setAdvisorLoading(true);
      try {
        const fieldsRes = await api.get("/api/fields");
        const fields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];

        const [weatherResult, cropsResults] = await Promise.all([
          fields[0]?.id
            ? api.get(`/api/weather/field/${fields[0].id}`).catch(() => ({ data: null }))
            : Promise.resolve({ data: null }),
          Promise.allSettled(fields.map((field) => api.get(`/api/crops/field/${field.id}`))),
        ]);

        const crops = cropsResults.flatMap((result) =>
          result.status === "fulfilled" && Array.isArray(result.value?.data) ? result.value.data : []
        );

        const taskResults = await Promise.allSettled(crops.map((crop) => api.get(`/api/tasks/crop/${crop.id}`)));
        const tasks = taskResults.flatMap((result) =>
          result.status === "fulfilled" && Array.isArray(result.value?.data) ? result.value.data : []
        );

        if (!isMounted) return;
        const context = {
          weather: weatherResult.data,
          profile: user || {},
          fields,
          tasks,
        };
        setAdvisorContext(context);
        persistAssistantContext(context);
      } catch (err) {
        console.warn("Αδυναμία φόρτωσης δεδομένων Agri-Assistant:", err);
      } finally {
        if (isMounted) setAdvisorLoading(false);
      }
    };

    fetchAdvisorContext();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) return (
    <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
      <Surface className="flex min-h-[420px] items-center justify-center p-10">
        <p className="animate-pulse text-xl font-bold text-emerald-600 dark:text-emerald-300">Φόρτωση δεδομένων από το χωράφι...</p>
      </Surface>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 md:px-6">
      <PageHeader
        eyebrow={t.dashboard.eyebrow}
        title={t.dashboard.title}
        description={t.dashboard.description}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={MapPinned} title={t.dashboard.totalFields} value={stats?.totalFields || 0} tone="emerald" />
          <StatCard icon={Sprout} title={t.dashboard.activeCrops} value={stats?.activeCrops || 0} tone="sky" />
          <StatCard icon={LayoutGrid} title={t.dashboard.pendingTasks} value={stats?.pendingTasks || 0} tone="amber" />
          <StatCard icon={TrendingDown} title={t.dashboard.totalExpenses} value={formatCurrency(financialStats.totalExpenses)} tone="rose" />
          <StatCard icon={CircleDollarSign} title={t.dashboard.totalRevenue} value={formatCurrency(financialStats.totalRevenue)} tone="emerald" />
        </div>

        <SectionCard
          title={t.dashboard.financialChartTitle}
          description={t.dashboard.financialChartDescription}
        >
          {monthlyFinancialData.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              {t.dashboard.noFinancialData}
            </div>
          ) : (
            <div className="h-[360px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFinancialData} margin={{ top: 12, right: 18, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value).toLocaleString("el-GR")} €`} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip formatter={(value, name) => [formatCurrency(value), name]} contentStyle={{ borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 700 }} />
                  <Legend />
                  <Bar dataKey="expenses" name={t.dashboard.expensesSeries} fill="#dc2626" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="revenue" name={t.dashboard.revenueSeries} fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t.dashboard.mapTitle} description={t.dashboard.mapDescription}>
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <MapComponent dashboardFields={advisorContext.fields} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
