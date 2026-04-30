import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import api from "../api/axios";
import MapComponent from "./MapComponent";
import * as turf from "@turf/turf";

export default function FieldCrops() {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [field, setField] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  
  // States για το Modal Καλλιέργειας (Πολύγωνο)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, type: "", variety: "", plantingDate: "", zoneBoundary: [] });

  // States για το Modal Εργασιών (Σημείο/Point)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCropPickerModal, setShowCropPickerModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [focusedTaskLocation, setFocusedTaskLocation] = useState(null);
  const [openedTaskId, setOpenedTaskId] = useState(null);
  
  // Στοιχεία φόρμας εργασίας (η θέση αποθηκεύεται στο pendingLocation)
  const [taskFormData, setTaskFormData] = useState({ taskType: "Πότισμα", description: "" });

  const TASK_STATUS_LABELS = {
    PENDING: "ΕΚΚΡΕΜΕΙ",
    COMPLETED: "ΟΛΟΚΛΗΡΩΘΗΚΕ",
  };

  const fetchData = useCallback(async () => {
    try {
      const [fieldRes, cropsRes] = await Promise.all([
        api.get(`/api/fields/${fieldId}`),
        api.get(`/api/crops/field/${fieldId}`)
      ]);
      setField(fieldRes.data);
      setCrops(cropsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Σφάλμα κατά τη φόρτωση:", err);
      setLoading(false);
    }
  }, [fieldId]);

  const fetchTasks = async (cropId) => {
    try {
      const res = await api.get(`/api/tasks/crop/${cropId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Σφάλμα κατά τη φόρτωση εργασιών:", err);
    }
  };

  const fetchWeatherData = useCallback(async () => {
    if (!fieldId) return;
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const res = await api.get(`/api/weather/field/${fieldId}`);
      setWeatherData(res.data || null);
    } catch (err) {
      console.error("Σφάλμα κατά τη φόρτωση καιρού:", err);
      setWeatherData(null);
      if (err?.response?.status === 403) {
        setWeatherError("Δεν έχετε δικαίωμα πρόσβασης στα δεδομένα καιρού για αυτό το χωράφι.");
      } else if (err?.response?.status === 404) {
        setWeatherError("Δεν βρέθηκαν δεδομένα καιρού για το επιλεγμένο χωράφι.");
      } else {
        setWeatherError("Αποτυχία φόρτωσης δεδομένων καιρού.");
      }
    } finally {
      setWeatherLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    const shouldStartNewTask = searchParams.get("newTask") === "1";
    if (!shouldStartNewTask || loading) return;
    if (!crops.length) return;
    if (showTaskModal) return;
    setShowModal(false);
    setShowCropPickerModal(true);
  }, [searchParams, loading, crops, showTaskModal]);

  useEffect(() => {
    const taskId = searchParams.get("taskId");
    const cropId = searchParams.get("cropId");
    const lng = Number(searchParams.get("lng"));
    const lat = Number(searchParams.get("lat"));

    if (!taskId || !cropId || loading || openedTaskId === taskId) return;

    const crop = crops.find((item) => String(item.id) === String(cropId));
    if (!crop) return;

    setShowModal(false);
    setShowCropPickerModal(false);
    setSelectedCrop(crop);
    setIsAddingTask(false);
    setPendingLocation(null);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      setFocusedTaskLocation([lng, lat]);
    }
    fetchTasks(crop.id);
    setShowTaskModal(true);
    setOpenedTaskId(taskId);
  }, [searchParams, loading, crops, openedTaskId]);

  const clearNewTaskQuery = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("newTask");
    setSearchParams(next, { replace: true });
  };

  // --- Χειριστές για Καλλιέργειες (Πολύγωνα) ---
  const handleOpenCropModal = (crop = null) => {
    setShowTaskModal(false); // Κλείνει το Task Modal αν είναι ανοιχτό
    setIsAddingTask(false);
    setPendingLocation(null);
    setSelectedCrop(null);
    if (crop) {
      setFormData({ 
        ...crop, 
        variety: crop.variety || "", 
        zoneBoundary: crop.zoneBoundary.coordinates[0] 
      });
    } else {
      setFormData({ id: null, type: "", variety: "", plantingDate: "", zoneBoundary: [] });
    }
    setShowModal(true);
  };

  const handleSubmitCrop = async (e) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      fieldId: parseInt(fieldId), 
      zoneBoundary: { type: "Polygon", coordinates: [formData.zoneBoundary] } 
    };
    try {
      if (formData.id) await api.put(`/api/crops/${formData.id}`, payload);
      else await api.post("/api/crops", payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Σφάλμα κατά την αποθήκευση καλλιέργειας:", err);
      alert("Σφάλμα κατά την αποθήκευση της καλλιέργειας.");
    }
  };

  // --- Χειριστές για Εργασίες (Σημεία) ---
  const handleOpenTaskModal = (crop, startAdding = false) => {
    if (!crop) return;
    setShowModal(false); // Κλείνει το Crop Modal αν είναι ανοιχτό
    setShowCropPickerModal(false);
    setSelectedCrop(crop);
    fetchTasks(crop.id);
    setIsAddingTask(startAdding);
    setPendingLocation(null);
    setTaskFormData({ taskType: "Πότισμα", description: "" });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!pendingLocation) return alert("Παρακαλώ επιλέξτε ένα σημείο στον χάρτη κάνοντας κλικ!");

    // Έλεγχος Turf: Πρέπει το σημείο να είναι εντός του πολυγώνου της καλλιέργειας
    try {
      const point = turf.point(pendingLocation);
      const polygon = turf.polygon(selectedCrop.zoneBoundary.coordinates);
      const isInside = turf.booleanPointInPolygon(point, polygon);
      
      if (!isInside) {
        alert("❌ Η πινέζα πρέπει να είναι μέσα στο όριο της καλλιέργειας!");
        return; 
      }
    } catch (err) {
      console.error("Turf Error:", err);
    }

    try {
      await api.post("/api/tasks", {
        ...taskFormData,
        cropId: selectedCrop.id,
        status: "PENDING",
        location: { type: "Point", coordinates: pendingLocation }
      });
      setIsAddingTask(false);
      setPendingLocation(null);
      setTaskFormData({ taskType: "Πότισμα", description: "" });
      fetchTasks(selectedCrop.id);
    } catch (err) {
      console.error("Σφάλμα κατά την αποθήκευση εργασίας:", err);
      alert("Σφάλμα κατά την αποθήκευση της εργασίας.");
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      fetchTasks(selectedCrop.id);
    } catch (err) {
      console.error("Σφάλμα κατά την ολοκλήρωση:", err);
    }
  };

  const handleDeleteCrop = async (id) => {
    if (window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καλλιέργεια;")) {
      try {
        await api.delete(`/api/crops/${id}`);
        fetchData();
        if (selectedCrop?.id === id) setShowTaskModal(false);
      } catch (err) {
        console.error("Σφάλμα κατά τη διαγραφή καλλιέργειας:", err);
        alert("Σφάλμα κατά τη διαγραφή.");
      }
    }
  };

  const temperatureValue = weatherData?.temperature ?? weatherData?.tempC ?? weatherData?.temp ?? null;
  const humidityValue = weatherData?.humidity ?? weatherData?.humidityPercent ?? null;
  const windSpeedValue = weatherData?.windSpeed ?? weatherData?.windSpeedKmh ?? null;
  const weatherDescription = String(weatherData?.description ?? weatherData?.weatherDescription ?? "");
  const rainProbability = weatherData?.rainProbability ?? weatherData?.precipitationProbability ?? null;

  const isWindHigh = Number(windSpeedValue) > 15;
  const rainKeywords = ["βροχή", "rain"];
  const hasRainKeyword = rainKeywords.some((keyword) => weatherDescription.toLowerCase().includes(keyword));
  const hasHighRainProbability = Number(rainProbability) >= 60;
  const hasRainWarning = hasRainKeyword || hasHighRainProbability;

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="mb-6 rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-600 font-black">Μετεωρολογικά Δεδομένα</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">Καιρικό Widget Αγρού</h3>
            <p className="text-sm text-gray-500 mt-1">Ζωντανή εικόνα συνθηκών για λήψη αγροτικών αποφάσεων.</p>
          </div>
          <button
            onClick={fetchWeatherData}
            className="self-start px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-700 hover:bg-sky-200 transition"
          >
            Ανανέωση Καιρού
          </button>
        </div>

        {weatherLoading ? (
          <div className="mt-5 text-sm font-semibold text-gray-500">Φόρτωση δεδομένων καιρού...</div>
        ) : weatherError ? (
          <div className="mt-5 text-sm font-semibold text-red-600">{weatherError}</div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/80 border border-sky-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  Θερμοκρασία
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{temperatureValue ?? "--"}°C</p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-cyan-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  Υγρασία
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{humidityValue ?? "--"}%</p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-indigo-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <Wind className="h-4 w-4 text-indigo-500" />
                  Ταχύτητα Ανέμου
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{windSpeedValue ?? "--"} km/h</p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-amber-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <CloudSun className="h-4 w-4 text-amber-500" />
                  Περιγραφή
                </div>
                <p className="text-lg font-black text-gray-900 mt-2">{weatherDescription || "Μη διαθέσιμη"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-gray-500 mb-2">Έξυπνη Συμβουλή (DSS)</p>
              {isWindHigh ? (
                <p className="text-sm font-bold text-red-600">⚠️ Προσοχή: Υψηλή ταχύτητα ανέμου. Ο ψεκασμός δεν συνιστάται.</p>
              ) : hasRainWarning ? (
                <p className="text-sm font-bold text-amber-600">🌧️ Αναμένεται βροχή. Αποφύγετε το πότισμα ή τη λίπανση.</p>
              ) : (
                <p className="text-sm font-bold text-emerald-600">✅ Οι συνθήκες είναι ιδανικές για αγροτικές εργασίες.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ΚΕΦΑΛΙΔΑ ΣΕΛΙΔΑΣ */}
      <div className="flex justify-between items-end mb-8 border-b pb-6">
        <div>
          <button onClick={() => navigate("/fields")} className="text-blue-600 text-xs font-bold mb-1 hover:underline tracking-tight">
            ← ΕΠΙΣΤΡΟΦΗ ΣΤΑ ΧΩΡΑΦΙΑ
          </button>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
            {field?.name} <span className="text-lg font-normal text-gray-400 ml-2">{field?.area} στρ.</span>
          </h2>
        </div>
        <button 
          onClick={() => handleOpenCropModal()} 
          className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all"
        >
          + Νέα Καλλιέργεια
        </button>
      </div>

      {/* ΚΥΡΙΟΣ ΠΙΝΑΚΑΣ ΚΑΛΛΙΕΡΓΕΙΩΝ */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center font-bold text-green-700 uppercase tracking-widest">Φόρτωση Δεδομένων...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Καλλιέργεια / Ποικιλία</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Έκταση</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Κάλυψη</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {crops.map(crop => (
                <tr key={crop.id} className="hover:bg-green-50/30 transition">
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {crop.type} <span className="block font-normal text-gray-400 text-xs uppercase">{crop.variety || "Γενική"}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{crop.zoneArea?.toFixed(2)} στρ.</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">
                      {crop.coveragePercentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => handleOpenCropModal(crop)} className="text-blue-600 font-bold text-xs uppercase hover:underline">Επεξεργασία</button>
                    <button onClick={() => handleDeleteCrop(crop.id)} className="text-red-400 font-bold text-xs uppercase hover:underline">Διαγραφή</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: ΔΙΑΧΕΙΡΙΣΗ ΚΑΛΛΙΕΡΓΕΙΑΣ (ΠΟΛΥΓΩΝΟ) */}
      {showModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col md:flex-row h-[600px] overflow-hidden">
            <div className="p-8 md:w-1/3 border-r bg-gray-50 overflow-y-auto">
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">{formData.id ? "✍️ Διόρθωση" : "🌱 Νέα Ζώνη"}</h3>
              <form onSubmit={handleSubmitCrop} className="space-y-5">
                <input type="text" required placeholder="Τύπος (π.χ. Ελιές)" className="w-full p-3 border rounded-xl shadow-sm" value={formData.type || ""} onChange={e => setFormData({...formData, type: e.target.value})} />
                <input type="text" placeholder="Ποικιλία" className="w-full p-3 border rounded-xl shadow-sm" value={formData.variety || ""} onChange={e => setFormData({...formData, variety: e.target.value})} />
                <input type="date" className="w-full p-3 border rounded-xl shadow-sm" value={formData.plantingDate || ""} onChange={e => setFormData({...formData, plantingDate: e.target.value})} />
                <button type="submit" disabled={formData.zoneBoundary.length === 0} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg uppercase text-sm tracking-widest disabled:bg-gray-300">
                  Αποθήκευση Ζώνης
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full text-gray-400 font-bold py-2 text-xs uppercase hover:text-gray-600">Ακύρωση</button>
              </form>
            </div>
            <div className="md:w-2/3 bg-gray-100 relative">
              <MapComponent 
                parentBoundary={field?.boundary?.coordinates[0]} 
                boundary={formData.zoneBoundary} 
                existingCrops={crops} 
                onPolygonComplete={coords => setFormData(prev => ({ ...prev, zoneBoundary: coords }))} 
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ΔΙΑΧΕΙΡΙΣΗ ΕΡΓΑΣΙΩΝ (ΣΗΜΕΙΟ) */}
      {showTaskModal && selectedCrop && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col md:flex-row h-[700px] overflow-hidden border border-white/10">
            <div className="p-8 md:w-1/3 border-r bg-gray-50 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter text-blue-700">📋 Εργασίες: {selectedCrop.type}</h3>
                <button onClick={() => { setShowTaskModal(false); setIsAddingTask(false); setPendingLocation(null); setFocusedTaskLocation(null); }} className="text-gray-300 hover:text-red-500 text-2xl">×</button>
              </div>

              {!isAddingTask ? (
                <button onClick={() => { setIsAddingTask(true); setPendingLocation(null); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold mb-6 shadow-xl uppercase text-xs tracking-widest">
                  + Νέα Καταχώρηση στο Χάρτη
                </button>
              ) : (
                <form onSubmit={handleSaveTask} className="bg-blue-50 p-5 rounded-2xl mb-6 border border-blue-200 animate-in zoom-in-95 shadow-sm">
                   <p className="text-[9px] font-black text-blue-600 mb-3 uppercase tracking-widest animate-pulse">🎯 Κάντε κλικ μέσα στο πράσινο όριο της ζώνης</p>
                   <select className="w-full p-3 border rounded-xl mb-3 text-sm font-bold bg-white outline-none" value={taskFormData.taskType} onChange={e => setTaskFormData({...taskFormData, taskType: e.target.value})}>
                     <option>Πότισμα</option>
                     <option>Λίπανση</option>
                     <option>Ψεκασμός</option>
                     <option>Συγκομιδή</option>
                     <option>Κλάδεμα</option>
                     <option>Άλλο</option>
                   </select>
                   <textarea placeholder="Περιγραφή εργασίας..." className="w-full p-3 border rounded-xl mb-4 text-sm bg-white h-24 resize-none focus:ring-2 focus:ring-blue-400 outline-none" value={taskFormData.description || ""} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} />
                   <div className="flex gap-2">
                     <button type="submit" disabled={!pendingLocation} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed">Αποθήκευση</button>
                     <button type="button" onClick={() => { setIsAddingTask(false); setPendingLocation(null); }} className="flex-1 bg-white text-gray-500 py-3 rounded-xl text-xs font-bold border border-gray-200 uppercase">Άκυρο</button>
                   </div>
                </form>
              )}

              <div className="space-y-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Ιστορικό Εργασιών</span>
                {tasks.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4 bg-white rounded-xl border border-dashed">Δεν υπάρχουν εργασίες.</p>}
                {tasks.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="text-xs font-bold text-gray-800 uppercase tracking-tight">{t.taskType}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">{t.description || "Χωρίς περιγραφή"}</div>
                    </div>
                    <button 
                      disabled={t.status === 'COMPLETED'} 
                      onClick={() => handleCompleteTask(t.id)} 
                      className={`text-[9px] px-3 py-1.5 rounded-lg font-black tracking-widest uppercase transition-all ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                    >
                      {TASK_STATUS_LABELS[t.status] || t.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:w-2/3 bg-gray-100 relative">
              <MapComponent 
                parentBoundary={field?.boundary?.coordinates[0]} 
                existingCrops={[selectedCrop]} // Δείχνουμε μόνο την τρέχουσα ζώνη για καθαρότητα
                tasks={tasks}
                isAddingTask={isAddingTask}
                pendingLocation={pendingLocation} // Περνάμε την πινέζα που μεταφέρεται
                focusedLocation={focusedTaskLocation}
                onPointSelect={(coords) => setPendingLocation(coords)}
              />
            </div>
          </div>
        </div>
      )}

      {showCropPickerModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Επιλογή Καλλιέργειας</h3>
              <button
                onClick={() => {
                  setShowCropPickerModal(false);
                  clearNewTaskQuery();
                }}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {crops.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">Δεν υπάρχουν καλλιέργειες στο χωράφι.</p>
              )}
              {crops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => {
                    clearNewTaskQuery();
                    handleOpenTaskModal(crop, true);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <p className="font-bold text-sm text-gray-800">{crop.type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{crop.variety || "Γενική ποικιλία"}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
