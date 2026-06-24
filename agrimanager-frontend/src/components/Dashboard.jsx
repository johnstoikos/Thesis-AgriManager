import { useEffect, useState } from "react";
import { CircleDollarSign, LayoutGrid, MapPinned, Sprout, TrendingDown } from "lucide-react";
import api from "../api/axios";
import { useAppPreferences } from "../i18n";
import MapComponent from "./MapComponent";
import { PageHeader, SectionCard, StatCard, Surface } from "./ui";

const EMPTY_FINANCIAL_STATS = {
  totalRevenue: 0,
  totalExpenses: 0,
};

// Μορφοποιεί τιμή.
const formatCurrency = (value) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

// Εμφανίζει στοιχείο διεπαφής.
export default function Dashboard() {
  const { t } = useAppPreferences();
  const [stats, setStats] = useState(null);
  const [financialStats, setFinancialStats] = useState(EMPTY_FINANCIAL_STATS);
  const [dashboardFields, setDashboardFields] = useState([]);
  const [loading, setLoading] = useState(true);
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
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Σφάλμα:", err);
        setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Φορτώνει δεδομένα.
    const fetchMapFields = async () => {
      try {
        const fieldsRes = await api.get("/api/fields");
        const fields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        if (!isMounted) return;
        setDashboardFields(fields);
      } catch (err) {
        console.warn("Αδυναμία φόρτωσης χωραφιών χάρτη:", err);
      }
    };

    fetchMapFields();

    return () => {
      isMounted = false;
    };
  }, []);

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

        <SectionCard title={t.dashboard.mapTitle} description={t.dashboard.mapDescription}>
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <MapComponent dashboardFields={dashboardFields} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
