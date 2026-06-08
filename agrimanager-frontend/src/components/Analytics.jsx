import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CircleDollarSign,
  Download,
  Layers3,
  Sprout,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
import * as turf from "@turf/turf";
import api from "../api/axios";
import { Button, EmptyState, ErrorState, SectionCard, SkeletonLines, StatCard, Surface } from "./ui";
import { useAppPreferences } from "../i18n";

const CROP_COLORS = ["#059669", "#0f766e", "#84a98c", "#22c55e", "#14b8a6", "#64748b"];
const FINANCIAL_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#16a34a"];
const TASK_STATUS_COLORS = {
  PENDING: "#f59e0b",
  COMPLETED: "#10b981",
  UNKNOWN: "#64748b",
};

function formatSquareMeters(value, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value, locale = "el-GR") {
  const amount = toNumber(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(",", "."));
  return Number(value);
}

function getPolygonSquareMeters(geoJsonPolygon) {
  const coordinates = geoJsonPolygon?.coordinates;
  if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0]) || coordinates[0].length < 4) {
    return 0;
  }

  try {
    return turf.area(turf.polygon(coordinates));
  } catch (err) {
    console.warn("Αδυναμία υπολογισμού έκτασης πολυγώνου:", err);
    return 0;
  }
}

function getFieldSquareMeters(field) {
  const storedStremmata = toNumber(field.area);
  if (Number.isFinite(storedStremmata) && storedStremmata > 0) {
    return storedStremmata * 1000;
  }

  return getPolygonSquareMeters(field.boundary);
}

function getCropStremmata(crop) {
  const storedZoneArea = toNumber(crop.zoneArea);
  if (Number.isFinite(storedZoneArea) && storedZoneArea > 0) {
    return storedZoneArea;
  }

  return getPolygonSquareMeters(crop.zoneBoundary) / 1000;
}

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

export default function Analytics() {
  const { isDarkMode, t } = useAppPreferences();
  const labels = t.analytics || {};
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError("");
      try {
        const [fieldsRes, financialsRes] = await Promise.all([
          api.get("/api/fields"),
          api.get("/api/stats/financials"),
        ]);
        const availableFields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        setFields(availableFields);
        setFinancials(Array.isArray(financialsRes.data) ? financialsRes.data : []);

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

  const financialData = useMemo(() => {
    return financials
      .map((entry) => ({
        name: entry.fieldName || labels.unknownField || "Unknown field",
        value: toNumber(entry.totalCost),
      }))
      .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [financials, labels.unknownField]);

  const stats = useMemo(() => {
    const totalFieldSquareMeters = fields.reduce((sum, field) => sum + getFieldSquareMeters(field), 0);
    const pendingTasks = tasks.filter((task) => task.status === "PENDING").length;
    const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalFinancialCost = financials.reduce((sum, entry) => {
      const cost = toNumber(entry.totalCost);
      return sum + (Number.isFinite(cost) ? cost : 0);
    }, 0);

    return {
      totalFieldSquareMeters,
      activeZones: crops.length,
      pendingTasks,
      completedTasks,
      completionPercentage,
      totalFields: fields.length,
      totalTasks,
      totalFinancialCost,
    };
  }, [crops.length, tasks, fields, financials]);

  const handleExportPDF = async () => {
    const exportArea = document.getElementById("pdf-export-area");
    if (!exportArea) return;

    const previousWidth = exportArea.style.width;
    const previousMinWidth = exportArea.style.minWidth;
    const previousMaxWidth = exportArea.style.maxWidth;
    const previousBackground = exportArea.style.backgroundColor;
    const previousColor = exportArea.style.color;
    const previousPadding = exportArea.style.padding;
    const previousBoxSizing = exportArea.style.boxSizing;

    try {
      exportArea.style.width = "1100px";
      exportArea.style.minWidth = "1100px";
      exportArea.style.maxWidth = "none";
      exportArea.style.padding = "40px";
      exportArea.style.boxSizing = "border-box";
      exportArea.style.backgroundColor = "#ffffff";
      exportArea.style.color = "#0f172a";

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const canvas = await html2canvas(exportArea, {
        backgroundColor: null,
        logging: false,
        scale: 2,
        useCORS: true,
        width: 1100,
        windowWidth: 1100,
        onclone: (clonedDocument) => {
          const clonedArea = clonedDocument.getElementById("pdf-export-area");
          if (!clonedArea) return;
          const problematicColorPattern = /(oklab|oklch)/i;

          const fallbackForProperty = (propertyName) => {
            const name = propertyName.toLowerCase();

            if (name.includes("background") || name.includes("shadow")) return "#ffffff";
            if (name.includes("border") || name.includes("outline") || name.includes("stroke")) return "#e2e8f0";
            return "#0f172a";
          };

          const sanitizeStyleDeclaration = (element, styles) => {
            if (!styles) return;

            Array.from(styles).forEach((propertyName) => {
              const value = styles.getPropertyValue(propertyName);
              if (!value || !problematicColorPattern.test(value)) return;

              try {
                element.style.setProperty(
                  propertyName,
                  fallbackForProperty(propertyName),
                  styles.getPropertyPriority(propertyName)
                );
              } catch {
                // Some browser-generated shorthand properties cannot be set directly.
              }
            });
          };

          const sanitizeComputedColors = (element) => {
            const styles = clonedDocument.defaultView?.getComputedStyle(element);
            if (!styles) return;

            if (problematicColorPattern.test(styles.color)) {
              element.style.color = "#1e293b";
            }

            if (problematicColorPattern.test(styles.backgroundColor)) {
              element.style.backgroundColor = "#ffffff";
            }

            if (problematicColorPattern.test(styles.borderColor)) {
              element.style.borderColor = "#e2e8f0";
            }
          };

          clonedDocument.documentElement.style.backgroundColor = "#ffffff";
          clonedDocument.body.style.backgroundColor = "#ffffff";

          clonedArea.style.width = "1100px";
          clonedArea.style.minWidth = "1100px";
          clonedArea.style.maxWidth = "none";
          clonedArea.style.padding = "40px";
          clonedArea.style.boxSizing = "border-box";
          clonedArea.style.backgroundColor = "#ffffff";
          clonedArea.style.color = "#0f172a";

          clonedDocument.querySelectorAll("*").forEach((node) => {
            sanitizeStyleDeclaration(node, node.style);
            sanitizeStyleDeclaration(node, clonedDocument.defaultView?.getComputedStyle(node));
            sanitizeComputedColors(node);
          });

          const existingTitle = clonedDocument.querySelector("h1");
          if (existingTitle && !clonedArea.querySelector("[data-pdf-export-title]")) {
            const title = clonedDocument.createElement("h1");
            title.dataset.pdfExportTitle = "true";
            title.textContent = existingTitle.textContent;
            title.style.margin = "0 0 24px";
            title.style.color = "#0f172a";
            title.style.backgroundColor = "#ffffff";
            title.style.fontSize = "36px";
            title.style.fontWeight = "900";
            title.style.lineHeight = "1.15";
            clonedArea.prepend(title);
          }

          clonedArea.querySelectorAll("*").forEach((node) => {
            node.style.color = "#0f172a";
            node.style.borderColor = "#e2e8f0";
            node.style.boxShadow = "none";

            if (!node.closest("svg")) {
              node.style.backgroundColor = "#ffffff";
            }
          });

          clonedArea.querySelectorAll(".recharts-responsive-container, .recharts-wrapper").forEach((node) => {
            if (node.parentElement) {
              node.parentElement.style.height = "auto";
              node.parentElement.style.minHeight = "420px";
              node.parentElement.style.paddingBottom = "36px";
              node.parentElement.style.boxSizing = "border-box";
              node.parentElement.style.overflow = "visible";
            }

            node.style.height = "380px";
            node.style.minHeight = "380px";
            node.style.paddingBottom = "32px";
            node.style.boxSizing = "border-box";
            node.style.overflow = "visible";
          });

          const chartColors = [...CROP_COLORS, ...FINANCIAL_COLORS, ...Object.values(TASK_STATUS_COLORS), "#0f172a", "#94a3b8"];
          clonedArea.querySelectorAll("svg").forEach((svg) => {
            svg.style.backgroundColor = "transparent";
            svg.style.overflow = "visible";
            svg.setAttribute("fill", "#ffffff");
            svg.setAttribute("stroke", "#e2e8f0");
          });

          clonedArea.querySelectorAll("svg *").forEach((node, index) => {
            const tagName = node.tagName.toLowerCase();
            const color = chartColors[index % chartColors.length];
            const currentFill = node.getAttribute("fill");
            const currentStroke = node.getAttribute("stroke");
            const isHexColor = (value) => /^#[0-9a-f]{3,8}$/i.test(value || "");

            node.style.removeProperty("fill");
            node.style.removeProperty("stroke");

            if (tagName === "text" || tagName === "tspan") {
              node.setAttribute("fill", "#0f172a");
              node.setAttribute("stroke", "#ffffff");
              return;
            }

            if (tagName === "line" || tagName === "polyline") {
              node.setAttribute("fill", "#ffffff");
              node.setAttribute("stroke", "#e2e8f0");
              return;
            }

            node.setAttribute("fill", isHexColor(currentFill) ? currentFill : color);
            node.setAttribute("stroke", isHexColor(currentStroke) ? currentStroke : "#ffffff");
          });
        },
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const imageWidth = pageWidth - margin * 2;
      const imageRatio = canvas.height / canvas.width;
      const imageHeight = imageWidth * imageRatio;

      let remainingHeight = imageHeight;
      let position = margin;

      pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
      remainingHeight -= pageHeight - margin * 2;

      while (remainingHeight > 0) {
        position = remainingHeight - imageHeight + margin;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
        remainingHeight -= pageHeight - margin * 2;
      }

      pdf.save("AgriManager_Analytics.pdf");
    } catch (err) {
      console.error("Σφάλμα εξαγωγής analytics PDF:", err);
      alert(labels.exportError || "PDF export failed.");
    } finally {
      exportArea.style.width = previousWidth;
      exportArea.style.minWidth = previousMinWidth;
      exportArea.style.maxWidth = previousMaxWidth;
      exportArea.style.backgroundColor = previousBackground;
      exportArea.style.color = previousColor;
      exportArea.style.padding = previousPadding;
      exportArea.style.boxSizing = previousBoxSizing;
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
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
          <Surface className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {labels.financialSummary || "Financial Summary"}
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">
                  {formatCurrency(stats.totalFinancialCost, labels.currencyLocale || "el-GR")}
                </p>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300">
                <CircleDollarSign className="h-6 w-6" />
              </div>
            </div>
          </Surface>
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
                    <Tooltip content={<GreekTooltip valueSuffix={cropChartUsesArea ? " στρ." : " ζώνες"} />} />
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

          <SectionCard
            title={labels.financialAnalysis || "Financial Analysis"}
            description={labels.financialAnalysisDescription || "Total completed task expenses grouped by field."}
            badge={labels.expenses || "Expenses"}
            side={<CircleDollarSign className="h-6 w-6 text-sky-700 dark:text-sky-300" />}
            className="xl:col-span-2"
          >
            {loading ? (
              <ChartSkeleton />
            ) : financialData.length === 0 ? (
              <ChartEmptyState
                icon={CircleDollarSign}
                title={labels.noFinancialData || "No financial data"}
                description={labels.noFinancialDataDescription || "Completed tasks with costs will appear here by field."}
              />
            ) : (
              <div className="h-[360px] rounded-3xl bg-transparent dark:bg-slate-900">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} margin={{ top: 16, right: 24, left: 16, bottom: 8 }}>
                    <CartesianGrid stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeDasharray="4 6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fill: isDarkMode ? "#cbd5e1" : "#475569", fontSize: 12, fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => formatCurrency(value, labels.currencyLocale || "el-GR")}
                      tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                    />
                    <Tooltip content={<GreekTooltip valueFormatter={(value) => formatCurrency(value, labels.currencyLocale || "el-GR")} />} />
                    <Legend
                      formatter={() => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{labels.totalCost || "Total cost"}</span>}
                      iconType="circle"
                    />
                    <Bar dataKey="value" name={labels.totalCost || "Total cost"} radius={[14, 14, 6, 6]}>
                      {financialData.map((entry, index) => (
                        <Cell key={entry.name} fill={FINANCIAL_COLORS[index % FINANCIAL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
