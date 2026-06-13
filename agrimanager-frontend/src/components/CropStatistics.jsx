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
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  LandPlot,
  Layers3,
  Scale,
  Sprout,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axios";
import {
  Button,
  EmptyState,
  ErrorState,
  FieldLabel,
  FieldSelect,
  PageHeader,
  SectionCard,
  SkeletonLines,
  StatCard,
  Surface,
} from "./ui";

const EMPTY_ANALYTICS = {
  totalExpenses: 0,
  totalRevenue: 0,
  netProfit: 0,
  totalFieldsCount: 0,
  totalAreaStremmata: 0,
  totalCropsCount: 0,
  pendingTasksCount: 0,
  completedTasksCount: 0,
  totalYieldKg: 0,
  monthlyExpenses: {},
  monthlyRevenue: {},
  fieldsBreakdown: [],
  pieChartData: {},
};

const RANGE_OPTIONS = [
  { value: "month", label: "Μήνας" },
  { value: "six_months", label: "6μηνο" },
  { value: "year", label: "Έτος" },
];

const PIE_COLORS = ["#0f172a", "#0f766e", "#0891b2", "#65a30d", "#d97706", "#7c3aed", "#be123c", "#475569"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatMonth = (month) => {
  const date = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString("el-GR", { month: "short", year: "2-digit" });
};

const getUserLabel = (user) => user.fullName || user.username || `Χρήστης #${user.id}`;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function CropStatistics() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRange, setSelectedRange] = useState("year");
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/admin/users");
        if (ignore) return;

        const availableUsers = Array.isArray(response.data) ? response.data : [];
        setUsers(
          availableUsers.filter(
            (user) =>
              Array.isArray(user.roles)
              && user.roles.includes("ROLE_USER")
              && !user.roles.includes("ROLE_ADMIN")
          )
        );
      } catch (err) {
        console.error("Σφάλμα φόρτωσης χρηστών για τα analytics:", err);
        if (!ignore) setUsersError("Δεν ήταν δυνατή η φόρτωση της λίστας αγροτών.");
      }
    };

    fetchUsers();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const params = { range: selectedRange };
        if (selectedUserId) params.userId = selectedUserId;

        const response = await api.get("/api/admin/analytics", {
          params,
          signal: controller.signal,
        });

        setAnalytics({
          ...EMPTY_ANALYTICS,
          ...(response.data || {}),
          monthlyExpenses: response.data?.monthlyExpenses || {},
          monthlyRevenue: response.data?.monthlyRevenue || {},
          fieldsBreakdown: Array.isArray(response.data?.fieldsBreakdown)
            ? response.data.fieldsBreakdown
            : [],
          pieChartData: response.data?.pieChartData || {},
        });
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;
        console.error("Σφάλμα φόρτωσης admin analytics:", err);
        setError(err.response?.data?.message || "Δεν ήταν δυνατή η φόρτωση των στατιστικών.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => controller.abort();
  }, [selectedRange, selectedUserId]);

  const monthlyData = useMemo(() => {
    const months = new Set([
      ...Object.keys(analytics.monthlyExpenses || {}),
      ...Object.keys(analytics.monthlyRevenue || {}),
    ]);

    return [...months]
      .sort((first, second) => first.localeCompare(second))
      .map((month) => ({
        month,
        label: formatMonth(month),
        expenses: Number(analytics.monthlyExpenses?.[month] || 0),
        revenue: Number(analytics.monthlyRevenue?.[month] || 0),
      }));
  }, [analytics.monthlyExpenses, analytics.monthlyRevenue]);

  const pieData = useMemo(
    () =>
      Object.entries(analytics.pieChartData || {})
        .map(([name, value]) => ({ name, value: Number(value || 0) }))
        .filter((item) => item.value > 0)
        .sort((first, second) => second.value - first.value),
    [analytics.pieChartData]
  );

  const selectedUser = users.find((user) => String(user.id) === selectedUserId);
  const selectedUserLabel = selectedUser ? getUserLabel(selectedUser) : "Όλοι οι αγρότες";
  const selectedRangeLabel =
    RANGE_OPTIONS.find((option) => option.value === selectedRange)?.label || selectedRange;
  const showFieldsTable = selectedUserId !== "";

  const exportToPdf = async () => {
    setExporting(true);

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const fontResponse = await fetch("/fonts/LiberationSans-Regular.ttf");
      if (!fontResponse.ok) throw new Error("PDF font could not be loaded.");

      const fontBase64 = arrayBufferToBase64(await fontResponse.arrayBuffer());
      doc.addFileToVFS("LiberationSans-Regular.ttf", fontBase64);
      doc.addFont("LiberationSans-Regular.ttf", "LiberationSans", "normal");
      doc.setFont("LiberationSans", "normal");
      doc.setTextColor(20, 20, 20);

      doc.setFontSize(20);
      doc.text("AgriManager - Στατιστικά Καλλιεργειών", 40, 44);
      doc.setDrawColor(25, 25, 25);
      doc.line(40, 56, 802, 56);

      doc.setFontSize(10);
      doc.text(`Ημερομηνία αναφοράς: ${new Date().toLocaleDateString("el-GR")}`, 40, 76);
      doc.text(`Επιλογή χρήστη: ${selectedUserLabel}`, 40, 92);
      doc.text(`Χρονικό εύρος οικονομικών: ${selectedRangeLabel}`, 40, 108);

      const tableStyles = {
        font: "LiberationSans",
        fontSize: 9,
        cellPadding: 7,
        lineColor: [190, 190, 190],
        lineWidth: 0.5,
        textColor: [20, 20, 20],
      };
      const headStyles = {
        fillColor: [35, 35, 35],
        textColor: [255, 255, 255],
        fontStyle: "normal",
      };

      autoTable(doc, {
        startY: 128,
        head: [[
          "Χωράφια",
          "Στρέμματα",
          "Καλλιέργειες",
          "Εκκρεμείς εργασίες",
          "Ολοκληρωμένες εργασίες",
        ]],
        body: [[
          formatNumber(analytics.totalFieldsCount, 0),
          formatNumber(analytics.totalAreaStremmata),
          formatNumber(analytics.totalCropsCount, 0),
          formatNumber(analytics.pendingTasksCount, 0),
          formatNumber(analytics.completedTasksCount, 0),
        ]],
        styles: tableStyles,
        headStyles,
        margin: { left: 40, right: 40 },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [["Συνολικά έξοδα", "Συνολικά έσοδα", "Καθαρό κέρδος", "Συνολική σοδειά"]],
        body: [[
          formatCurrency(analytics.totalExpenses),
          formatCurrency(analytics.totalRevenue),
          formatCurrency(analytics.netProfit),
          `${formatNumber(analytics.totalYieldKg)} kg`,
        ]],
        styles: tableStyles,
        headStyles,
        margin: { left: 40, right: 40 },
      });

      if (showFieldsTable) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 22,
          head: [[
            "Χωράφι",
            "Έκταση",
            "Τύπος εδάφους",
            "pH",
            "Σοδειά",
            "Έσοδα",
            "Έξοδα",
          ]],
          body:
            analytics.fieldsBreakdown.length > 0
              ? analytics.fieldsBreakdown.map((field) => [
                  field.fieldName,
                  `${formatNumber(field.area)} στρ.`,
                  displayValue(field.soilType),
                  displayValue(field.soilPh),
                  `${formatNumber(field.totalYieldKg)} kg`,
                  formatCurrency(field.fieldRevenue),
                  formatCurrency(field.fieldExpenses),
                ])
              : [["Δεν υπάρχουν δεδομένα", "-", "-", "-", "-", "-", "-"]],
          styles: { ...tableStyles, fontSize: 8, cellPadding: 6 },
          headStyles,
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 40, right: 40 },
        });
      }

      doc.save(`agrimanager-crop-statistics-${selectedRange}.pdf`);
    } catch (err) {
      console.error("Σφάλμα εξαγωγής admin analytics PDF:", err);
      alert("Δεν ήταν δυνατή η δημιουργία του PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
      <PageHeader
        eyebrow="ADMIN MODULE"
        title="Στατιστικά Καλλιεργειών"
        description="Συγκεντρωτική ή εξατομικευμένη εικόνα παραγωγής, οικονομικών και αγροτεμαχίων."
        actions={
          <Button onClick={exportToPdf} variant="secondary" disabled={loading || exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Δημιουργία PDF..." : "Εξαγωγή σε PDF"}
          </Button>
        }
      />

      <Surface className="p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Επιλογή Χρήστη</FieldLabel>
            <FieldSelect
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={Boolean(usersError)}
            >
              <option value="">Όλοι οι αγρότες</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserLabel(user)} ({user.username})
                </option>
              ))}
            </FieldSelect>
            {usersError && <p className="mt-2 text-xs font-semibold text-rose-600">{usersError}</p>}
          </div>

          <div>
            <FieldLabel>Χρονικό Εύρος</FieldLabel>
            <FieldSelect value={selectedRange} onChange={(event) => setSelectedRange(event.target.value)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FieldSelect>
          </div>
        </div>
      </Surface>

      {error ? (
        <ErrorState title="Σφάλμα Analytics" description={error} />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Παραγωγικά και λειτουργικά στοιχεία
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Surface key={index} className="p-5">
                    <SkeletonLines lines={4} />
                  </Surface>
                ))
              ) : (
                <>
                  <StatCard icon={LandPlot} title="Συνολικά Χωράφια" value={formatNumber(analytics.totalFieldsCount, 0)} helper="Τρέχουσα κατάσταση" tone="emerald" />
                  <StatCard icon={Layers3} title="Συνολικά Στρέμματα" value={`${formatNumber(analytics.totalAreaStremmata)} στρ.`} helper="Άθροισμα εκτάσεων" tone="sky" />
                  <StatCard icon={Sprout} title="Ενεργές Καλλιέργειες" value={formatNumber(analytics.totalCropsCount, 0)} helper="Καταχωρημένες καλλιέργειες" tone="emerald" />
                  <StatCard icon={Clock3} title="Εκκρεμείς Εργασίες" value={formatNumber(analytics.pendingTasksCount, 0)} helper="Tasks με status PENDING" tone="amber" />
                  <StatCard icon={CheckCircle2} title="Ολοκληρωμένες" value={formatNumber(analytics.completedTasksCount, 0)} helper="Tasks με status COMPLETED" tone="emerald" />
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Οικονομικά και παραγωγή
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Surface key={index} className="p-5">
                    <SkeletonLines lines={4} />
                  </Surface>
                ))
              ) : (
                <>
                  <StatCard icon={TrendingDown} title="Συνολικά Έξοδα" value={formatCurrency(analytics.totalExpenses)} helper={`Εργασίες χρονικού εύρους · ${selectedRangeLabel}`} tone="rose" />
                  <StatCard icon={CircleDollarSign} title="Συνολικά Έσοδα" value={formatCurrency(analytics.totalRevenue)} helper={`Παραγωγή επί τιμή πώλησης · ${selectedRangeLabel}`} tone="sky" />
                  <StatCard icon={TrendingUp} title="Καθαρό Κέρδος" value={formatCurrency(analytics.netProfit)} helper="Έσοδα μείον έξοδα" tone={Number(analytics.netProfit || 0) >= 0 ? "emerald" : "rose"} />
                  <StatCard icon={Scale} title="Συνολική Σοδειά" value={`${formatNumber(analytics.totalYieldKg)} kg`} helper={`Παραγωγή χρονικού εύρους · ${selectedRangeLabel}`} tone="amber" />
                </>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Έσοδα και Έξοδα ανά Μήνα" description={`${selectedUserLabel} · ${selectedRangeLabel}`}>
              {loading ? (
                <SkeletonLines lines={8} />
              ) : (
                <div className="h-[360px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 12, right: 18, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${formatNumber(value, 0)} €`} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => [formatCurrency(value), name]} contentStyle={{ borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 700 }} />
                      <Legend />
                      <Bar dataKey="expenses" name="Έξοδα" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="revenue" name="Έσοδα" fill="#111827" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Κατανομή Εκτάσεων" description="Στρέμματα ανά χωράφι για την τρέχουσα επιλογή χρήστη.">
              {loading ? (
                <SkeletonLines lines={8} />
              ) : pieData.length === 0 ? (
                <EmptyState icon={LandPlot} title="Δεν υπάρχουν διαθέσιμες εκτάσεις" description="Το γράφημα θα εμφανιστεί όταν τα χωράφια έχουν καταχωρημένη έκταση." className="border-0 bg-transparent shadow-none" />
              ) : (
                <div className="h-[360px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={64} outerRadius={118} paddingAngle={2}>
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${formatNumber(value)} στρ.`, "Έκταση"]} contentStyle={{ borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 700 }} />
                      <Legend formatter={(value) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          {showFieldsTable && (
            <SectionCard title="Ανάλυση ανά Χωράφι" description={`Εδαφολογικά, παραγωγικά και οικονομικά στοιχεία για: ${selectedUserLabel}.`}>
              {loading ? (
                <SkeletonLines lines={8} />
              ) : analytics.fieldsBreakdown.length === 0 ? (
                <EmptyState icon={LandPlot} title="Δεν υπάρχουν χωράφια" description="Ο επιλεγμένος αγρότης δεν έχει καταχωρημένα χωράφια." className="border-0 bg-transparent shadow-none" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="px-4 py-3 font-black">Όνομα Χωραφιού</th>
                        <th className="px-4 py-3 text-right font-black">Έκταση (στρ.)</th>
                        <th className="px-4 py-3 font-black">Τύπος Εδάφους</th>
                        <th className="px-4 py-3 text-right font-black">pH</th>
                        <th className="px-4 py-3 text-right font-black">Σοδειά (Kg)</th>
                        <th className="px-4 py-3 text-right font-black">Έσοδα</th>
                        <th className="px-4 py-3 text-right font-black">Έξοδα</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.fieldsBreakdown.map((field, index) => (
                        <tr key={`${field.fieldName}-${index}`} className="border-b border-slate-100 text-sm text-slate-700 last:border-0 dark:border-slate-800 dark:text-slate-200">
                          <td className="px-4 py-4 font-black text-slate-950 dark:text-slate-100">{field.fieldName}</td>
                          <td className="px-4 py-4 text-right">{formatNumber(field.area)}</td>
                          <td className="px-4 py-4">{displayValue(field.soilType)}</td>
                          <td className="px-4 py-4 text-right">{displayValue(field.soilPh)}</td>
                          <td className="px-4 py-4 text-right">{formatNumber(field.totalYieldKg)}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(field.fieldRevenue)}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(field.fieldExpenses)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
