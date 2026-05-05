import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { el } from "date-fns/locale";
import {
  CheckCircle2,
  Download,
  Droplets,
  Leaf,
  MapPinned,
  Plus,
  Search,
  Shield,
  Sprout,
  Trash2,
  Tractor,
  Wrench,
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
  FieldSelect,
  ModalShell,
  SectionCard,
  StatusBadge,
  Surface,
} from "./ui";
import "react-big-calendar/lib/css/react-big-calendar.css";

const STATUS_COLORS = {
  PENDING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const EMPTY_LABELS = {};
const TASK_TYPE_VALUES = ["Πότισμα", "Λίπανση", "Ψεκασμός", "Συγκομιδή", "Κλάδεμα", "Άλλο"];
const TASK_TYPE_LABELS = {
  el: {
    Πότισμα: "Πότισμα",
    Λίπανση: "Λίπανση",
    Ψεκασμός: "Ψεκασμός",
    Συγκομιδή: "Συγκομιδή",
    Κλάδεμα: "Κλάδεμα",
    Άλλο: "Άλλο",
  },
  en: {
    Πότισμα: "Watering",
    Λίπανση: "Fertilization",
    Ψεκασμός: "Spraying",
    Συγκομιδή: "Harvest",
    Κλάδεμα: "Pruning",
    Άλλο: "Other",
  },
};
const locales = { el };
const calendarLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: el, weekStartsOn: 1 }),
  getDay,
  locales,
});
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function formatTaskDate(date, fallback = "No date", locale = "en-US") {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTaskIcon(taskType = "") {
  const type = taskType ? String(taskType).toLowerCase() : "default";
  if (type.includes("ποτ")) return Droplets;
  if (type.includes("λιπ")) return Leaf;
  if (type.includes("ψεκ")) return Shield;
  if (type.includes("συγ")) return Sprout;
  if (type.includes("κλαδ")) return Wrench;
  return Tractor;
}

export default function GlobalTasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t } = useAppPreferences();
  const labels = t.tasks || EMPTY_LABELS;
  const [tasks, setTasks] = useState([]);
  const [fields, setFields] = useState([]);
  const [cropLookup, setCropLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL_TYPES");
  const [search, setSearch] = useState("");
  const viewMode = searchParams.get("view") === "calendar" ? "calendar" : "list";

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");

      try {
        const fieldsRes = await api.get("/api/fields");
        const fields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        setFields(fields);

        const cropsByFieldResults = await Promise.allSettled(
          fields.map((field) => api.get(`/api/crops/field/${field.id}`))
        );

        const lookup = {};
        const crops = [];

        cropsByFieldResults.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const field = fields[index];
          const fieldCrops = Array.isArray(result.value?.data) ? result.value.data : [];
          fieldCrops.forEach((crop) => {
            crops.push(crop);
            lookup[crop.id] = {
              cropName: crop.type || labels.unknownCrop || "Unknown crop",
              fieldId: field.id,
              fieldName: field.name || `${labels.field || "Field"} #${field.id}`,
            };
          });
        });
        setCropLookup(lookup);

        const tasksByCropResults = await Promise.allSettled(
          crops.map((crop) => api.get(`/api/tasks/crop/${crop.id}`))
        );

        const mergedTasks = [];
        tasksByCropResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const cropTasks = Array.isArray(result.value?.data) ? result.value.data : [];
          mergedTasks.push(...cropTasks);
        });

        setTasks(mergedTasks);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης global tasks:", err);
        setError(labels.loadError || "Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [labels.field, labels.loadError, labels.unknownCrop]);

  const statusLabels = useMemo(
    () => ({
      PENDING: labels.pending || "PENDING",
      COMPLETED: labels.completed || "COMPLETED",
    }),
    [labels.completed, labels.pending]
  );

  const calendarMessages = useMemo(
    () => ({
      allDay: labels.allDay || "All day",
      previous: labels.previous || "Previous",
      next: labels.next || "Next",
      today: labels.today || "Today",
      month: labels.month || "Month",
      week: labels.week || "Week",
      day: labels.day || "Day",
      agenda: labels.agenda || "Agenda",
      date: labels.date || "Date",
      time: labels.time || "Time",
      event: labels.task || "Task",
      noEventsInRange: labels.noEventsInRange || "No tasks in this range.",
    }),
    [labels]
  );

  const availableTypes = useMemo(() => {
    const found = new Set(tasks.map((t) => t.taskType).filter(Boolean));
    return [
      { value: "ALL_TYPES", label: labels.allTypes || "All types" },
      ...[...new Set([...TASK_TYPE_VALUES, ...found])].map((type) => ({
        value: type,
        label: TASK_TYPE_LABELS[language]?.[type] || type,
      })),
    ];
  }, [language, labels.allTypes, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const byStatus = statusFilter === "ALL" ? true : task.status === statusFilter;
      const byType = typeFilter === "ALL_TYPES" ? true : task.taskType === typeFilter;
      const q = search.trim().toLowerCase();
      const bySearch = q
      
        ? (task.description || "").toLowerCase().includes(q) || (task.taskType || "").toLowerCase().includes(q)
        : true;
      return byStatus && byType && bySearch;
    });
  }, [tasks, statusFilter, typeFilter, search]);

  const calendarEvents = useMemo(() => {
    return filteredTasks
      .filter((task) => task.taskDate)
      .map((task) => ({
        title: task.taskType || labels.task || "Task",
        start: new Date(task.taskDate),
        end: new Date(task.taskDate),
        allDay: true,
        resource: task,
      }));
  }, [filteredTasks, labels.task]);

  const handleComplete = async (taskId) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: "COMPLETED" } : task)));
    } catch (err) {
      console.error("Σφάλμα ενημέρωσης εργασίας:", err);
      alert(labels.completeError || "Failed to update task status.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm(labels.deleteConfirm || "Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      if (err?.response?.status === 400) {
        alert(labels.deleteRelationError || "This item cannot be deleted because it is connected to other data.");
        return;
      }
      if (err?.response?.status === 403) {
        alert(labels.deleteForbiddenError || "Deleting this task is not allowed for the current user.");
        return;
      }
      alert(labels.deleteError || "Task delete failed.");
    }
  };

  const handleStartNewTask = (fieldId) => {
    setShowFieldPicker(false);
    navigate(`/fields/${fieldId}?newTask=1`);
  };

  const handleViewOnMap = (task) => {
    const cropInfo = cropLookup[task.cropId];
    const coordinates = task.location?.coordinates;
    if (!cropInfo?.fieldId || !Array.isArray(coordinates)) return;

    navigate(
      `/fields/${cropInfo.fieldId}?taskId=${task.id}&cropId=${task.cropId}&lng=${coordinates[0]}&lat=${coordinates[1]}`
    );
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const fontResponse = await fetch("/fonts/LiberationSans-Regular.ttf");
      const fontBase64 = arrayBufferToBase64(await fontResponse.arrayBuffer());
      doc.addFileToVFS("LiberationSans-Regular.ttf", fontBase64);
      doc.addFont("LiberationSans-Regular.ttf", "LiberationSans", "normal");
      doc.setFont("LiberationSans", "normal");

      doc.setFontSize(18);
      doc.text(labels.pdfTitle || "Agricultural Task Calendar - AgriManager", 40, 44);
      doc.setFontSize(10);
      doc.text(`${labels.exportDate || "Export date"}: ${new Date().toLocaleDateString(language === "el" ? "el-GR" : "en-US")}`, 40, 64);
      doc.text(`${labels.totalRecords || "Total records"}: ${filteredTasks.length}`, 40, 80);

      const rows = filteredTasks.map((task) => {
        const cropInfo = cropLookup[task.cropId];
        return [
          formatTaskDate(task.taskDate, labels.noDate || "No date", language === "el" ? "el-GR" : "en-US"),
          cropInfo?.fieldName || labels.unavailable || "Unavailable",
          cropInfo?.cropName || `${labels.crop || "Crop"} #${task.cropId}`,
          task.taskType || labels.unknownTaskType || "Unknown type",
          task.description || labels.noDescription || "No description",
          statusLabels[task.status] || task.status || labels.unknown || "Unknown",
        ];
      });

      autoTable(doc, {
        startY: 104,
        head: [[labels.date || "Date", labels.field || "Field", labels.crop || "Crop", labels.taskType || "Task Type", labels.descriptionLabel || "Description", labels.status || "Status"]],
        body: rows,
        styles: {
          font: "LiberationSans",
          fontSize: 9,
          cellPadding: 6,
          valign: "middle",
          lineColor: [226, 232, 240],
          lineWidth: 0.4,
        },
        headStyles: {
          fillColor: [6, 95, 70],
          textColor: [255, 255, 255],
          fontStyle: "normal",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 40, right: 40 },
      });

      doc.save("agrimanager-imerologio-ergasion.pdf");
    } catch (err) {
      console.error("Σφάλμα εξαγωγής PDF:", err);
      alert(labels.exportError || "PDF export failed.");
    }
  };

  if (loading) {
    return (
      <Surface className="p-10 text-center">
        <p className="font-black text-emerald-700">{labels.loading || "Loading tasks..."}</p>
      </Surface>
    );
  }

  if (error) {
    return <ErrorState title={labels.loadErrorTitle || "Could not load tasks"} description={error} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Surface className="p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{labels.eyebrow || "Task calendar"}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{labels.title || "Tasks Dashboard"}</h1>
          <p className="mt-2 text-sm text-slate-500">{labels.description || "A consolidated view of all crop tasks."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
            {labels.total || "Total"}: {filteredTasks.length}
          </span>
          <Button onClick={exportToPDF} variant="secondary" size="sm">
            <Download className="h-3.5 w-3.5" />
            {labels.exportPdf || "Export PDF"}
          </Button>
          <Button onClick={() => setShowFieldPicker(true)} variant="primary" size="sm">
            <Plus className="h-3.5 w-3.5" />
            {labels.newTask || "New Task"}
          </Button>
        </div>
      </div>
      </Surface>

      <SectionCard
        title={labels.filtersTitle || "Search Filters"}
        description={labels.filtersDescription || "Narrow tasks by status, type, or text."}
        side={viewMode === "calendar" ? (
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <Button
              onClick={() => setSearchParams({}, { replace: true })}
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              className="rounded-xl shadow-none"
            >
              {labels.listView || "List View"}
            </Button>
          </div>
        ) : null}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <FieldSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{labels.allStatuses || "All statuses"}</option>
            <option value="PENDING">{statusLabels.PENDING}</option>
            <option value="COMPLETED">{statusLabels.COMPLETED}</option>
          </FieldSelect>

          <FieldSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {availableTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FieldSelect>

          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <FieldInput
              type="text"
              placeholder={labels.searchPlaceholder || "Search by type or description..."}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {viewMode === "calendar" ? (
        <Surface className="overflow-hidden p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">{labels.calendarView || "Calendar View"}</h2>
              <p className="text-sm text-slate-500">{labels.calendarDescription || "Tasks are displayed as all-day entries."}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {calendarEvents.length} {labels.tasksUnit || labels.task || "tasks"}
            </span>
          </div>
          <div className="h-[680px] rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <Calendar
              culture={language === "el" ? "el" : "en"}
              localizer={calendarLocalizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              messages={calendarMessages}
              popup
              views={["month", "week", "day", "agenda"]}
              eventPropGetter={(event) => ({
                className:
                  event.resource?.status === "COMPLETED"
                    ? "border-0 bg-emerald-600 text-white"
                    : "border-0 bg-amber-500 text-white",
              })}
            />
          </div>
        </Surface>
      ) : (
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">{labels.task || "Task"}</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">{labels.cropField || "Crop / Field"}</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">{labels.date || "Date"}</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">{labels.status || "Status"}</th>
                  <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-slate-500">{labels.actions || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-10">
                      <EmptyState
                        icon={Tractor}
                        title={labels.noTasks || "No tasks found"}
                        description={labels.noTasksDescription || "Change filters or create a new task from an available field."}
                        className="border-0 bg-transparent p-0 shadow-none"
                      />
                    </td>
                  </tr>
                )}

                {filteredTasks.map((task) => {
                  const Icon = getTaskIcon(task.taskType);
                  const cropInfo = cropLookup[task.cropId];
                  const fieldId = cropInfo?.fieldId;
                  const canNavigate = Boolean(fieldId && task.location?.coordinates);
                  const formattedDate = formatTaskDate(task.taskDate, labels.noDate || "No date", language === "el" ? "el-GR" : "en-US");

                  return (
                    <tr key={task.id} className="transition-colors hover:bg-emerald-50/40">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{task.taskType || labels.unknownTaskType || "Unknown type"}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{task.description || labels.noDescription || "No description"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {cropInfo?.cropName ? `${labels.crop || "Crop"}: ${cropInfo.cropName}` : `${labels.crop || "Crop"} #${task.cropId}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cropInfo?.fieldName || labels.fieldUnavailable || "Field: unavailable"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">{formattedDate}</td>

                      <td className="px-5 py-4">
                        <StatusBadge status={task.status}>{statusLabels[task.status] || task.status}</StatusBadge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleComplete(task.id)}
                            disabled={task.status === "COMPLETED"}
                            variant="success"
                            size="sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {labels.complete || "Complete"}
                          </Button>

                          <Button
                            onClick={() => handleViewOnMap(task)}
                            disabled={!canNavigate}
                            variant="secondary"
                            size="sm"
                            className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            <MapPinned className="h-3.5 w-3.5" />
                            {labels.map || "Map"}
                          </Button>
                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="danger"
                            size="sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {labels.delete || "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {showFieldPicker && (
        <ModalShell
          title={labels.fieldPickerTitle || "Choose Field for New Task"}
          description={labels.fieldPickerDescription || "Choose a field, then a crop, to register a task."}
          onClose={() => setShowFieldPicker(false)}
          size="md"
        >
            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {fields.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">{labels.noAvailableFields || "No available fields."}</p>
              )}
              {fields.map((field) => (
                <Button
                  key={field.id}
                  onClick={() => handleStartNewTask(field.id)}
                  variant="secondary"
                  className="w-full justify-start px-4 py-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-bold text-gray-800">{field.name}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{field.area} {t.fields?.stremmataShort || "strem."}</span>
                  </span>
                </Button>
              ))}
            </div>
        </ModalShell>
      )}
    </div>
  );
}
