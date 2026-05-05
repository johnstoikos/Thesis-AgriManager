import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, CloudSun, Droplets, ExternalLink, Thermometer, Wind } from "lucide-react";
import api from "../api/axios";
import MapComponent from "./MapComponent";
import * as turf from "@turf/turf";
import { Button, ModalShell } from "./ui";
import { useAppPreferences } from "../i18n";

function WikiInfoModal({ crop, data, loading, error, onClose, labels }) {
  return (
    <ModalShell
      title={`${labels.wikiTitle || "Wikipedia Info"}: ${crop?.variety || crop?.type || labels.wikiCropFallback || "Crop"}`}
      description={labels.wikiDescription || "Short encyclopedic summary from Greek Wikipedia."}
      onClose={onClose}
      size="md"
    >
      <div className="max-h-[70vh] overflow-y-auto p-6">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm font-bold text-slate-500">
            {labels.wikiLoading || "Loading information..."}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-5">
            {data.thumbnail?.source && (
              <img
                src={data.thumbnail.source}
                alt={data.title || crop?.type || "Wikipedia"}
                className="h-56 w-full rounded-2xl object-cover"
              />
            )}
            <div>
              <h4 className="text-2xl font-black text-slate-950">{data.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {data.extract || labels.wikiNoSummary || "No summary available."}
              </p>
            </div>
            {data.content_urls?.desktop?.page && (
              <a
                href={data.content_urls.desktop.page}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
              >
                <ExternalLink className="h-4 w-4" />
                {labels.wikiReadMore || "Read more on Wikipedia"}
              </a>
            )}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

export default function FieldCrops() {
  const { t } = useAppPreferences();
  const labels = t.cropsPage || {};
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [field, setField] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [wikiModalOpen, setWikiModalOpen] = useState(false);
  const [wikiCrop, setWikiCrop] = useState(null);
  const [wikiData, setWikiData] = useState(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState("");
  
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
  const [taskFormData, setTaskFormData] = useState({ taskType: "Πότισμα", taskDate: "", description: "" });

  const TASK_STATUS_LABELS = {
    PENDING: labels.pending || "PENDING",
    COMPLETED: labels.completed || "COMPLETED",
  };
  const TASK_TYPE_OPTIONS = [
    { value: "Πότισμα", label: labels.water || "Watering" },
    { value: "Λίπανση", label: labels.fertilize || "Fertilization" },
    { value: "Ψεκασμός", label: labels.spray || "Spraying" },
    { value: "Συγκομιδή", label: labels.harvest || "Harvest" },
    { value: "Κλάδεμα", label: labels.prune || "Pruning" },
    { value: "Άλλο", label: labels.other || "Other" },
  ];

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
        setWeatherError(labels.weatherForbidden || "You do not have access to weather data for this field.");
      } else if (err?.response?.status === 404) {
        setWeatherError(labels.weatherNotFound || "No weather data found for the selected field.");
      } else {
        setWeatherError(labels.weatherLoadError || "Failed to load weather data.");
      }
    } finally {
      setWeatherLoading(false);
    }
  }, [fieldId, labels.weatherForbidden, labels.weatherLoadError, labels.weatherNotFound]);

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
      alert(labels.saveCropError || "Failed to save crop.");
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
    setTaskFormData({ taskType: "Πότισμα", taskDate: "", description: "" });
    setShowTaskModal(true);
  };

  const handleCloseCropModal = () => setShowModal(false);

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setIsAddingTask(false);
    setPendingLocation(null);
    setFocusedTaskLocation(null);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const [longitude, latitude] = Array.isArray(pendingLocation) ? pendingLocation : [];

    if (!Number.isFinite(Number(longitude)) || !Number.isFinite(Number(latitude))) {
      alert("Παρακαλώ επιλέξτε σημείο στο χάρτη");
      return;
    }

    // Έλεγχος Turf: Πρέπει το σημείο να είναι εντός του πολυγώνου της καλλιέργειας
    try {
      const point = turf.point([Number(longitude), Number(latitude)]);
      const polygon = turf.polygon(selectedCrop.zoneBoundary.coordinates);
      const isInside = turf.booleanPointInPolygon(point, polygon);
      
      if (!isInside) {
        alert(labels.pinInsideAlert || "The pin must be inside the crop boundary.");
        return; 
      }
    } catch (err) {
      console.error("Turf Error:", err);
    }

    try {
      const newTask = { date: taskFormData.taskDate };
      const formattedDate = newTask.date
        ? new Date(newTask.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const taskData = {
        taskType: taskFormData.taskType,
        description: taskFormData.description,
        taskDate: formattedDate,
        status: "PENDING",
        longitude: Number(longitude),
        latitude: Number(latitude),
        cropId: selectedCrop.id,
      };

      console.log("FINAL PAYLOAD:", taskData);
      await api.post("/api/tasks", taskData);
      setIsAddingTask(false);
      setPendingLocation(null);
      setTaskFormData({ taskType: "Πότισμα", taskDate: "", description: "" });
      fetchTasks(selectedCrop.id);
    } catch (err) {
      console.error("Σφάλμα κατά την αποθήκευση εργασίας:", err);
      alert(labels.saveTaskError || "Failed to save task.");
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
    if (window.confirm(labels.deleteCropConfirm || "Are you sure you want to delete this crop?")) {
      try {
        await api.delete(`/api/crops/${id}`);
        setCrops((prev) => prev.filter((crop) => crop.id !== id));
        if (selectedCrop?.id === id) setShowTaskModal(false);
      } catch (err) {
        console.error("Σφάλμα κατά τη διαγραφή καλλιέργειας:", err);
        if (err?.response?.status === 400) {
          alert(labels.cascadeError || "Delete failed.");
          return;
        }
        alert(labels.deleteError || "Delete failed.");
      }
    }
  };

  const fetchWikiSummary = async (query) => {
    const normalizedQuery = String(query || "")
      .replace(/[0-9]+/g, " ")
      .replace(/[^\p{L}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedQuery) return null;
    const apiQuery = normalizedQuery.charAt(0).toLocaleUpperCase("el-GR") + normalizedQuery.slice(1);
    const response = await fetch(
      `https://el.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(apiQuery)}`
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Wikipedia request failed");
    return response.json();
  };

  const handleOpenWikiInfo = async (crop) => {
    setWikiCrop(crop);
    setWikiData(null);
    setWikiError("");
    setWikiLoading(true);
    setWikiModalOpen(true);

    try {
      const varietyResult = await fetchWikiSummary(crop.variety);
      const typeResult = varietyResult || (await fetchWikiSummary(crop.type));

      if (!typeResult) {
        setWikiError(labels.wikiNoInfo || "No information found for this crop.");
        return;
      }

      setWikiData(typeResult);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης Wikipedia:", err);
      setWikiError(labels.wikiNoInfo || "No information found for this crop.");
    } finally {
      setWikiLoading(false);
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
            <p className="text-xs uppercase tracking-[0.2em] text-sky-600 font-black">{labels.weatherEyebrow || "Weather Data"}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{labels.weatherTitle || "Field Weather Widget"}</h3>
            <p className="text-sm text-gray-500 mt-1">{labels.weatherDescription || "Live conditions for agricultural decisions."}</p>
          </div>
          <Button
            onClick={fetchWeatherData}
            variant="secondary"
            size="sm"
            className="self-start border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
          >
            {labels.refreshWeather || "Refresh Weather"}
          </Button>
        </div>

        {weatherLoading ? (
          <div className="mt-5 text-sm font-semibold text-gray-500">{labels.weatherLoading || "Loading weather data..."}</div>
        ) : weatherError ? (
          <div className="mt-5 text-sm font-semibold text-red-600">{weatherError}</div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/80 border border-sky-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  {labels.temperature || "Temperature"}
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{temperatureValue ?? "--"}°C</p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-cyan-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  {labels.humidity || "Humidity"}
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{humidityValue ?? "--"}%</p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-indigo-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <Wind className="h-4 w-4 text-indigo-500" />
                  {labels.windSpeed || "Wind Speed"}
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{windSpeedValue ?? "--"} km/h</p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-amber-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  <CloudSun className="h-4 w-4 text-amber-500" />
                  {labels.description || "Description"}
                </div>
                <p className="text-lg font-black text-gray-900 mt-2">{weatherDescription || labels.unavailable || "Unavailable"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-gray-500 mb-2">{labels.smartAdvice || "Smart Advice (DSS)"}</p>
              {isWindHigh ? (
                <p className="text-sm font-bold text-red-600">{labels.windWarning || "Warning: high wind speed. Spraying is not recommended."}</p>
              ) : hasRainWarning ? (
                <p className="text-sm font-bold text-amber-600">{labels.rainWarning || "Rain is expected. Avoid watering or fertilizing."}</p>
              ) : (
                <p className="text-sm font-bold text-emerald-600">{labels.idealConditions || "Conditions are ideal for agricultural tasks."}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ΚΕΦΑΛΙΔΑ ΣΕΛΙΔΑΣ */}
      <div className="flex justify-between items-end mb-8 border-b pb-6">
        <div>
          <Button onClick={() => navigate("/fields")} variant="ghost" size="sm" className="mb-1 px-0 text-blue-600 hover:bg-transparent hover:underline">
            &larr; {labels.returnToFields || "Return to Fields"}
          </Button>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
            {field?.name} <span className="text-lg font-normal text-gray-400 ml-2">{field?.area} {labels.stremmataShort || "strem."}</span>
          </h2>
        </div>
        <Button
          onClick={() => handleOpenCropModal()} 
          size="lg"
        >
          + {labels.newCrop || "New Crop"}
        </Button>
      </div>

      {/* ΚΥΡΙΟΣ ΠΙΝΑΚΑΣ ΚΑΛΛΙΕΡΓΕΙΩΝ */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center font-bold text-green-700 uppercase tracking-widest">{labels.loadingData || "Loading Data..."}</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">{labels.cropVariety || "Crop / Variety"}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">{labels.area || "Area"}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">{labels.coverage || "Coverage"}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">{labels.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {crops.map(crop => (
                <tr key={crop.id} className="hover:bg-green-50/30 transition">
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {crop.type} <span className="block font-normal text-gray-400 text-xs uppercase">{crop.variety || labels.general || "General"}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{crop.zoneArea?.toFixed(2)} {labels.stremmataShort || "strem."}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">
                      {crop.coveragePercentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        onClick={() => handleOpenWikiInfo(crop)}
                        variant="secondary"
                        size="sm"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {labels.wikiInfo || "Wiki Info"}
                      </Button>
                      <Button onClick={() => handleOpenCropModal(crop)} variant="secondary" size="sm">
                        {labels.edit || "Edit"}
                      </Button>
                      <Button onClick={() => handleDeleteCrop(crop.id)} variant="danger" size="sm">
                        {labels.delete || "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: ΔΙΑΧΕΙΡΙΣΗ ΚΑΛΛΙΕΡΓΕΙΑΣ (ΠΟΛΥΓΩΝΟ) */}
      {showModal && (
        <ModalShell
          title={formData.id ? labels.editZone || "Edit Zone" : labels.newZone || "New Zone"}
          description={labels.zoneDescription || "Fill in the crop details and define the polygon on the map."}
          onClose={handleCloseCropModal}
          size="xl"
          className="max-h-[92vh] flex flex-col"
        >
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[360px_1fr]">
            <div className="overflow-y-auto border-r border-slate-100 bg-slate-50 p-6">
              <form onSubmit={handleSubmitCrop} className="space-y-5">
                <input type="text" required placeholder={labels.cropTypePlaceholder || "Type (e.g. Olives)"} className="w-full p-3 border rounded-xl shadow-sm" value={formData.type || ""} onChange={e => setFormData({...formData, type: e.target.value})} />
                <input type="text" placeholder={labels.varietyPlaceholder || "Variety"} className="w-full p-3 border rounded-xl shadow-sm" value={formData.variety || ""} onChange={e => setFormData({...formData, variety: e.target.value})} />
                <input type="date" className="w-full p-3 border rounded-xl shadow-sm" value={formData.plantingDate || ""} onChange={e => setFormData({...formData, plantingDate: e.target.value})} />
                <Button type="submit" disabled={formData.zoneBoundary.length === 0} className="w-full">
                  {labels.saveZone || "Save Zone"}
                </Button>
              </form>
            </div>
            <div className="relative min-h-[520px] bg-slate-100">
              <MapComponent 
                parentBoundary={field?.boundary?.coordinates[0]} 
                boundary={formData.zoneBoundary} 
                existingCrops={crops} 
                onPolygonComplete={coords => setFormData(prev => ({ ...prev, zoneBoundary: coords }))} 
              />
            </div>
          </div>
        </ModalShell>
      )}

      {/* MODAL 2: ΔΙΑΧΕΙΡΙΣΗ ΕΡΓΑΣΙΩΝ (ΣΗΜΕΙΟ) */}
      {showTaskModal && selectedCrop && (
        <ModalShell
          title={`${labels.tasksTitle || "Tasks"}: ${selectedCrop.type}`}
          description={isAddingTask ? labels.selectPointDescription || "Select a point inside the zone boundary." : labels.manageTasksDescription || "Manage task history and new tasks."}
          onClose={handleCloseTaskModal}
          size="xl"
          className="max-h-[92vh] flex flex-col"
        >
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[380px_1fr]">
            <div className="overflow-y-auto border-r border-slate-100 bg-slate-50 p-6">

              {!isAddingTask ? (
                <Button onClick={() => { setIsAddingTask(true); setPendingLocation(null); }} className="mb-6 w-full">
                  + {labels.newMapEntry || "New Map Entry"}
                </Button>
              ) : (
                <form onSubmit={handleSaveTask} className="bg-blue-50 p-5 rounded-2xl mb-6 border border-blue-200 animate-in zoom-in-95 shadow-sm">
                   <p className="text-[9px] font-black text-blue-600 mb-3 uppercase tracking-widest animate-pulse">{labels.clickInsideZone || "Click inside the green zone boundary"}</p>
                   <select className="w-full p-3 border rounded-xl mb-3 text-sm font-bold bg-white outline-none" value={taskFormData.taskType} onChange={e => setTaskFormData({...taskFormData, taskType: e.target.value})}>
                     {TASK_TYPE_OPTIONS.map((option) => (
                       <option key={option.value} value={option.value}>{option.label}</option>
                     ))}
                   </select>
                   <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-blue-700">
                     {labels.taskDate || "Date"}
                   </label>
                   <input
                     type="date"
                     className="mb-3 w-full rounded-xl border bg-white p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
                     value={taskFormData.taskDate || ""}
                     onChange={e => setTaskFormData({...taskFormData, taskDate: e.target.value})}
                   />
                   <textarea placeholder={labels.taskDescriptionPlaceholder || "Task description..."} className="w-full p-3 border rounded-xl mb-4 text-sm bg-white h-24 resize-none focus:ring-2 focus:ring-blue-400 outline-none" value={taskFormData.description || ""} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} />
                   <div className="flex gap-2">
                     <Button type="submit" disabled={!pendingLocation} className="flex-1" size="sm">{labels.save || "Save"}</Button>
                     <Button type="button" onClick={() => { setIsAddingTask(false); setPendingLocation(null); }} variant="secondary" className="flex-1" size="sm">{labels.cancel || "Cancel"}</Button>
                   </div>
                </form>
              )}

              <div className="space-y-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{labels.taskHistory || "Task History"}</span>
                {tasks.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4 bg-white rounded-xl border border-dashed">{labels.noTasks || "No tasks."}</p>}
                {tasks.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="text-xs font-bold text-gray-800 uppercase tracking-tight">{t.taskType}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">{t.description || labels.noDescription || "No description"}</div>
                    </div>
                    <Button
                      disabled={t.status === 'COMPLETED'} 
                      onClick={() => handleCompleteTask(t.id)} 
                      variant="secondary"
                      size="sm"
                      className={t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}
                    >
                      {TASK_STATUS_LABELS[t.status] || t.status}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px] bg-slate-100">
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
        </ModalShell>
      )}

      {showCropPickerModal && (
        <ModalShell
          title={labels.selectCrop || "Select Crop"}
          description={labels.selectCropDescription || "Choose a crop to register a new task."}
          onClose={() => {
            setShowCropPickerModal(false);
            clearNewTaskQuery();
          }}
          size="md"
        >
            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {crops.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">{labels.noCropsInField || "No crops in this field."}</p>
              )}
              {crops.map((crop) => (
                <Button
                  key={crop.id}
                  onClick={() => {
                    clearNewTaskQuery();
                    handleOpenTaskModal(crop, true);
                  }}
                  variant="secondary"
                  className="w-full justify-start px-4 py-3"
                >
                  <span className="text-left">
                    <span className="block text-sm font-bold text-gray-800">{crop.type}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{crop.variety || labels.generalVariety || "General variety"}</span>
                  </span>
                </Button>
              ))}
            </div>
        </ModalShell>
      )}

      {wikiModalOpen && (
        <WikiInfoModal
          crop={wikiCrop}
          data={wikiData}
          loading={wikiLoading}
          error={wikiError}
          labels={labels}
          onClose={() => setWikiModalOpen(false)}
        />
      )}
    </div>
  );
}
