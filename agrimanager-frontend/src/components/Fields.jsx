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
  
  const [formData, setFormData] = useState({
    id: null, 
    name: "",
    area: "",
    boundary: [] 
  });

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
    fetchFields();
  }, [fetchFields]);

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

  const handleEdit = (field) => {
    setFormData({
      id: field.id,
      name: field.name,
      area: field.area,
      boundary: field.boundary.coordinates[0] 
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(labels.deleteConfirm || "Είσαι σίγουρος για τη διαγραφή;")) {
      try {
        await api.delete(`/api/fields/${id}`);
        setFields((prev) => prev.filter((field) => field.id !== id));
      } catch (err) {
        console.error("Σφάλμα κατά τη διαγραφή:", err);
        alert(labels.deleteError || "Η διαγραφή απέτυχε.");
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.name) return alert("Το όνομα είναι υποχρεωτικό");
    if (formData.boundary.length === 0) return alert("Πρέπει να σχεδιάσετε το χωράφι στο χάρτη");

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
        await api.put(`/api/fields/${formData.id}`, payload);
      } else {
        await api.post("/api/fields", payload);
      }
      
      setShowModal(false); 
      setFormData({ id: null, name: "", area: "", boundary: [] }); 
      fetchFields(); 
    } catch (err) {
      console.error("Σφάλμα αποθήκευσης:", err.response?.data);
      alert(labels.saveError || "Σφάλμα κατά την αποθήκευση.");
    }
  };

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
        setFormData(prev => ({ ...prev, boundary: closed }));
      }
    } catch { /* ignore parse errors */ }
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Surface className="p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              {labels.eyebrow || "ΔΙΑΧΕΙΡΙΣΗ"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {labels.title || "Τα Χωράφια μου"}
            </h2>
          </div>
          <Button onClick={() => { setFormData({ id: null, name: "", area: "", boundary: [] }); setShowModal(true); }}>
            + {labels.addField || "Προσθήκη Χωραφιού"}
          </Button>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{labels.name || "Όνομα"}</th>
              <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{labels.area || "Έκταση"}</th>
              <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{labels.actions || "Ενέργειες"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
            {loading && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {labels.loading || "Loading fields..."}
                </td>
              </tr>
            )}
            {fields.map(field => (
              <tr key={field.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5">
                <td className="px-6 py-4 font-medium dark:text-slate-100">{field.name}</td>
                <td className="px-6 py-4 dark:text-slate-300">{field.area} στρ.</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {/* Χρήση labels.edit για τη μετάφραση "Επεξεργασία" */}
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(field)}>
                      {labels.edit || "Edit"}
                    </Button>
                    
                    {/* Χρήση labels.crops για τη μετάφραση "Καλλιέργειες" */}
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/fields/${field.id}/crops`)}>
                      {labels.crops || "Crops"}
                    </Button>
                    
                    {/* Χρήση labels.delete για τη μετάφραση "Διαγραφή" */}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(field.id)}>
                      {labels.delete || "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>

      {showModal && (
        <ModalShell
          title={formData.id ? labels.editField : labels.newField}
          description={labels.modalDescription}
          onClose={() => setShowModal(false)}
          cancelText={labels.cancel || "Cancel"}
          size="xl"
        >
          <form id="field-form" onSubmit={handleSubmit} className="flex min-h-[75vh] flex-col lg:flex-row">
            <div className="flex flex-col gap-6 border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 lg:w-1/3 lg:border-b-0 lg:border-r lg:p-8">
              <div className="space-y-3">
                <FieldLabel>{labels.name}</FieldLabel>
                <FieldInput
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={labels.name}
                  className="h-14 shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <FieldLabel>{labels.areaLabel}</FieldLabel>
                <FieldInput
                  type="number" step="0.01"
                  value={formData.area || ""}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder={labels.autoAreaPlaceholder}
                  className="h-14 bg-white font-bold dark:bg-slate-800/50"
                />
              </div>

              <div className="space-y-3">
                <FieldLabel>{labels.coordsLabel}</FieldLabel>
                <textarea
                  className="min-h-40 w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 font-mono text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  placeholder="21.73, 38.24"
                  onChange={(e) => handleManualCoordsChange(e.target.value)}
                />
              </div>

              <div className="mt-auto pt-4">
                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  className="h-14 w-full text-base shadow-lg shadow-emerald-600/20"
                  disabled={!formData.name || formData.boundary.length === 0}
                >
                  {formData.id ? labels.update : labels.save}
                </Button>
              </div>
            </div>

            <div className="flex min-h-[520px] flex-col gap-4 p-6 lg:w-2/3 lg:p-8">
              <FieldLabel>{labels.mapLabel}</FieldLabel>
              <div className="min-h-[460px] flex-1 overflow-hidden rounded-[32px] border border-slate-200 shadow-2xl dark:border-slate-800">
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
          </form>
        </ModalShell>
      )}
    </div>
  );
}
