import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import MapComponent from "./MapComponent";
import * as turf from '@turf/turf';
import { Button, FieldInput, FieldLabel, ModalShell, Surface } from "./ui";
import { useAppPreferences } from "../i18n";

export default function Fields() {
  const { t } = useAppPreferences();
  const labels = t.fields || {};
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
    if (window.confirm(labels.deleteConfirm || "Are you sure you want to delete this field?")) {
      try {
        await api.delete(`/api/fields/${id}`);
        setFields((prev) => prev.filter((field) => field.id !== id));
      } catch (err) {
        console.error("Σφάλμα κατά τη διαγραφή:", err);
        if (err?.response?.status === 400) {
          alert(labels.cascadeError || "Delete failed.");
          return;
        }
        alert(labels.deleteError || "Delete failed.");
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
      alert(formData.id ? labels.updated || "Field updated." : labels.created || "Field added.");
    } catch (err) {
      console.error("Σφάλμα αποθήκευσης:", err.response?.data);
      alert(labels.saveError || "Something went wrong while saving.");
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
    <div className="space-y-6">
      <Surface className="p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{labels.eyebrow || "Field management"}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{labels.title || "My Fields"}</h2>
            <p className="mt-2 text-sm text-slate-500">{labels.description || "View and manage fields."}</p>
          </div>
          <Button
          onClick={() => {
            setFormData({ id: null, name: "", area: "", boundary: [] }); // Reset για νέο χωράφι
            setShowModal(true);
          }}
        >
          + {labels.addField || "Add Field"}
          </Button>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-center text-sm font-bold text-green-700">{labels.loading || "Loading fields..."}</div>
        ) : (
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{labels.name || "Name"}</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{labels.area || "Area"}</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{labels.actions || "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">{labels.noFields || "No fields found."}</td></tr>
            ) : (
              fields.map(field => (
                <tr key={field.id}>
                  <td className="px-6 py-4 font-medium">{field.name}</td>
                  <td className="px-6 py-4">{field.area} {labels.stremmataShort || "strem."}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleEdit(field)}
                      variant="secondary"
                      size="sm"
                    >
                      {labels.edit || "Edit"}
                    </Button>
                    <Button
                      onClick={() => navigate(`/fields/${field.id}/crops`)}
                      variant="secondary"
                      size="sm"
                      className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                    >
                      {labels.crops || "Crops"}
                    </Button>
                    <Button
                      onClick={() => handleDelete(field.id)}
                      variant="danger"
                      size="sm"
                    >
                      {labels.delete || "Delete"}
                    </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </Surface>

      {showModal && (
        <ModalShell
          title={formData.id ? labels.editField || "Edit Field" : labels.newField || "New Field"}
          description={labels.modalDescription || "Fill in the details and draw the field boundary on the map."}
          onClose={() => {
            setShowModal(false);
            setFormData({ id: null, name: "", area: "", boundary: [] });
          }}
          size="lg"
          className="max-h-[92vh] flex flex-col"
        >
          <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <FieldLabel>{labels.name || "Name"}</FieldLabel>
                <FieldInput
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <FieldLabel>{labels.areaLabel || "Area (Stremmata)"}</FieldLabel>
                <FieldInput
                  type="number" step="0.01" required
                  className="bg-slate-50 font-bold text-emerald-700"
                  value={formData.area || ""}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder={labels.autoAreaPlaceholder || "Calculated automatically..."}
                />
              </div>

              <div>
                <FieldLabel>{labels.mapLabel || "Draw or View on Map"}</FieldLabel>
                <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-200">
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
              </div>

              <div>
                <FieldLabel>{labels.coordsLabel || "Or Paste Coordinates (lng, lat per line)"}</FieldLabel>
                <textarea 
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/60"
                  rows="3"
                  placeholder="21.7346, 38.2466&#10;21.7350, 38.2470..."
                  onChange={(e) => handleManualCoordsChange(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={formData.boundary.length === 0}
                >
                  {formData.id ? labels.update || "Update" : labels.save || "Save"}
                </Button>
              </div>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
