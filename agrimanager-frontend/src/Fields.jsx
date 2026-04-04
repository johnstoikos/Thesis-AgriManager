import { useState, useEffect } from "react";
import api from "./api/axios";

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State για τη φόρμα
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    boundary: null // Θα το φτιάξουμε με τον χάρτη αργότερα
  });

  // 1. Φόρτωση των χωραφιών
  const fetchFields = async () => {
    try {
      const res = await api.get("/api/fields");
      setFields(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchFields(); }, []);

  // 2. Υποβολή της φόρμας
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/fields", formData);
      setShowModal(false); // Κλείσιμο modal
      setFormData({ name: "", area: "", boundary: null }); // Reset φόρμας
      fetchFields(); // Ανανέωση λίστας
      alert("Το χωράφι προστέθηκε επιτυχώς!");
    } catch (err) {
      console.error("Σφάλμα αποθήκευσης:", err);
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Τα Χωράφια μου</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
        >
          + Προσθήκη Χωραφιού
        </button>
      </div>

      {/* Πίνακας Χωραφιών */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Όνομα</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Στρέμματα</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.map(field => (
              <tr key={field.id}>
                <td className="px-6 py-4 font-medium">{field.name}</td>
                <td className="px-6 py-4">{field.area}</td>
                <td className="px-6 py-4">
                  <button className="text-red-600 hover:underline">Διαγραφή</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL ΦΟΡΜΑΣ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
            <h3 className="text-xl font-bold mb-4">Νέο Χωράφι</h3>
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
                  type="number" step="0.1" required
                  className="w-full mt-1 p-2 border rounded-md"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Ακύρωση
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Αποθήκευση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}