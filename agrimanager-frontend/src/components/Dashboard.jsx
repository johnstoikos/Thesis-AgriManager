import { useState, useEffect } from "react";
import { LayoutGrid, MapPinned, Sprout } from "lucide-react";
import api from "../api/axios";
import { useAppPreferences } from "../i18n";
import MapComponent from "./MapComponent";
import { PageHeader, SectionCard, StatCard, Surface } from "./ui";

function readStoredProfile() {
  for (const key of ["profile", "user", "authUser", "currentUser"]) {
    try {
      const value = localStorage.getItem(key);
      if (value) return JSON.parse(value);
    } catch (err) {
      console.warn("Αδυναμία ανάγνωσης profile context:", err);
    }
  }
  return {};
}

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
  const [stats, setStats] = useState(null);
  const [advisorContext, setAdvisorContext] = useState({
    weather: null,
    profile: readStoredProfile(),
    fields: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [, setAdvisorLoading] = useState(true);
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
          profile: readStoredProfile(),
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
  }, []);

  if (loading) return (
    <Surface className="flex min-h-[420px] items-center justify-center p-10">
      <p className="animate-pulse text-xl font-bold text-emerald-600 dark:text-emerald-300">Φόρτωση δεδομένων από το χωράφι...</p>
    </Surface>
  );

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon={MapPinned} title={t.dashboard.totalFields} value={stats?.totalFields || 0} tone="emerald" />
            <StatCard icon={Sprout} title={t.dashboard.activeCrops} value={stats?.activeCrops || 0} tone="sky" />
            <StatCard icon={LayoutGrid} title={t.dashboard.pendingTasks} value={stats?.pendingTasks || 0} tone="amber" />
          </div>

          <SectionCard title={t.dashboard.mapTitle} description={t.dashboard.mapDescription}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <MapComponent dashboardFields={advisorContext.fields} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
