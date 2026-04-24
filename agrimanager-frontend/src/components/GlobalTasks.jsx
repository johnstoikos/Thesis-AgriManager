import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Droplets,
  Leaf,
  Plus,
  Search,
  Shield,
  Sprout,
  Trash2,
  Tractor,
  Wrench,
} from "lucide-react";
import api from "../api/axios";

const STATUS_LABELS = {
  PENDING: "ΕΚΚΡΕΜΕΙ",
  COMPLETED: "ΕΓΙΝΕ",
};

const STATUS_COLORS = {
  PENDING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const TYPE_OPTIONS = ["Όλοι οι τύποι", "Πότισμα", "Λίπανση", "Ψεκασμός", "Συγκομιδή", "Κλάδεμα", "Άλλο"];

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

  if (loading) {
    return <div className="text-center py-12 font-bold text-green-700">Φόρτωση εργασιών...</div>;
  }

  if (error) {
    return <div className="text-center py-12 font-bold text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Εργασιών</h2>
          <p className="text-sm text-gray-500 mt-1">Συγκεντρωτική προβολή όλων των εργασιών καλλιεργειών.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="self-start md:self-auto text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
            Σύνολο: {filteredTasks.length}
          </span>
          <button
            onClick={() => setShowFieldPicker(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Νέα Εργασία
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold bg-gray-50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Όλες οι καταστάσεις</option>
            <option value="PENDING">ΕΚΚΡΕΜΕΙ</option>
            <option value="COMPLETED">ΕΓΙΝΕ</option>
          </select>

          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold bg-gray-50"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Αναζήτηση σε τύπο ή περιγραφή..."
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm bg-gray-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Εργασία</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Καλλιέργεια / Χωράφι</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Ημερομηνία</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Κατάσταση</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm text-gray-500">
                    Δεν βρέθηκαν εργασίες με τα τρέχοντα φίλτρα.
                  </td>
                </tr>
              )}

              {filteredTasks.map((task) => {
                const Icon = getTaskIcon(task.taskType);
                const cropInfo = cropLookup[task.cropId];
                const fieldId = cropInfo?.fieldId;
                const canNavigate = Boolean(fieldId);
                const formattedDate = task.taskDate
                  ? new Date(task.taskDate).toLocaleDateString("el-GR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Χωρίς ημερομηνία";

                return (
                  <tr key={task.id} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-green-100 text-green-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{task.taskType || "Άγνωστος τύπος"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{task.description || "Χωρίς περιγραφή"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {cropInfo?.cropName ? `Καλλιέργεια: ${cropInfo.cropName}` : `Καλλιέργεια #${task.cropId}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cropInfo?.fieldName || "Χωράφι: μη διαθέσιμο"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">{formattedDate}</td>

                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS_COLORS[task.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleComplete(task.id)}
                          disabled={task.status === "COMPLETED"}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ολοκληρώθηκε
                        </button>

                        <button
                          onClick={() => canNavigate && navigate(`/fields/${fieldId}`)}
                          disabled={!canNavigate}
                          className="px-3 py-2 text-xs font-bold rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Προβολή στο Χάρτη
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Διαγραφή
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showFieldPicker && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Επιλογή Χωραφιού για Νέα Εργασία</h3>
              <button
                onClick={() => setShowFieldPicker(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
