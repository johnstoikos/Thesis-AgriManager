import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import MapComponent from "./MapComponent";
import * as turf from "@turf/turf";

export default function FieldCrops() {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  
  const [field, setField] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    id: null, type: "", variety: "", plantingDate: "", zoneBoundary: []
  });

  const fetchData = async () => {
    try {
      const [fieldRes, cropsRes] = await Promise.all([
        api.get(`/api/fields/${fieldId}`),
        api.get(`/api/crops/field/${fieldId}`)
      ]);
      setField(fieldRes.data);
      setCrops(cropsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Σφάλμα:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fieldId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- ΝΕΟΣ ΕΛΕΓΧΟΣ ΕΠΙΚΑΛΥΨΗΣ (TURF 7 SAFE) ---
    try {
      if (formData.zoneBoundary.length > 0) {
        const newPoly = turf.polygon([formData.zoneBoundary]);
        
        const overlappingCrop = crops.find(existingCrop => {
          if (formData.id === existingCrop.id) return false;
          
          // Δημιουργία polygon για την υπάρχουσα καλλιέργεια
          const existingPoly = turf.polygon(existingCrop.zoneBoundary.coordinates);
          
          // Χρήση booleanIntersects (πιο σταθερό στο Turf 7)
          return turf.booleanIntersects(newPoly, existingPoly);
        });

        if (overlappingCrop) {
          alert(`❌ Σφάλμα επικάλυψης με την καλλιέργεια: ${overlappingCrop.type}`);
          return;
        }
      }
    } catch (err) {
      console.error("Σφάλμα Turf:", err);
    }

    const payload = {
      type: formData.type,
      variety: formData.variety || "",
      plantingDate: formData.plantingDate || null,
      fieldId: parseInt(fieldId),
      zoneBoundary: { type: "Polygon", coordinates: [formData.zoneBoundary] }
    };

    try {
      if (formData.id) {
        await api.put(`/api/crops/${formData.id}`, payload);
      } else {
        await api.post("/api/crops", payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
      alert("✅ Αποθηκεύτηκε!");
    } catch (err) {
      alert("❌ Σφάλμα: " + (err.response?.data?.message || "Ελέγξτε τα όρια"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτή την καλλιέργεια; Η ενέργεια δεν αναιρείται.")) {
      try {
        await api.delete(`/api/crops/${id}`);
        fetchData(); // Ανανέωση της λίστας αμέσως
        alert("✅ Η καλλιέργεια διαγράφηκε.");
      } catch (err) {
        console.error("Σφάλμα κατά τη διαγραφή:", err);
        alert("❌ Αποτυχία διαγραφής. Ίσως υπάρχουν συνδεδεμένες εργασίες.");
      }
    }
  };

  const resetForm = () => {
    setFormData({ id: null, type: "", variety: "", plantingDate: "", zoneBoundary: [] });
  };

  if (loading) return <div className="p-10 text-center font-bold text-green-700">Φόρτωση...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b pb-6 font-sans">
        <div>
          <button onClick={() => navigate("/fields")} className="text-blue-600 hover:underline text-sm mb-2 block font-medium">
            ← Επιστροφή στα Χωράφια
          </button>
          <h2 className="text-4xl font-black text-gray-900 uppercase">
            {field.name} <span className="text-lg font-normal text-gray-400 ml-2">{field.area} στρ.</span>
          </h2>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all"
        >
          + Νέα Καλλιέργεια
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Τύπος / Ποικιλία</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Ημερομηνία</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Έκταση</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Κάλυψη</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {crops.map(crop => (
              <tr key={crop.id} className="hover:bg-green-50/50 transition">
                <td className="px-6 py-4 font-bold text-gray-800">
                    {crop.type} <span className="block font-normal text-gray-400 text-xs">{crop.variety || "---"}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{crop.plantingDate || "---"}</td>
                <td className="px-6 py-4 font-mono text-sm">{crop.zoneArea?.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    {crop.coveragePercentage?.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { setFormData({...crop, variety: crop.variety || "", zoneBoundary: crop.zoneBoundary.coordinates[0]}); setShowModal(true); }}
                    className="text-blue-600 font-bold hover:text-blue-800 mr-4"
                  >Επεξεργασία</button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { 
                      setFormData({
                        ...crop, 
                        variety: crop.variety || "", 
                        zoneBoundary: crop.zoneBoundary.coordinates[0]
                      }); 
                      setShowModal(true); 
                    }} 
                    className="text-blue-600 font-bold hover:text-blue-800 mr-4 transition-colors"
                  >
                    Επεξεργασία
                  </button>
                  <button 
                    onClick={() => handleDelete(crop.id)} // Κλήση της διαγραφής
                    className="text-red-500 font-bold hover:text-red-700 transition-colors"
                  >
                    Διαγραφή
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
            <div className="p-8 md:w-1/3 border-r overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">{formData.id ? "✍️ Διόρθωση" : "🌱 Νέα Ζώνη"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Τύπος</label>
                  <input type="text" required placeholder="π.χ. Ελιές" className="w-full mt-1 p-3 border rounded-xl" value={formData.type || ""} onChange={(e) => setFormData({...formData, type: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Ποικιλία</label>
                  <input type="text" placeholder="π.χ. Καλαμών" className="w-full mt-1 p-3 border rounded-xl" value={formData.variety || ""} onChange={(e) => setFormData({...formData, variety: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Ημερομηνία</label>
                  <input type="date" className="w-full mt-1 p-3 border rounded-xl" value={formData.plantingDate || ""} onChange={(e) => setFormData({...formData, plantingDate: e.target.value})} />
                </div>
                <button type="submit" disabled={formData.zoneBoundary.length === 0} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 transition-colors">
                    {formData.id ? "Ενημέρωση" : "Αποθήκευση"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full text-gray-400 font-medium hover:text-gray-600 pt-2">Ακύρωση</button>
              </form>
            </div>
            <div className="md:w-2/3 bg-gray-50 h-full">
              <MapComponent 
                parentBoundary={field.boundary.coordinates[0]} 
                boundary={formData.zoneBoundary}
                existingCrops={crops}
                onPolygonComplete={(coords) => setFormData(prev => ({ ...prev, zoneBoundary: coords }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}