import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import MapComponent from "./MapComponent";

export default function FieldCrops() {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  
  const [field, setField] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    id: null,
    type: "",
    variety: "",
    plantingDate: "",
    zoneBoundary: []
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
      console.error("Σφάλμα φόρτωσης:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fieldId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      type: formData.type,
      variety: formData.variety,
      plantingDate: formData.plantingDate,
      field: { id: parseInt(fieldId) }, // Στέλνουμε το field object όπως το περιμένει η Java
      zoneBoundary: {
        type: "Polygon",
        coordinates: [formData.zoneBoundary]
      }
    };

    try {
      if (formData.id) {
        await api.put(`/api/crops/${formData.id}`, payload);
      } else {
        await api.post("/api/crops", payload);
      }
      resetForm();
      fetchData();
      alert("Η καλλιέργεια αποθηκεύτηκε!");
    } catch (err) {
      console.error("Σφάλμα αποθήκευσης:", err);
    }
  };

  const handleEdit = (crop) => {
    setFormData({
      id: crop.id,
      type: crop.type,
      variety: crop.variety,
      plantingDate: crop.plantingDate,
      zoneBoundary: crop.zoneBoundary.coordinates[0]
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Διαγραφή καλλιέργειας;")) {
      try {
        await api.delete(`/api/crops/${id}`);
        fetchData();
      } catch (err) {
        console.error("Σφάλμα:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ id: null, type: "", variety: "", plantingDate: "", zoneBoundary: [] });
  };

  if (loading) return <div className="p-10 text-center font-bold">Φόρτωση...</div>;
  if (!field) return <div className="p-10 text-red-500 text-center">Το χωράφι δεν βρέθηκε.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate("/fields")} className="text-gray-500 hover:text-black mb-2 text-sm flex items-center gap-1">
          ← Πίσω στα Χωράφια
        </button>
        <h2 className="text-3xl font-extrabold">
          Διαχείριση Ζωνών: <span className="text-green-600">{field.name}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ΦΟΡΜΑ & ΛΙΣΤΑ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">{formData.id ? "✍️ Επεξεργασία" : "➕ Νέα Καλλιέργεια"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" required placeholder="Τύπος (π.χ. Ελιές)"
                className="w-full p-2 border rounded-lg"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              />
              <input 
                type="text" placeholder="Ποικιλία"
                className="w-full p-2 border rounded-lg"
                value={formData.variety}
                onChange={(e) => setFormData({...formData, variety: e.target.value})}
              />
              <input 
                type="date"
                className="w-full p-2 border rounded-lg"
                value={formData.plantingDate}
                onChange={(e) => setFormData({...formData, plantingDate: e.target.value})}
              />
              <button 
                type="submit" 
                disabled={formData.zoneBoundary.length === 0}
                className={`w-full py-2 rounded-lg font-bold text-white ${formData.zoneBoundary.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {formData.id ? "Ενημέρωση" : "Αποθήκευση"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y">
            {crops.map(crop => (
              <div key={crop.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{crop.type}</p>
                  <p className="text-xs text-gray-500">{crop.variety}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(crop)} className="text-blue-600 text-sm font-bold">Edit</button>
                  <button onClick={() => handleDelete(crop.id)} className="text-red-500 text-sm font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ΧΑΡΤΗΣ */}
        <div className="lg:col-span-7">
          <div className="bg-white p-2 rounded-3xl shadow-lg border">
            <MapComponent 
              parentBoundary={field?.boundary?.coordinates[0]} 
              boundary={formData.zoneBoundary}
              onPolygonComplete={(coords) => setFormData(prev => ({ ...prev, zoneBoundary: coords }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}