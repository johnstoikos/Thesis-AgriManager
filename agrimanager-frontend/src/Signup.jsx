import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api/axios";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    // Πρόσθεσε εδώ όποιο άλλο πεδίο έχει το UserRegistrationDTO σου
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    try {
      const response = await api.post("/api/auth/register", formData);
      setMessage(response.data); // "Επιτυχής εγγραφή! ID: ..."
      
      // Μετά από 2 δευτερόλεπτα στείλε τον χρήστη στο login
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data || "Κάτι πήγε στραβά στην εγγραφή.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 shadow-xl rounded-2xl border-2 border-green-500 w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">Νέος Λογαριασμός 🚜</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          {message && <p className="text-green-600 text-sm font-semibold">{message}</p>}

          <button 
            type="submit" 
            className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 transition duration-200"
          >
            Εγγραφή
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Είστε ήδη μέλος; <Link to="/login" className="text-green-600 font-bold hover:underline">Συνδεθείτε εδώ</Link>
        </p>
      </div>
    </div>
  );
}