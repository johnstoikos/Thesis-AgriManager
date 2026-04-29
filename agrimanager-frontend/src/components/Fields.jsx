import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import MapComponent from "./MapComponent";
import * as turf from '@turf/turf';

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Προσθήκη id στο formData για να ξέρουμε αν επεξεργαζόμαστε υπάρχον χωράφι
  const [formData, setFormData] = useState({
    id: null, 
    name: "",
    area: "",
    boundary: [] 
  });

  // Φόρτωση των χωραφιών
  const fetchFields = useCallback(async () => {
    try {
      const res = await api.get("/api/fields");
      setFields(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    api.get("/api/fields")
      .then((res) => {
        if (!isMounted) return;
        setFields(res.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Σφάλμα φόρτωσης:", err);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const calculateAreaInStremmata = (boundaryCoords) => {
    if (!boundaryCoords || boundaryCoords.length < 4) return "";
    try {
      const polygon = turf.polygon([boundaryCoords]);
      return (turf.area(polygon) / 1000).toFixed(2);
    } catch (err) {
      console.error("Σφάλμα υπολογισμού έκτασης:", err);
      return "";
    }
  };

  // --- ΣΥΝΑΡΤΗΣΕΙΣ CRUD ---

  // 1. Προετοιμασία για Επεξεργασία (Update)
  const handleEdit = (field) => {
    setFormData({
      id: field.id,
      name: field.name,
      area: field.area,
      // Παίρνουμε το εσωτερικό array συντεταγμένων από το GeoJSON Polygon
      boundary: field.boundary.coordinates[0] 
    });
    setShowModal(true);
  };

  // 2. Διαγραφή Χωραφιού
  const handleDelete = async (id) => {
    if (window.confirm("Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό το χωράφι;")) {
      try {
        await api.delete(`/api/fields/${id}`);
        fetchFields(); 
      } catch (err) {
        console.error("Σφάλμα κατά τη διαγραφή:", err);
        alert("Αποτυχία διαγραφής.");
      }
    }
  };

  // 3. Υποβολή Φόρμας (Create ή Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const autoCalculatedArea = calculateAreaInStremmata(formData.boundary);

    const payload = {
      name: formData.name,
      area: parseFloat(autoCalculatedArea || formData.area),
      boundary: {
        type: "Polygon",
        coordinates: [formData.boundary]
      }
    };

    try {
      if (formData.id) {
        // Αν υπάρχει id, κάνουμε PUT (Update)
        await api.put(`/api/fields/${formData.id}`, payload);
      } else {
        // Αν δεν υπάρχει id, κάνουμε POST (Create)
        await api.post("/api/fields", payload);
      }
      
      setShowModal(false); 
      setFormData({ id: null, name: "", area: "", boundary: [] }); 
      fetchFields(); 
      alert(formData.id ? "Το χωράφι ενημερώθηκε!" : "Το χωράφι προστέθηκε!");
    } catch (err) {
      console.error("Σφάλμα αποθήκευσης:", err.response?.data);
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    }
  };

  // Χειροκίνητη εισαγωγή συντεταγμένων
  const handleManualCoordsChange = (text) => {
    try {
      const lines = text.split("\n").filter(line => line.trim() !== "");
      const coords = lines.map(line => {
        const parts = line.split(",");
        if (parts.length < 2) return null;
        return [parseFloat(parts[0].trim()), parseFloat(parts[1].trim())];
      }).filter(coord => coord !== null && !isNaN(coord[0]) && !isNaN(coord[1]));

      if (coords.length >= 3) {
        const closed = [...coords];
        if (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1]) {
          closed.push(closed[0]);
        }
        
        const poly = turf.polygon([closed]);
        const areaStremmata = (turf.area(poly) / 1000).toFixed(2);

        setFormData(prev => ({ 
          ...prev, 
          boundary: closed,
          area: areaStremmata 
        }));
      }
    } catch (err) {
      console.error("Λάθος μορφή συντεταγμένων:", err);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Τα Χωράφια μου</h2>
        <button 
          onClick={() => {
            setFormData({ id: null, name: "", area: "", boundary: [] }); // Reset για νέο χωράφι
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
        >
          + Προσθήκη Χωραφιού
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-center text-sm font-bold text-green-700">Φόρτωση χωραφιών...</div>
        ) : (
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Όνομα</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Στρέμματα</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Δεν βρέθηκαν χωράφια.</td></tr>
            ) : (
              fields.map(field => (
                <tr key={field.id}>
                  <td className="px-6 py-4 font-medium">{field.name}</td>
                  <td className="px-6 py-4">{field.area} στρ.</td>
                  <td className="px-6 py-4 flex gap-4">
                    <button 
                      onClick={() => handleEdit(field)}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      Επεξεργασία
                    </button>
                                        <button 
                      onClick={() => navigate(`/fields/${field.id}/crops`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md font-bold"
                    >
                      Καλλιέργειες
                    </button>
                    <button 
                      onClick={() => handleDelete(field.id)}
                      className="text-red-600 hover:underline font-bold"
                    >
                      Διαγραφή
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {formData.id ? "Επεξεργασία Χωραφιού" : "Νέο Χωράφι"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Όνομα</label>
                <input 
                  type="text" required
                  className="w-full mt-1 p-2 border rounded-md"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Έκταση (Στρέμματα)</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full mt-1 p-2 border rounded-md bg-gray-50 font-bold text-green-700"
                  value={formData.area || ""}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="Υπολογίζεται αυτόματα..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Σχεδίαση ή Προβολή στο Χάρτη
                </label>
                <MapComponent 
                  allFields={fields} 
                  boundary={formData.boundary} 
                  onPolygonComplete={(coords, calculatedArea) => {
                    setFormData(prev => ({
                      ...prev,
                      boundary: coords,
                      area: calculatedArea || calculateAreaInStremmata(coords)
                    }));
                  }} 
                />
              </div>  

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ή Επικόλληση Συντεταγμένων (lng, lat ανά γραμμή)
                </label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md text-xs font-mono bg-gray-50"
                  rows="3"
                  placeholder="21.7346, 38.2466&#10;21.7350, 38.2470..."
                  onChange={(e) => handleManualCoordsChange(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ id: null, name: "", area: "", boundary: [] });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Ακύρωση
                </button>
                <button 
                  type="submit"
                  disabled={formData.boundary.length === 0}
                  className={`px-4 py-2 rounded-md text-white font-bold transition ${formData.boundary.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {formData.id ? "Ενημέρωση" : "Αποθήκευση"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
