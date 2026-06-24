import {
  Droplets,
  Leaf,
  Shield,
  Sprout,
  Tractor,
  Wrench,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/axios";

const COMPLETED_STATUS = "COMPLETED";

// Μετατρέπει δεδομένα.
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

// Μορφοποιεί τιμή.
export function formatTaskDate(date, fallback = "No date", locale = "en-US") {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Μορφοποιεί τιμή.
export function formatCurrency(value, locale = "el-GR") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

// Μορφοποιεί τιμή.
export function formatLaborHours(value, labels, locale = "el-GR") {
  if (value == null || value === "") return "-";

  const hours = Number(value);
  if (!Number.isFinite(hours)) return "-";

  const formattedHours = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(hours);
  const unit = hours === 1
    ? labels.laborHourUnit || "hour"
    : labels.laborHoursUnit || "hours";

  return `${formattedHours} ${unit}`;
}

// Επιστρέφει δεδομένα.
export function getTaskIcon(taskType = "") {
  const type = taskType ? String(taskType).toLowerCase() : "default";
  if (type.includes("ποτ")) return Droplets;
  if (type.includes("λιπ")) return Leaf;
  if (type.includes("ψεκ")) return Shield;
  if (type.includes("συγ")) return Sprout;
  if (type.includes("κλαδ")) return Wrench;
  return Tractor;
}

// Ελέγχει εγκυρότητα.
function isDeletedTask(task) {
  return Boolean(
    task?.deleted === true ||
      task?.isDeleted === true ||
      task?.deletedAt ||
      task?.deleted_at ||
      task?.status === "DELETED"
  );
}

// Ελέγχει εγκυρότητα.
export function isValidTask(task) {
  return Boolean(task && typeof task === "object" && task.id != null && !isDeletedTask(task));
}

// Φορτώνει δεδομένα.
export async function loadGlobalTasksData({ language }) {
  const fieldLabel = language === "el" ? "Χωράφι" : "Field";
  const unknownCropLabel = language === "el" ? "Άγνωστη καλλιέργεια" : "Unknown crop";

  const fieldsRes = await api.get("/api/fields");
  const fields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];

  const cropsByFieldResults = await Promise.allSettled(
    fields.map((field) => api.get(`/api/crops/field/${field.id}`))
  );

  const cropLookup = {};
  const crops = [];

  cropsByFieldResults.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const field = fields[index];
    const fieldCrops = Array.isArray(result.value?.data) ? result.value.data : [];
    fieldCrops.forEach((crop) => {
      crops.push(crop);
      cropLookup[crop.id] = {
        cropName: crop.type || unknownCropLabel,
        fieldId: field.id,
        fieldName: field.name || `${fieldLabel} #${field.id}`,
      };
    });
  });

  const tasksByCropResults = await Promise.allSettled(
    crops.map((crop) => api.get(`/api/tasks/crop/${crop.id}`))
  );

  const uniqueTasksMap = new Map();
  tasksByCropResults.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const cropTasks = Array.isArray(result.value?.data) ? result.value.data : [];
    cropTasks.forEach((task) => {
      if (task?.id) uniqueTasksMap.set(task.id, task);
    });
  });

  return {
    fields,
    cropLookup,
    tasks: Array.from(uniqueTasksMap.values()).filter(isValidTask),
  };
}

// Εξάγει αρχείο PDF.
export async function exportGlobalTasksPdf({
  tasks,
  cropLookup,
  labels,
  language,
  statusLabels,
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const fontResponse = await fetch("/fonts/LiberationSans-Regular.ttf");
  const fontBase64 = arrayBufferToBase64(await fontResponse.arrayBuffer());
  doc.addFileToVFS("LiberationSans-Regular.ttf", fontBase64);
  doc.addFont("LiberationSans-Regular.ttf", "LiberationSans", "normal");
  doc.setFont("LiberationSans", "normal");

  const locale = language === "el" ? "el-GR" : "en-US";

  doc.setFontSize(18);
  doc.text(labels.pdfTitle || "Agricultural Task Calendar - AgriManager", 40, 44);
  doc.setFontSize(10);
  doc.text(`${labels.exportDate || "Export date"}: ${new Date().toLocaleDateString(locale)}`, 40, 64);

  const exportTasks = tasks.filter(isValidTask);
  const pendingExportTasks = exportTasks.filter(
    (task) => String(task.status || "").toUpperCase() !== COMPLETED_STATUS
  );
  const completedExportTasks = exportTasks.filter(
    (task) => String(task.status || "").toUpperCase() === COMPLETED_STATUS
  );
  doc.text(`${labels.totalRecords || "Total records"}: ${exportTasks.length}`, 40, 80);

  // Δημιουργεί γραμμές πίνακα.
  const createRows = (sectionTasks) => sectionTasks.map((task) => {
    const cropInfo = cropLookup[task.cropId];
    return [
      formatTaskDate(task.taskDate, labels.noDate || "No date", locale),
      cropInfo?.fieldName || labels.unavailable || "Unavailable",
      cropInfo?.cropName || `${labels.crop || "Crop"} #${task.cropId}`,
      task.taskType || labels.unknownTaskType || "Unknown type",
      task.description || labels.noDescription || "No description",
      formatLaborHours(task.laborHours, labels, locale),
      formatCurrency(task.cost, locale),
      statusLabels[task.status] || task.status || labels.unknown || "Unknown",
    ];
  });

  const tableHead = [[
    labels.date || "Date",
    labels.field || "Field",
    labels.crop || "Crop",
    labels.taskType || "Task Type",
    labels.descriptionLabel || "Description",
    labels.laborTime || "Labor Time",
    labels.cost || "Cost",
    labels.status || "Status",
  ]];
  const pageHeight = doc.internal.pageSize.getHeight();
  let nextSectionY = 108;

  // Σχεδιάζει ενότητα εργασιών.
  const drawTaskSection = (title, sectionTasks, headerColor) => {
    if (nextSectionY > pageHeight - 90) {
      doc.addPage();
      nextSectionY = 44;
    }

    doc.setFontSize(13);
    doc.text(`${title} (${sectionTasks.length})`, 40, nextSectionY);

    if (sectionTasks.length === 0) {
      doc.setFontSize(9);
      doc.text(labels.noExportRecords || "No records in this section.", 40, nextSectionY + 18);
      nextSectionY += 42;
      return;
    }

    autoTable(doc, {
      startY: nextSectionY + 10,
      head: tableHead,
      body: createRows(sectionTasks),
      styles: {
        font: "LiberationSans",
        fontSize: 9,
        cellPadding: 6,
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.4,
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: "normal",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 40, right: 40 },
    });

    nextSectionY = (doc.lastAutoTable?.finalY || nextSectionY + 40) + 28;
  };

  drawTaskSection(
    labels.pendingTasksSection || "Pending tasks",
    pendingExportTasks,
    [180, 83, 9]
  );
  drawTaskSection(
    labels.completedTasksSection || "Completed tasks",
    completedExportTasks,
    [6, 95, 70]
  );

  doc.save("agrimanager-imerologio-ergasion.pdf");
}
