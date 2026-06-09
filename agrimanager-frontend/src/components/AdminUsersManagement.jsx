import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Download,
  Euro,
  LandPlot,
  RefreshCw,
  ShieldAlert,
  Sprout,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";
import { Button, EmptyState, ErrorState, ModalShell, PageHeader, SectionCard, SkeletonLines, StatCard, Surface } from "./ui";

const CHART_COLORS = ["#0891b2", "#16a34a", "#f59e0b", "#e11d48", "#7c3aed", "#0f766e"];

const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));

const formatCurrency = (value) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatMonth = (value) => {
  if (!value) return "";
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("el-GR", { month: "short", year: "2-digit" });
};

function getFullName(user) {
  return user.fullName || user.full_name || "-";
}

function getRoles(user) {
  if (!Array.isArray(user.roles)) return [];
  return user.roles;
}

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [selectedStats, setSelectedStats] = useState(null);
  const [statsLoadingId, setStatsLoadingId] = useState(null);
  const [statsError, setStatsError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης χρηστών:", err);
      setError("Δεν ήταν δυνατή η φόρτωση των χρηστών.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalUsers = useMemo(() => users.length, [users]);

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Να διαγραφεί οριστικά ο χρήστης "${user.username}";\n\nΗ ενέργεια θα διαγράψει και τα σχετικά δεδομένα του.`
    );

    if (!confirmed) return;

    setDeletingId(user.id);
    setError("");

    try {
      await api.delete(`/api/admin/users/${user.id}`);
      // Ανανεώνουμε άμεσα τον πίνακα χωρίς δεύτερο GET.
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
    } catch (err) {
      console.error("Σφάλμα διαγραφής χρήστη:", err);
      setError(err.response?.data?.message || "Δεν ήταν δυνατή η διαγραφή του χρήστη.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewStats = async (user) => {
    setSelectedStats(null);
    setStatsError("");
    setStatsLoadingId(user.id);

    try {
      const response = await api.get(`/api/admin/users/${user.id}/stats`);
      setSelectedStats(response.data || null);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης στατιστικών χρήστη:", err);
      setStatsError(err.response?.data?.message || "Δεν ήταν δυνατή η φόρτωση των στατιστικών του χρήστη.");
    } finally {
      setStatsLoadingId(null);
    }
  };

  const handleCloseStats = () => {
    setSelectedStats(null);
    setStatsError("");
  };

  const handleDownloadStats = () => {
    if (!selectedStats) return;

    const blob = new Blob([JSON.stringify(selectedStats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agrimanager-user-${selectedStats.id}-stats.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedCropData = useMemo(
    () =>
      (selectedStats?.cropDistribution || []).map((item) => ({
        name: item.cropType,
        value: Number(item.totalAcres || 0),
      })),
    [selectedStats]
  );

  const selectedActivityData = useMemo(
    () =>
      (selectedStats?.monthlyActivity || []).map((item) => ({
        month: item.month,
        label: formatMonth(item.month),
        completedTasksCount: Number(item.completedTasksCount || 0),
      })),
    [selectedStats]
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title="Διαχείριση Χρηστών"
          description="Προβολή και διαγραφή εγγεγραμμένων χρηστών της πλατφόρμας."
        />
        <Surface className="p-6">
          <SkeletonLines lines={8} />
        </Surface>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title="Διαχείριση Χρηστών"
          description="Προβολή και διαγραφή εγγεγραμμένων χρηστών της πλατφόρμας."
        />
        <ErrorState
          title="Σφάλμα φόρτωσης χρηστών"
          description={error}
          action={
            <Button type="button" onClick={fetchUsers} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Επανάληψη
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
      <PageHeader
        eyebrow="ADMIN MODULE"
        title="Διαχείριση Χρηστών"
        description="Λίστα χρηστών χωρίς passwords, με δυνατότητα οριστικής διαγραφής από τον admin."
        actions={
          <Button type="button" onClick={fetchUsers} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Ανανέωση
          </Button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <SectionCard
        title="Χρήστες Πλατφόρμας"
        description="Οι διαχειριστικές κλήσεις προστατεύονται από ROLE_ADMIN στο backend."
        side={
          <div className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 ring-1 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20">
            <UsersRound className="h-4 w-4" />
            {totalUsers} χρήστες
          </div>
        }
      >
        {users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Δεν υπάρχουν χρήστες"
            description="Ο πίνακας θα γεμίσει όταν υπάρχουν εγγεγραμμένοι χρήστες."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="whitespace-nowrap px-4 py-4 font-black text-slate-900 dark:text-slate-100">
                        {user.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900 dark:text-slate-100">
                        {user.username}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                        {getFullName(user)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {getRoles(user).map((role) => (
                            <span
                              key={role}
                              className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewStats(user)}
                            disabled={statsLoadingId === user.id}
                          >
                            {statsLoadingId === user.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <BarChart3 className="h-4 w-4" />
                            )}
                            Στατιστικά
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Διαγραφή
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-semibold">
            Η διαγραφή είναι οριστική και πρέπει να χρησιμοποιείται μόνο όταν είσαι βέβαιος ότι δεν χρειάζονται τα δεδομένα του χρήστη.
          </p>
        </div>
      </SectionCard>

      {statsError && (
        <ModalShell title="Στατιστικά Χρήστη" description="Δεν ήταν δυνατή η ανάκτηση των στατιστικών." onClose={handleCloseStats} size="md" cancelText="Κλείσιμο">
          <div className="p-8">
            <ErrorState title="Σφάλμα στατιστικών" description={statsError} />
          </div>
        </ModalShell>
      )}

      {selectedStats && (
        <ModalShell
          title={`Στατιστικά: ${selectedStats.username}`}
          description={selectedStats.email}
          onClose={handleCloseStats}
          size="xl"
          cancelText="Κλείσιμο"
        >
          <div className="space-y-6 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-slate-100">
                  {selectedStats.fullName || selectedStats.username}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ID #{selectedStats.id} · {(selectedStats.roles || []).join(", ") || "Χωρίς ρόλους"}
                </p>
              </div>
              <Button type="button" onClick={handleDownloadStats} variant="secondary">
                <Download className="h-4 w-4" />
                Λήψη JSON
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard icon={LandPlot} title="Χωράφια" value={formatNumber(selectedStats.totalFields)} tone="emerald" helper={`${formatNumber(selectedStats.totalArea, 2)} στρ. συνολικά`} />
              <StatCard icon={Sprout} title="Καλλιέργειες" value={formatNumber(selectedStats.totalCrops)} tone="sky" helper="Ζώνες καλλιεργειών του χρήστη" />
              <StatCard icon={Activity} title="Εργασίες" value={formatNumber(selectedStats.totalTasks)} tone="amber" helper={`${formatNumber(selectedStats.pendingTasks)} εκκρεμείς`} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard icon={CheckCircle2} title="Ολοκληρωμένες" value={formatNumber(selectedStats.completedTasks)} tone="emerald" helper="Tasks με status COMPLETED" />
              <StatCard icon={Euro} title="Κόστος ολοκληρωμένων" value={formatCurrency(selectedStats.totalCompletedTaskCost)} tone="rose" helper="Άθροισμα κόστους ολοκληρωμένων εργασιών" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Καλλιέργειες χρήστη" description="Κατανομή στρεμμάτων ανά τύπο καλλιέργειας.">
                {selectedCropData.length === 0 ? (
                  <EmptyState icon={Sprout} title="Δεν υπάρχουν δεδομένα καλλιεργειών" description="Ο χρήστης δεν έχει ακόμα καλλιέργειες με διαθέσιμη έκταση." />
                ) : (
                  <div className="h-[300px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedCropData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value) => [`${formatNumber(value, 2)} στρ.`, "Έκταση"]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid rgb(226 232 240)", fontWeight: 700 }}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                          {selectedCropData.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Μηνιαία δραστηριότητα" description="Ολοκληρωμένες εργασίες ανά μήνα για τον χρήστη.">
                {selectedActivityData.length === 0 ? (
                  <EmptyState icon={Activity} title="Δεν υπάρχει δραστηριότητα" description="Δεν υπάρχουν ολοκληρωμένες εργασίες με ημερομηνία." />
                ) : (
                  <div className="h-[300px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedActivityData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value) => [`${formatNumber(value)} εργασίες`, "Ολοκληρώθηκαν"]}
                          labelFormatter={(_, payload) => formatMonth(payload?.[0]?.payload?.month)}
                          contentStyle={{ borderRadius: "12px", border: "1px solid rgb(226 232 240)", fontWeight: 700 }}
                        />
                        <Bar dataKey="completedTasksCount" fill="#0891b2" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
