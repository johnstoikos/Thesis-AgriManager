import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CheckCircle2, LandPlot, Sprout, UsersRound } from "lucide-react";
import api from "../api/axios";
import { useAppPreferences } from "../i18n";
import { EmptyState, ErrorState, PageHeader, SectionCard, SkeletonLines, StatCard, Surface } from "./ui";

const COLORS = ["#0891b2", "#16a34a", "#f59e0b", "#e11d48", "#7c3aed", "#0f766e", "#ea580c", "#2563eb"];

// Μορφοποιεί τιμή.
const formatNumber = (value, digits = 0, locale = "el-GR") =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));

const ADMIN_DASHBOARD_LABELS = {
  el: {
    cropStatsTitle: "Στατιστικά Καλλιεργειών",
    overviewTitle: "Επισκόπηση Πλατφόρμας",
    loadingCrops: "Φόρτωση κατανομής καλλιεργειών.",
    loadingOverview: "Φόρτωση system-level metrics της εφαρμογής.",
    errorTitle: "Σφάλμα Admin Dashboard",
    errorMessage: "Δεν ήταν δυνατή η φόρτωση των admin στατιστικών.",
    cropsDescription: "Συγκεντρωτική κατανομή στρεμμάτων ανά τύπο καλλιέργειας για Recharts Pie Chart.",
    types: "τύποι",
    noCropDataTitle: "Δεν υπάρχουν ακόμα δεδομένα καλλιεργειών",
    noCropDataDescription: "Το γράφημα θα εμφανιστεί όταν οι αγρότες καταχωρήσουν καλλιέργειες σε χωράφια.",
    area: "Έκταση",
    stremmata: "στρ.",
    overviewDescription: "System-level εικόνα της εφαρμογής: χρήστες, χωράφια και εργασίες.",
    totalUsers: "Συνολικοί Χρήστες",
    totalUsersHelper: "Όλοι οι εγγεγραμμένοι λογαριασμοί",
    totalFields: "Συνολικά Χωράφια",
    totalFieldsHelper: "Χωράφια που υπάρχουν στην πλατφόρμα",
    totalTasks: "Συνολικές Εργασίες",
    totalTasksHelper: "Όλες οι καταχωρημένες εργασίες",
  },
  en: {
    cropStatsTitle: "Crop Statistics",
    overviewTitle: "Platform Overview",
    loadingCrops: "Loading crop distribution.",
    loadingOverview: "Loading system-level application metrics.",
    errorTitle: "Admin Dashboard Error",
    errorMessage: "Admin statistics could not be loaded.",
    cropsDescription: "Aggregated acreage distribution by crop type for the Recharts pie chart.",
    types: "types",
    noCropDataTitle: "No crop data yet",
    noCropDataDescription: "The chart will appear after farmers register crops in fields.",
    area: "Area",
    stremmata: "strem.",
    overviewDescription: "System-level view of users, fields, and tasks.",
    totalUsers: "Total Users",
    totalUsersHelper: "All registered accounts",
    totalFields: "Total Fields",
    totalFieldsHelper: "Fields currently registered on the platform",
    totalTasks: "Total Tasks",
    totalTasksHelper: "All registered tasks",
  },
};

// Εμφανίζει στοιχείο διεπαφής.
export default function AdminDashboard({ focus }) {
  const { language } = useAppPreferences();
  const labels = ADMIN_DASHBOARD_LABELS[language] || ADMIN_DASHBOARD_LABELS.el;
  const locale = language === "en" ? "en-US" : "el-GR";
  const isCropsView = focus === "crops";
  const [overview, setOverview] = useState(null);
  const [cropDistribution, setCropDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Φορτώνει δεδομένα.
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
        if (isMounted) setError(labels.errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdminStats();

    return () => {
      isMounted = false;
    };
  }, [isCropsView, labels.errorMessage]);

  const chartData = useMemo(
    () =>
      cropDistribution.map((item) => ({
        name: item.cropType,
        value: Number(item.totalAcres || 0),
      })),
    [cropDistribution]
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title={isCropsView ? labels.cropStatsTitle : labels.overviewTitle}
          description={isCropsView ? labels.loadingCrops : labels.loadingOverview}
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
        <ErrorState title={labels.errorTitle} description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
      {isCropsView ? (
        <SectionCard
          title={labels.cropStatsTitle}
          description={labels.cropsDescription}
          side={
            <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/20">
              <Sprout className="h-4 w-4" />
              {chartData.length} {labels.types}
            </div>
          }
        >
          {chartData.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title={labels.noCropDataTitle}
              description={labels.noCropDataDescription}
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
                      label={({ name, percent }) => `${name} ${formatNumber(percent * 100, 1, locale)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${formatNumber(value, 2, locale)} ${labels.stremmata}`, labels.area]}
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
                      {formatNumber(item.value, 2, locale)} {labels.stremmata}
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
            title={labels.overviewTitle}
            description={labels.overviewDescription}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={UsersRound}
              title={labels.totalUsers}
              value={formatNumber(overview?.totalFarmers, 0, locale)}
              tone="sky"
              helper={labels.totalUsersHelper}
            />
            <StatCard
              icon={LandPlot}
              title={labels.totalFields}
              value={formatNumber(overview?.totalFields, 0, locale)}
              tone="emerald"
              helper={labels.totalFieldsHelper}
            />
            <StatCard
              icon={CheckCircle2}
              title={labels.totalTasks}
              value={formatNumber(overview?.totalTasks, 0, locale)}
              tone="amber"
              helper={labels.totalTasksHelper}
            />
          </div>

        </>
      )}
    </div>
  );
}
