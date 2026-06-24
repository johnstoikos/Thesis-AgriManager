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
  Search,
  Sprout,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axios";
import { useAppPreferences } from "../i18n";
import {
  Button,
  EmptyState,
  ErrorState,
  FieldInput,
  FieldLabel,
  FieldSelect,
  PageHeader,
  SectionCard,
  SkeletonLines,
  StatCard,
  Surface,
} from "./ui";
import {
  formatCurrency,
  formatMonth,
  formatNumber,
} from "../utils/analytics";

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
  { value: "month" },
  { value: "six_months" },
  { value: "year" },
];

const PIE_COLORS = ["#0f172a", "#0f766e", "#0891b2", "#65a30d", "#d97706", "#7c3aed", "#be123c", "#475569"];

const getUserLabel = (user, labels) => user.fullName || user.username || labels.userFallback(user.id);

const ADMIN_CROP_LABELS = {
  el: {
    userFallback: (id) => `Χρήστης #${id}`,
    usersLoadError: "Δεν ήταν δυνατή η φόρτωση της λίστας αγροτών.",
    analyticsLoadError: "Δεν ήταν δυνατή η φόρτωση των στατιστικών.",
    pdfError: "Δεν ήταν δυνατή η δημιουργία του PDF.",
    allFarmers: "Όλοι οι αγρότες",
    rangeOptions: {
      month: "Μήνας",
      six_months: "6μηνο",
      year: "Έτος",
    },
    expensesRangeHelper: (range) => `Εργασίες χρονικού εύρους · ${range}`,
    expensesAllHelper: "Όλες οι εργασίες των αγροτών",
    revenueRangeHelper: (range) => `Παραγωγή επί τιμή πώλησης · ${range}`,
    revenueAllHelper: "Όλες οι καλλιέργειες των αγροτών",
    yieldRangeHelper: (range) => `Παραγωγή χρονικού εύρους · ${range}`,
    yieldAllHelper: "Συνολική παραγωγή όλων των αγροτών",
    pageTitle: "Στατιστικά Καλλιεργειών",
    pageDescription: "Συγκεντρωτική ή εξατομικευμένη εικόνα παραγωγής, οικονομικών και αγροτεμαχίων.",
    exportPdf: "Εξαγωγή σε PDF",
    creatingPdf: "Δημιουργία PDF...",
    userSelection: "Επιλογή Χρήστη",
    userSearch: "Αναζήτηση Χρήστη",
    userSearchPlaceholder: "Αναζήτηση με όνομα, username ή email...",
    noUsersMatch: "Δεν βρέθηκαν χρήστες με αυτή την αναζήτηση",
    dateRange: "Χρονικό Εύρος",
    errorTitle: "Σφάλμα Analytics",
    productionSection: "Παραγωγικά και λειτουργικά στοιχεία",
    totalFields: "Συνολικά Χωράφια",
    currentStatus: "Τρέχουσα κατάσταση",
    totalStremmata: "Συνολικά Στρέμματα",
    stremmataSum: "Άθροισμα εκτάσεων",
    activeCrops: "Ενεργές Καλλιέργειες",
    registeredCrops: "Καταχωρημένες καλλιέργειες",
    pendingTasks: "Εκκρεμείς Εργασίες",
    pendingHelper: "Tasks με status PENDING",
    completedTasks: "Ολοκληρωμένες",
    completedHelper: "Tasks με status COMPLETED",
    financeSection: "Οικονομικά και παραγωγή",
    totalExpenses: "Συνολικά Έξοδα",
    totalRevenue: "Συνολικά Έσοδα",
    netProfit: "Καθαρό Κέρδος",
    profitHelper: "Έσοδα μείον έξοδα",
    totalYield: "Συνολική Σοδειά",
    monthlyFinanceTitle: "Έσοδα και Έξοδα ανά Μήνα",
    noFinanceTitle: "Δεν υπάρχουν οικονομικά δεδομένα",
    noFinanceDescription: "Το γράφημα θα εμφανιστεί όταν υπάρχουν έσοδα ή έξοδα στο επιλεγμένο χρονικό εύρος.",
    costExpenses: "Κόστος (Έξοδα)",
    profitRevenue: "Κέρδος (Έσοδα)",
    areaDistributionTitle: "Κατανομή Εκτάσεων",
    areaDistributionDescription: "Στρέμματα ανά χωράφι για την τρέχουσα επιλογή χρήστη.",
    noAreaTitle: "Δεν υπάρχουν διαθέσιμες εκτάσεις",
    noAreaDescription: "Το γράφημα θα εμφανιστεί όταν τα χωράφια έχουν καταχωρημένη έκταση.",
    area: "Έκταση",
    stremmataShort: "στρ.",
    squareMetersShort: "m²",
    fieldAnalysisTitle: "Ανάλυση ανά Χωράφι",
    fieldAnalysisDescription: (user) => `Εδαφολογικά, παραγωγικά και οικονομικά στοιχεία για: ${user}.`,
    noFieldsTitle: "Δεν υπάρχουν χωράφια",
    noFieldsDescription: "Ο επιλεγμένος αγρότης δεν έχει καταχωρημένα χωράφια.",
    fieldName: "Όνομα Χωραφιού",
    areaStremmata: "Έκταση (στρ.)",
    soilType: "Τύπος Εδάφους",
    harvestKg: "Σοδειά (Kg)",
    expenses: "Έξοδα",
    revenue: "Έσοδα",
    noData: "Δεν υπάρχουν δεδομένα",
    reportDate: "Ημερομηνία αναφοράς",
    selectedUser: "Επιλογή χρήστη",
    financialRange: "Χρονικό εύρος οικονομικών",
    fields: "Χωράφια",
    crops: "Καλλιέργειες",
    pendingPdf: "Εκκρεμείς εργασίες",
    completedPdf: "Ολοκληρωμένες εργασίες",
    field: "Χωράφι",
    harvest: "Σοδειά",
  },
  en: {
    userFallback: (id) => `User #${id}`,
    usersLoadError: "The farmer list could not be loaded.",
    analyticsLoadError: "Statistics could not be loaded.",
    pdfError: "The PDF could not be generated.",
    allFarmers: "All farmers",
    rangeOptions: {
      month: "Month",
      six_months: "6 months",
      year: "Year",
    },
    expensesRangeHelper: (range) => `Tasks in selected range · ${range}`,
    expensesAllHelper: "All farmers' tasks",
    revenueRangeHelper: (range) => `Production multiplied by sale price · ${range}`,
    revenueAllHelper: "All farmers' crops",
    yieldRangeHelper: (range) => `Production in selected range · ${range}`,
    yieldAllHelper: "Total production across all farmers",
    pageTitle: "Crop Statistics",
    pageDescription: "Aggregated or user-specific view of production, finances, and fields.",
    exportPdf: "Export PDF",
    creatingPdf: "Generating PDF...",
    userSelection: "User Selection",
    userSearch: "User Search",
    userSearchPlaceholder: "Search by name, username, or email...",
    noUsersMatch: "No users match this search",
    dateRange: "Date Range",
    errorTitle: "Analytics Error",
    productionSection: "Production and Operational Data",
    totalFields: "Total Fields",
    currentStatus: "Current status",
    totalStremmata: "Total Area",
    stremmataSum: "Sum of all field areas",
    activeCrops: "Active Crops",
    registeredCrops: "Registered crops",
    pendingTasks: "Pending Tasks",
    pendingHelper: "Tasks with PENDING status",
    completedTasks: "Completed",
    completedHelper: "Tasks with COMPLETED status",
    financeSection: "Finances and Production",
    totalExpenses: "Total Expenses",
    totalRevenue: "Total Revenue",
    netProfit: "Net Profit",
    profitHelper: "Revenue minus expenses",
    totalYield: "Total Yield",
    monthlyFinanceTitle: "Revenue and Expenses per Month",
    noFinanceTitle: "No financial data",
    noFinanceDescription: "The chart will appear when the selected range contains revenue or expenses.",
    costExpenses: "Cost (Expenses)",
    profitRevenue: "Profit (Revenue)",
    areaDistributionTitle: "Area Distribution",
    areaDistributionDescription: "Area per field for the current user selection.",
    noAreaTitle: "No available area data",
    noAreaDescription: "The chart will appear when fields have registered area.",
    area: "Area",
    stremmataShort: "strem.",
    squareMetersShort: "m²",
    fieldAnalysisTitle: "Field Analysis",
    fieldAnalysisDescription: (user) => `Soil, production, and financial data for: ${user}.`,
    noFieldsTitle: "No fields found",
    noFieldsDescription: "The selected farmer has no registered fields.",
    fieldName: "Field Name",
    areaStremmata: "Area (strem.)",
    soilType: "Soil Type",
    harvestKg: "Yield (Kg)",
    expenses: "Expenses",
    revenue: "Revenue",
    noData: "No data",
    reportDate: "Report date",
    selectedUser: "Selected user",
    financialRange: "Financial date range",
    fields: "Fields",
    crops: "Crops",
    pendingPdf: "Pending tasks",
    completedPdf: "Completed tasks",
    field: "Field",
    harvest: "Yield",
  },
};

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

function normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}

export default function CropStatistics() {
  const { language } = useAppPreferences();
  const labels = ADMIN_CROP_LABELS[language] || ADMIN_CROP_LABELS.el;
  const locale = language === "en" ? "en-US" : "el-GR";
  const money = (value) => formatCurrency(value, locale);
  const number = (value, digits = 2) => formatNumber(value, digits, locale);
  const formatTotalArea = (stremmata) => {
    const value = Number(stremmata || 0);
    if (language === "en") return `${number(value * 1000, 0)} ${labels.squareMetersShort}`;
    return `${number(value)} ${labels.stremmataShort}`;
  };
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
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
        console.error("Failed to load analytics users:", err);
        if (!ignore) setUsersError(labels.usersLoadError);
      }
    };

    fetchUsers();
    return () => {
      ignore = true;
    };
  }, [labels.usersLoadError]);

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
        console.error("Failed to load admin analytics:", err);
        setError(err.response?.data?.message || labels.analyticsLoadError);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => controller.abort();
  }, [labels.analyticsLoadError, selectedRange, selectedUserId]);

  const monthlyData = useMemo(() => {
    const months = new Set([
      ...Object.keys(analytics.monthlyExpenses || {}),
      ...Object.keys(analytics.monthlyRevenue || {}),
    ]);

    return [...months]
      .sort((first, second) => first.localeCompare(second))
      .map((month) => ({
        month,
        label: formatMonth(month, locale),
        expenses: Number(analytics.monthlyExpenses?.[month] || 0),
        revenue: Number(analytics.monthlyRevenue?.[month] || 0),
      }));
  }, [analytics.monthlyExpenses, analytics.monthlyRevenue, locale]);

  const pieData = useMemo(
    () =>
      Object.entries(analytics.pieChartData || {})
        .map(([name, value]) => ({ name, value: Number(value || 0) }))
        .filter((item) => item.value > 0)
        .sort((first, second) => second.value - first.value),
    [analytics.pieChartData]
  );
  const hasMonthlyFinancialData = monthlyData.some(
    (item) => item.expenses !== 0 || item.revenue !== 0
  );

  const selectedUser = users.find((user) => String(user.id) === selectedUserId);
  const filteredUsers = useMemo(() => {
    const query = normalizeSearchValue(userSearchTerm);
    if (!query) return users;

    return users.filter((user) => {
      const searchableValues = [
        user.id,
        user.username,
        user.email,
        user.fullName,
        user.full_name,
        getUserLabel(user, labels),
      ];
      return searchableValues.some((value) => normalizeSearchValue(value).includes(query));
    });
  }, [labels, userSearchTerm, users]);
  const visibleUsers = useMemo(() => {
    if (!selectedUser || filteredUsers.some((user) => String(user.id) === selectedUserId)) {
      return filteredUsers;
    }
    return [selectedUser, ...filteredUsers];
  }, [filteredUsers, selectedUser, selectedUserId]);
  const hasUserSearch = userSearchTerm.trim().length > 0;
  const selectUserFromSearch = (userId) => {
    setSelectedUserId(String(userId));
    setUserSearchTerm("");
  };
  const selectedUserLabel = selectedUser ? getUserLabel(selectedUser, labels) : labels.allFarmers;
  const selectedRangeLabel =
    labels.rangeOptions[selectedRange] || selectedRange;
  const showFieldsTable = selectedUserId !== "";
  const expensesHelper = showFieldsTable
    ? labels.expensesRangeHelper(selectedRangeLabel)
    : labels.expensesAllHelper;
  const revenueHelper = showFieldsTable
    ? labels.revenueRangeHelper(selectedRangeLabel)
    : labels.revenueAllHelper;
  const yieldHelper = showFieldsTable
    ? labels.yieldRangeHelper(selectedRangeLabel)
    : labels.yieldAllHelper;

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
      doc.text(`AgriManager - ${labels.pageTitle}`, 40, 44);
      doc.setDrawColor(25, 25, 25);
      doc.line(40, 56, 802, 56);

      doc.setFontSize(10);
      doc.text(`${labels.reportDate}: ${new Date().toLocaleDateString(locale)}`, 40, 76);
      doc.text(`${labels.selectedUser}: ${selectedUserLabel}`, 40, 92);
      doc.text(`${labels.financialRange}: ${selectedRangeLabel}`, 40, 108);

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
          labels.fields,
          labels.totalStremmata,
          labels.crops,
          labels.pendingPdf,
          labels.completedPdf,
        ]],
        body: [[
          number(analytics.totalFieldsCount, 0),
          formatTotalArea(analytics.totalAreaStremmata),
          number(analytics.totalCropsCount, 0),
          number(analytics.pendingTasksCount, 0),
          number(analytics.completedTasksCount, 0),
        ]],
        styles: tableStyles,
        headStyles,
        margin: { left: 40, right: 40 },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [[labels.totalExpenses, labels.totalRevenue, labels.netProfit, labels.totalYield]],
        body: [[
          money(analytics.totalExpenses),
          money(analytics.totalRevenue),
          money(analytics.netProfit),
          `${number(analytics.totalYieldKg)} kg`,
        ]],
        styles: tableStyles,
        headStyles,
        margin: { left: 40, right: 40 },
      });

      if (showFieldsTable) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 22,
          head: [[
            labels.field,
            labels.area,
            labels.soilType,
            "pH",
            labels.harvest,
            labels.revenue,
            labels.expenses,
          ]],
          body:
            analytics.fieldsBreakdown.length > 0
              ? analytics.fieldsBreakdown.map((field) => [
                  field.fieldName,
                  `${number(field.area)} ${labels.stremmataShort}`,
                  displayValue(field.soilType),
                  displayValue(field.soilPh),
                  `${number(field.totalYieldKg)} kg`,
                  money(field.fieldRevenue),
                  money(field.fieldExpenses),
                ])
              : [[labels.noData, "-", "-", "-", "-", "-", "-"]],
          styles: { ...tableStyles, fontSize: 8, cellPadding: 6 },
          headStyles,
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 40, right: 40 },
        });
      }

      doc.save(`agrimanager-crop-statistics-${selectedRange}.pdf`);
    } catch (err) {
      console.error("Failed to export admin analytics PDF:", err);
      alert(labels.pdfError);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
      <PageHeader
        eyebrow="ADMIN MODULE"
        title={labels.pageTitle}
        description={labels.pageDescription}
        actions={
          <Button onClick={exportToPdf} variant="secondary" disabled={loading || exporting}>
            <Download className="h-4 w-4" />
            {exporting ? labels.creatingPdf : labels.exportPdf}
          </Button>
        }
      />

      <Surface className="p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>{labels.userSelection}</FieldLabel>
            <FieldSelect
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={Boolean(usersError)}
            >
              <option value="">{labels.allFarmers}</option>
              {visibleUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserLabel(user, labels)} ({user.username})
                </option>
              ))}
              {visibleUsers.length === 0 && (
                <option value="" disabled>
                  {labels.noUsersMatch}
                </option>
              )}
            </FieldSelect>
            {usersError && <p className="mt-2 text-xs font-semibold text-rose-600">{usersError}</p>}
          </div>

          <div>
            <FieldLabel>{labels.dateRange}</FieldLabel>
            <FieldSelect value={selectedRange} onChange={(event) => setSelectedRange(event.target.value)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {labels.rangeOptions[option.value]}
                </option>
              ))}
            </FieldSelect>
          </div>

          <div className="md:col-span-2">
            <FieldLabel>{labels.userSearch}</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <FieldInput
                type="search"
                value={userSearchTerm}
                onChange={(event) => setUserSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && filteredUsers.length > 0) {
                    event.preventDefault();
                    selectUserFromSearch(filteredUsers[0].id);
                  }
                }}
                placeholder={labels.userSearchPlaceholder}
                disabled={Boolean(usersError)}
                className="py-3 pl-11 text-sm"
              />
            </div>
            {hasUserSearch && (
              <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {filteredUsers.length === 0 ? (
                  <p className="px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {labels.noUsersMatch}
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUserFromSearch(user.id)}
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
                        String(user.id) === selectedUserId
                          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">
                          {getUserLabel(user, labels)} ({user.username})
                        </span>
                        {user.email && (
                          <span className="block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {user.email}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        #{user.id}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Surface>

      {error ? (
        <ErrorState title={labels.errorTitle} description={error} />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {labels.productionSection}
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
                  <StatCard icon={LandPlot} title={labels.totalFields} value={number(analytics.totalFieldsCount, 0)} helper={labels.currentStatus} tone="emerald" />
                  <StatCard icon={Layers3} title={labels.totalStremmata} value={formatTotalArea(analytics.totalAreaStremmata)} helper={labels.stremmataSum} tone="sky" />
                  <StatCard icon={Sprout} title={labels.activeCrops} value={number(analytics.totalCropsCount, 0)} helper={labels.registeredCrops} tone="emerald" />
                  <StatCard icon={Clock3} title={labels.pendingTasks} value={number(analytics.pendingTasksCount, 0)} helper={labels.pendingHelper} tone="amber" />
                  <StatCard icon={CheckCircle2} title={labels.completedTasks} value={number(analytics.completedTasksCount, 0)} helper={labels.completedHelper} tone="emerald" />
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {labels.financeSection}
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
                  <StatCard icon={TrendingDown} title={labels.totalExpenses} value={money(analytics.totalExpenses)} helper={expensesHelper} tone="rose" />
                  <StatCard icon={CircleDollarSign} title={labels.totalRevenue} value={money(analytics.totalRevenue)} helper={revenueHelper} tone="sky" />
                  <StatCard icon={TrendingUp} title={labels.netProfit} value={money(analytics.netProfit)} helper={labels.profitHelper} tone={Number(analytics.netProfit || 0) >= 0 ? "emerald" : "rose"} />
                  <StatCard icon={Scale} title={labels.totalYield} value={`${number(analytics.totalYieldKg)} kg`} helper={yieldHelper} tone="amber" />
                </>
              )}
            </div>
          </section>

          {showFieldsTable && (
            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title={labels.monthlyFinanceTitle}
                description={`${selectedUserLabel} · ${selectedRangeLabel}`}
              >
                {loading ? (
                  <SkeletonLines lines={8} />
                ) : !hasMonthlyFinancialData ? (
                  <EmptyState
                    icon={CircleDollarSign}
                    title={labels.noFinanceTitle}
                    description={labels.noFinanceDescription}
                    className="border-0 bg-transparent shadow-none"
                  />
                ) : (
                  <div className="h-[360px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 12, right: 18, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${number(value, 0)} €`} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <Tooltip formatter={(value, name) => [money(value), name]} contentStyle={{ borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 700 }} />
                        <Legend />
                        <Bar dataKey="expenses" name={labels.costExpenses} fill="#fb7185" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="revenue" name={labels.profitRevenue} fill="#22c55e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard title={labels.areaDistributionTitle} description={labels.areaDistributionDescription}>
                {loading ? (
                  <SkeletonLines lines={8} />
                ) : pieData.length === 0 ? (
                  <EmptyState icon={LandPlot} title={labels.noAreaTitle} description={labels.noAreaDescription} className="border-0 bg-transparent shadow-none" />
                ) : (
                  <div className="h-[360px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={64} outerRadius={118} paddingAngle={2}>
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${number(value)} ${labels.stremmataShort}`, labels.area]} contentStyle={{ borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 700 }} />
                        <Legend formatter={(value) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {showFieldsTable && (
            <SectionCard title={labels.fieldAnalysisTitle} description={labels.fieldAnalysisDescription(selectedUserLabel)}>
              {loading ? (
                <SkeletonLines lines={8} />
              ) : analytics.fieldsBreakdown.length === 0 ? (
                <EmptyState icon={LandPlot} title={labels.noFieldsTitle} description={labels.noFieldsDescription} className="border-0 bg-transparent shadow-none" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="px-4 py-3 font-black">{labels.fieldName}</th>
                        <th className="px-4 py-3 text-right font-black">{labels.areaStremmata}</th>
                        <th className="px-4 py-3 font-black">{labels.soilType}</th>
                        <th className="px-4 py-3 text-right font-black">pH</th>
                        <th className="px-4 py-3 text-right font-black">{labels.harvestKg}</th>
                        <th className="px-4 py-3 text-right font-black">{labels.revenue}</th>
                        <th className="px-4 py-3 text-right font-black">{labels.expenses}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.fieldsBreakdown.map((field, index) => (
                        <tr key={`${field.fieldName}-${index}`} className="border-b border-slate-100 text-sm text-slate-700 last:border-0 dark:border-slate-800 dark:text-slate-200">
                          <td className="px-4 py-4 font-black text-slate-950 dark:text-slate-100">{field.fieldName}</td>
                          <td className="px-4 py-4 text-right">{number(field.area)}</td>
                          <td className="px-4 py-4">{displayValue(field.soilType)}</td>
                          <td className="px-4 py-4 text-right">{displayValue(field.soilPh)}</td>
                          <td className="px-4 py-4 text-right">{number(field.totalYieldKg)}</td>
                          <td className="px-4 py-4 text-right">{money(field.fieldRevenue)}</td>
                          <td className="px-4 py-4 text-right">{money(field.fieldExpenses)}</td>
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
