import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const STATUS_LABELS = {
  PENDING: "ΕΚΚΡΕΜΕΙ",
  COMPLETED: "ΟΛΟΚΛΗΡΩΘΗΚΕ",
};

const STATUS_COLORS = {
  PENDING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const TYPE_OPTIONS = ["Όλοι οι τύποι", "Πότισμα", "Λίπανση", "Ψεκασμός", "Συγκομιδή", "Κλάδεμα", "Άλλο"];

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

function formatTaskDate(date) {
  if (!date) return "Χωρίς ημερομηνία";
  return new Date(date).toLocaleDateString("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTaskIcon(taskType = "") {
  const type = taskType.toLowerCase();
  if (type.includes("ποτ")) return Droplets;
  if (type.includes("λιπ")) return Leaf;
  if (type.includes("ψεκ")) return Shield;
  if (type.includes("συγ")) return Sprout;
  if (type.includes("κλαδ")) return Wrench;
  return Tractor;
}

export default function GlobalTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [fields, setFields] = useState([]);
  const [cropLookup, setCropLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("Όλοι οι τύποι");
  const [search, setSearch] = useState("");

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
              cropName: crop.type || "Άγνωστη καλλιέργεια",
              fieldId: field.id,
              fieldName: field.name || `Χωράφι #${field.id}`,
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
        setError("Αποτυχία φόρτωσης εργασιών. Προσπαθήστε ξανά.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const availableTypes = useMemo(() => {
    const found = new Set(tasks.map((t) => t.taskType).filter(Boolean));
    return [...new Set([...TYPE_OPTIONS, ...found])];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const byStatus = statusFilter === "ALL" ? true : task.status === statusFilter;
      const byType = typeFilter === "Όλοι οι τύποι" ? true : task.taskType === typeFilter;
      const q = search.trim().toLowerCase();
      const bySearch = q
      
        ? (task.description || "").toLowerCase().includes(q) || (task.taskType || "").toLowerCase().includes(q)
        : true;
      return byStatus && byType && bySearch;
    });
  }, [tasks, statusFilter, typeFilter, search]);

  const handleComplete = async (taskId) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: "COMPLETED" } : task)));
    } catch (err) {
      console.error("Σφάλμα ενημέρωσης εργασίας:", err);
      alert("Αποτυχία ενημέρωσης κατάστασης εργασίας.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εργασία;")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      if (err?.response?.status === 403) {
        alert("Δεν επιτρέπεται η διαγραφή εργασίας για τον τρέχοντα χρήστη.");
        return;
      }
      alert("Αποτυχία διαγραφής εργασίας.");
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
      doc.text("Ημερολόγιο Αγροτικών Εργασιών - AgriManager", 40, 44);
      doc.setFontSize(10);
      doc.text(`Ημερομηνία εξαγωγής: ${new Date().toLocaleDateString("el-GR")}`, 40, 64);
      doc.text(`Σύνολο εγγραφών: ${filteredTasks.length}`, 40, 80);

      const rows = filteredTasks.map((task) => {
        const cropInfo = cropLookup[task.cropId];
        return [
          formatTaskDate(task.taskDate),
          cropInfo?.fieldName || "Μη διαθέσιμο",
          cropInfo?.cropName || `Καλλιέργεια #${task.cropId}`,
          task.taskType || "Άγνωστος τύπος",
          task.description || "Χωρίς περιγραφή",
          STATUS_LABELS[task.status] || task.status || "Άγνωστη",
        ];
      });

      autoTable(doc, {
        startY: 104,
        head: [["Ημερομηνία", "Χωράφι", "Καλλιέργεια", "Τύπος Εργασίας", "Περιγραφή", "Κατάσταση"]],
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
      alert("Αποτυχία εξαγωγής PDF.");
    }
  };

  if (loading) {
    return (
      <Surface className="p-10 text-center">
        <p className="font-black text-emerald-700">Φόρτωση εργασιών...</p>
      </Surface>
    );
  }

  if (error) {
    return <ErrorState title="Δεν ήταν δυνατή η φόρτωση εργασιών" description={error} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Surface className="p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Ημερολόγιο εργασιών</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Dashboard Εργασιών</h1>
          <p className="mt-2 text-sm text-slate-500">Συγκεντρωτική προβολή όλων των εργασιών καλλιεργειών.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
            Σύνολο: {filteredTasks.length}
          </span>
          <Button onClick={exportToPDF} variant="secondary" size="sm">
            <Download className="h-3.5 w-3.5" />
            Εξαγωγή σε PDF
          </Button>
          <Button onClick={() => setShowFieldPicker(true)} variant="sky" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Νέα Εργασία
          </Button>
        </div>
      </div>
      </Surface>

      <SectionCard title="Φίλτρα Αναζήτησης" description="Περιορίστε τις εργασίες με βάση κατάσταση, τύπο ή κείμενο.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <FieldSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Όλες οι καταστάσεις</option>
            <option value="PENDING">ΕΚΚΡΕΜΕΙ</option>
            <option value="COMPLETED">ΟΛΟΚΛΗΡΩΘΗΚΕ</option>
          </FieldSelect>

          <FieldSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </FieldSelect>

          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <FieldInput
              type="text"
              placeholder="Αναζήτηση σε τύπο ή περιγραφή..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Εργασία</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Καλλιέργεια / Χωράφι</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Ημερομηνία</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Κατάσταση</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-10">
                    <EmptyState
                      icon={Tractor}
                      title="Δεν βρέθηκαν εργασίες"
                      description="Αλλάξτε φίλτρα ή δημιουργήστε νέα εργασία από διαθέσιμο χωράφι."
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
                const formattedDate = formatTaskDate(task.taskDate);

                return (
                  <tr key={task.id} className="transition-colors hover:bg-emerald-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{task.taskType || "Άγνωστος τύπος"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{task.description || "Χωρίς περιγραφή"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {cropInfo?.cropName ? `Καλλιέργεια: ${cropInfo.cropName}` : `Καλλιέργεια #${task.cropId}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cropInfo?.fieldName || "Χωράφι: μη διαθέσιμο"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">{formattedDate}</td>

                    <td className="px-5 py-4">
                      <StatusBadge status={task.status}>{STATUS_LABELS[task.status] || task.status}</StatusBadge>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleComplete(task.id)}
                          disabled={task.status === "COMPLETED"}
                          variant="secondary"
                          size="sm"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ολοκληρώθηκε
                        </Button>

                        <Button
                          onClick={() => handleViewOnMap(task)}
                          disabled={!canNavigate}
                          variant="secondary"
                          size="sm"
                          className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <MapPinned className="h-3.5 w-3.5" />
                          Χάρτης
                        </Button>
                        <Button
                          onClick={() => handleDeleteTask(task.id)}
                          variant="secondary"
                          size="sm"
                          className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Διαγραφή
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

      {showFieldPicker && (
        <ModalShell
          title="Επιλογή Χωραφιού για Νέα Εργασία"
          description="Διαλέξτε χωράφι και στη συνέχεια καλλιέργεια για καταχώρηση εργασίας."
          onClose={() => setShowFieldPicker(false)}
          size="md"
        >
            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {fields.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">Δεν υπάρχουν διαθέσιμα χωράφια.</p>
              )}
              {fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => handleStartNewTask(field.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <p className="font-bold text-sm text-gray-800">{field.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{field.area} στρ.</p>
                </button>
              ))}
            </div>
        </ModalShell>
      )}
    </div>
  );
}
