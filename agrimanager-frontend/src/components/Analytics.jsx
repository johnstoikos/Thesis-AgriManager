import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CircleDollarSign,
  Download,
  Layers3,
  Scale,
  Sprout,
  Trash2,
  TrendingDown,
} from "lucide-react";
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
import { Button, EmptyState, ErrorState, Popover, SectionCard, SkeletonLines, StatCard, Surface } from "./ui";
import { useAppPreferences } from "../i18n";
import {
  formatCurrency,
  formatNumber,
  formatSquareMeters,
  getCropStremmata,
  getFieldSquareMeters,
  toNumber,
} from "../utils/analytics";
import { exportAnalyticsPdf } from "../utils/analyticsPdf";

const CROP_COLORS = ["#059669", "#0f766e", "#84a98c", "#22c55e", "#14b8a6", "#64748b"];
const TASK_STATUS_COLORS = {
  PENDING: "#f59e0b",
  COMPLETED: "#10b981",
  UNKNOWN: "#64748b",
};

// Εμφανίζει στοιχείο διεπαφής.
function ChartSkeleton() {
  return (
    <div className="flex h-[340px] flex-col justify-between rounded-3xl border border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900">
      <SkeletonLines lines={2} />
      <div className="flex items-end gap-3">
        {[45, 70, 55, 86, 62, 76].map((height, index) => (
          <div
            key={index}
            className="flex-1 animate-pulse rounded-t-2xl bg-slate-200/90 dark:bg-slate-700"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Εμφανίζει στοιχείο διεπαφής.
function ChartEmptyState({ icon, title, description }) {
  return (
    <div className="flex h-[340px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        className="border-0 bg-transparent p-0 shadow-none"
      />
    </div>
  );
}

// Εμφανίζει στοιχείο διεπαφής.
function GreekTooltip({ active, payload, label, valueSuffix = "", valueFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
      <p className="font-black text-slate-950 dark:text-white">{label || payload[0].name}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey || entry.name} className="mt-1 flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-semibold">{entry.name}:</span>
          <span>
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// Μορφοποιεί τιμή.
function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

// Εμφανίζει στοιχείο διεπαφής.
export default function Analytics() {
  const { isDarkMode, t } = useAppPreferences();
  const labels = t.analytics || {};
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
  });
  const [fieldBreakdown, setFieldBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetMenuOpen, setResetMenuOpen] = useState(false);
  const [resettingTarget, setResettingTarget] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const resetOptions = [
    { target: "REVENUE", label: labels.resetRevenue || "Revenue" },
    { target: "EXPENSES", label: labels.resetExpenses || "Expenses" },
    { target: "PROFIT", label: labels.resetProfit || "Semester profit" },
    { target: "ALL", label: labels.resetAll || "All financial data" },
  ];

  useEffect(() => {
    // Φορτώνει δεδομένα.
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError("");
      try {
        const [fieldsRes, financialStatsRes, fieldBreakdownRes] = await Promise.all([
          api.get("/api/fields"),
          api.get("/api/stats/farmer-dashboard"),
          api.get("/api/stats/field-breakdown"),
        ]);
        const availableFields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        setFields(availableFields);
        setFieldBreakdown(Array.isArray(fieldBreakdownRes.data) ? fieldBreakdownRes.data : []);
        setFinancialStats({
          totalRevenue: toNumber(financialStatsRes.data?.totalRevenue) || 0,
          totalExpenses: toNumber(financialStatsRes.data?.totalExpenses) || 0,
          totalProfit: toNumber(financialStatsRes.data?.totalProfit) || 0,
        });

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

        const taskResults = await Promise.allSettled(
          allCrops.map((crop) => api.get(`/api/tasks/crop/${crop.id}`))
        );
        const allTasks = [];
        taskResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const cropTasks = Array.isArray(result.value?.data) ? result.value.data : [];
          allTasks.push(...cropTasks);
        });
        setTasks(allTasks);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης analytics:", err);
        setError(labels.loadError || "Failed to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [labels.loadError]);

  const cropData = useMemo(() => {
    const grouped = crops.reduce((acc, crop) => {
      const name = crop.type || labels.unknownCrop || "Unknown crop";
      const area = getCropStremmata(crop);
      acc[name] = (acc[name] || 0) + area;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [crops, labels.unknownCrop]);

  const cropCountData = useMemo(() => {
    const grouped = crops.reduce((acc, crop) => {
      const name = crop.type || labels.unknownCrop || "Unknown crop";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [crops, labels.unknownCrop]);

  const cropChartData = cropData.length > 0 ? cropData : cropCountData;
  const cropChartUsesArea = cropData.length > 0;

  const taskData = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const status = task.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusLabels = {
      PENDING: labels.pending || "Pending",
      COMPLETED: labels.completedStatus || "Completed",
      UNKNOWN: labels.unknown || "Unknown",
    };

    return ["PENDING", "COMPLETED", "UNKNOWN"]
      .filter((status) => grouped[status])
      .map((status) => ({ status, name: statusLabels[status], value: grouped[status] }));
  }, [labels.completedStatus, labels.pending, labels.unknown, tasks]);

  const stats = useMemo(() => {
    const totalFieldSquareMeters = fields.reduce((sum, field) => sum + getFieldSquareMeters(field), 0);
    const pendingTasks = tasks.filter((task) => task.status === "PENDING").length;
    const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalYieldKg = fieldBreakdown.reduce((sum, field) => sum + (toNumber(field.totalYieldKg) || 0), 0);

    return {
      totalFieldSquareMeters,
      activeZones: crops.length,
      totalYieldKg,
      pendingTasks,
      completedTasks,
      completionPercentage,
      totalFields: fields.length,
      totalTasks,
    };
  }, [crops.length, tasks, fields, fieldBreakdown]);

  // Μηδενίζει οικονομικά δεδομένα.
  const handleResetFinancialData = async ({ target, label }) => {
    const confirmation = (
      labels.resetConfirm
      || 'Delete "{item}"? Tasks, crops and harvest records will not be deleted.'
    ).replace("{item}", label);

    if (!window.confirm(confirmation)) return;

    setResettingTarget(target);
    setResetMessage("");
    try {
      const response = await api.delete(`/api/stats/financial/${target}`);
      setFinancialStats({
        totalRevenue: toNumber(response.data?.totalRevenue) || 0,
        totalExpenses: toNumber(response.data?.totalExpenses) || 0,
        totalProfit: toNumber(response.data?.totalProfit) || 0,
      });
      const fieldBreakdownResponse = await api.get("/api/stats/field-breakdown");
      setFieldBreakdown(Array.isArray(fieldBreakdownResponse.data) ? fieldBreakdownResponse.data : []);
      setResetMenuOpen(false);
      setResetMessage(
        (labels.resetSuccess || '"{item}" was reset successfully.').replace("{item}", label)
      );
    } catch (err) {
      console.error("Σφάλμα διαγραφής οικονομικών δεδομένων:", err);
      alert(err.response?.data?.message || labels.resetError || "Financial data reset failed.");
    } finally {
      setResettingTarget("");
    }
  };

  // Εξάγει PDF αναφορά.
  const handleExportPDF = async () => {
    try {
      await exportAnalyticsPdf({
        cropColors: CROP_COLORS,
        taskStatusColors: TASK_STATUS_COLORS,
      });
    } catch (err) {
      console.error("Σφάλμα εξαγωγής analytics PDF:", err);
      alert(labels.exportError || "PDF export failed.");
    }
  };

  if (error) {
    return (
      <ErrorState
        title={labels.loadErrorTitle || "Could not load analytics"}
        description={error}
      />
    );
  }

  return (
    <div className="space-y-7">
      <Surface className="overflow-hidden p-6 dark:bg-slate-950 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              {labels.eyebrow || "Analytics"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
              {labels.title || "Analytics Board"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {(labels.description || "A consolidated view across {count} fields.").replace("{count}", stats.totalFields)}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:min-w-80">
            <Button onClick={handleExportPDF} variant="secondary" className="self-start sm:self-end">
              <Download className="h-4 w-4" />
              {labels.exportPdf || "Export PDF"}
            </Button>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/70 bg-emerald-950 p-4 text-white shadow-2xl shadow-emerald-950/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100/80">{labels.tasks || "Tasks"}</p>
                <p className="mt-1 text-3xl font-black">{stats.totalTasks}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100/80">{labels.completed || "Completed"}</p>
                <p className="mt-1 text-3xl font-black">{stats.completedTasks}</p>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <div id="pdf-export-area" className="space-y-6 bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 print:bg-[#f8fafc] print:text-[#0f172a]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Surface key={index} className="p-5">
                <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <SkeletonLines lines={3} className="mt-5" />
              </Surface>
            ))
          ) : (
            <>
              <StatCard
                icon={Layers3}
                title={labels.totalArea || "Total Area"}
                value={`${formatSquareMeters(stats.totalFieldSquareMeters, labels.squareMetersLocale)} m²`}
                helper={labels.totalAreaHelper || "Sum of all field areas"}
                tone="emerald"
              />
              <StatCard
                icon={Sprout}
                title={labels.activeZones || "Active Zones"}
                value={stats.activeZones}
                helper={labels.activeZonesHelper || "Registered crop zones"}
                tone="sky"
              />
              <StatCard
                icon={Scale}
                title={labels.totalYield || "Total Yield"}
                value={`${formatNumber(stats.totalYieldKg, 2, labels.squareMetersLocale || "el-GR")} kg`}
                helper={labels.totalYieldHelper || "Completed harvest yield"}
                tone="amber"
              />
              <StatCard
                icon={CheckCircle2}
                title={labels.completionRate || "Completion Rate"}
                value={`${stats.completionPercentage}%`}
                helper={labels.completionRateHelper || "Completed tasks over all tasks"}
                tone="emerald"
              />
              <StatCard
                icon={AlertTriangle}
                title={labels.pendingTasks || "Pending"}
                value={stats.pendingTasks}
                helper={labels.pendingTasksHelper || "Tasks that need action"}
                tone="amber"
              />
            </>
          )}
        </div>

        {!loading && (
          <section aria-labelledby="financial-summary-title">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  id="financial-summary-title"
                  className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                >
                  {labels.financialSummary || "Financial Summary"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {labels.financialSummaryPeriod || "Monthly totals and current semester profit"}
                </p>
              </div>
              <div className="relative self-start sm:self-auto" data-html2canvas-ignore="true">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setResetMenuOpen((open) => !open)}
                  aria-expanded={resetMenuOpen}
                  aria-haspopup="menu"
                  disabled={Boolean(resettingTarget)}
                >
                  <Trash2 className="h-4 w-4" />
                  {labels.clearFinancialData || "Clear financial data"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {resetMenuOpen && (
                  <Popover className="w-72 p-3" align="right">
                    <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {labels.chooseReset || "Choose data to clear"}
                    </p>
                    <div className="space-y-1" role="menu">
                      {resetOptions.map((option) => (
                        <Button
                          key={option.target}
                          variant={option.target === "ALL" ? "danger" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleResetFinancialData(option)}
                          disabled={Boolean(resettingTarget)}
                          role="menuitem"
                        >
                          <Trash2 className="h-4 w-4" />
                          {resettingTarget === option.target
                            ? labels.clearing || "Clearing..."
                            : option.label}
                        </Button>
                      ))}
                    </div>
                  </Popover>
                )}
              </div>
            </div>
            {resetMessage && (
              <p
                className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                data-html2canvas-ignore="true"
              >
                {resetMessage}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                icon={TrendingDown}
                title={labels.totalExpenses || "Expenses"}
                value={formatCurrency(financialStats.totalExpenses, labels.currencyLocale || "el-GR")}
                helper={labels.currentMonth || "Current month"}
                tone="rose"
              />
              <StatCard
                icon={CircleDollarSign}
                title={labels.totalRevenue || "Revenue"}
                value={formatCurrency(financialStats.totalRevenue, labels.currencyLocale || "el-GR")}
                helper={labels.currentMonth || "Current month"}
                tone="sky"
              />
              <StatCard
                icon={CircleDollarSign}
                title={labels.totalProfit || "Semester Profit"}
                value={formatCurrency(financialStats.totalProfit, labels.currencyLocale || "el-GR")}
                helper={labels.totalProfitHelper || "Resets every six months"}
                tone={financialStats.totalProfit >= 0 ? "emerald" : "rose"}
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard
            title={labels.cropDistribution || "Crop Distribution"}
            description={
              cropChartUsesArea
                ? labels.cropDistributionAreaDescription || "Grouped by crop type and total area in stremmata."
                : labels.cropDistributionCountDescription || "Grouped by crop type by zone count because zone area is unavailable."
            }
            badge={labels.cropsBadge || "Crops"}
            side={<BarChart3 className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />}
          >
            {loading ? (
              <ChartSkeleton />
            ) : cropChartData.length === 0 ? (
              <ChartEmptyState
                icon={Sprout}
                title={labels.noCropData || "No crop data"}
                description={labels.noCropDataDescription || "Once crop zones are added, the distribution will appear here."}
              />
            ) : (
              <div className="h-[340px] rounded-3xl bg-transparent dark:bg-slate-900">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cropChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={3}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {cropChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={CROP_COLORS[index % CROP_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<GreekTooltip valueSuffix={cropChartUsesArea ? ` ${labels.stremmataShort}` : ` ${labels.zoneUnit}`} />} />
                    <Legend
                      formatter={(value) => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{value}</span>}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={labels.taskAnalysis || "Task Analysis"}
            description={labels.taskAnalysisDescription || "Compare task status with a quick view of pending and completed work."}
            badge={labels.tasks || "Tasks"}
            side={<Activity className="h-6 w-6 text-amber-600 dark:text-amber-300" />}
          >
            {loading ? (
              <ChartSkeleton />
            ) : taskData.length === 0 ? (
              <ChartEmptyState
                icon={ClipboardList}
                title={labels.noTaskData || "No task data"}
                description={labels.noTaskDataDescription || "Tasks will appear here when they are linked with crops."}
              />
            ) : (
              <div className="h-[340px] rounded-3xl bg-transparent dark:bg-slate-900">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeDasharray="4 6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDarkMode ? "#cbd5e1" : "#475569", fontSize: 12, fontWeight: 700 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                    />
                    <Tooltip content={<GreekTooltip />} />
                    <Legend
                      formatter={() => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{labels.taskCount || "Task count"}</span>}
                      iconType="circle"
                    />
                    <Bar dataKey="value" name={labels.taskCount || "Task count"} radius={[14, 14, 6, 6]}>
                      {taskData.map((entry) => (
                        <Cell key={entry.name} fill={TASK_STATUS_COLORS[entry.status] || TASK_STATUS_COLORS.UNKNOWN} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

        </div>

        <SectionCard
          title={labels.fieldAnalysisTitle || "Field Analysis"}
          description={labels.fieldAnalysisDescription || "Soil, production, and financial data per field."}
        >
          {loading ? (
            <SkeletonLines lines={8} />
          ) : fieldBreakdown.length === 0 ? (
            <EmptyState
              icon={Layers3}
              title={labels.noFieldsTitle || "No fields found"}
              description={labels.noFieldsDescription || "Field analysis will appear when fields are registered."}
              className="border-0 bg-transparent shadow-none"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="px-4 py-3 font-black">{labels.fieldName || "Field Name"}</th>
                    <th className="px-4 py-3 text-right font-black">{labels.areaStremmata || "Area (strem.)"}</th>
                    <th className="px-4 py-3 font-black">{labels.soilType || "Soil Type"}</th>
                    <th className="px-4 py-3 text-right font-black">pH</th>
                    <th className="px-4 py-3 text-right font-black">{labels.harvestKg || "Yield (Kg)"}</th>
                    <th className="px-4 py-3 text-right font-black">{labels.revenue || "Revenue"}</th>
                    <th className="px-4 py-3 text-right font-black">{labels.expenses || "Expenses"}</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldBreakdown.map((field, index) => (
                    <tr key={`${field.fieldName}-${index}`} className="border-b border-slate-100 text-sm text-slate-700 last:border-0 dark:border-slate-800 dark:text-slate-200">
                      <td className="px-4 py-4 font-black text-slate-950 dark:text-slate-100">{field.fieldName}</td>
                      <td className="px-4 py-4 text-right">{formatNumber(field.area, 2, labels.currencyLocale || "el-GR")}</td>
                      <td className="px-4 py-4">{displayValue(field.soilType)}</td>
                      <td className="px-4 py-4 text-right">{displayValue(field.soilPh)}</td>
                      <td className="px-4 py-4 text-right">{formatNumber(field.totalYieldKg, 2, labels.currencyLocale || "el-GR")}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency(field.fieldRevenue, labels.currencyLocale || "el-GR")}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency(field.fieldExpenses, labels.currencyLocale || "el-GR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
