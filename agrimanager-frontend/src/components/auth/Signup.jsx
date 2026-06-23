import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/auth-context";
import { getHomePath } from "../../utils/auth";
import { Button } from "../ui";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    // Πρόσθεσε εδώ όποιο άλλο πεδίο έχει το UserRegistrationDTO σου
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    try {
      await api.post("/api/auth/register", formData);
      const loginResponse = await api.post("/api/auth/login", {
        username: formData.username,
        password: formData.password,
      });
      const profile = await loginWithToken(loginResponse.data?.token);

      if (!profile) {
        setError("Η εγγραφή πέτυχε, αλλά δεν ήταν δυνατή η αυτόματη σύνδεση.");
        return;
      }

      navigate(getHomePath(profile), { replace: true });
    } catch (err) {
      const backendMessage = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message;
      setError(backendMessage || "Κάτι πήγε στραβά στην εγγραφή.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 shadow-xl rounded-2xl border-2 border-green-500 w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">Νέος Λογαριασμός</h1>
        
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
          <Button
            type="submit" 
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Εγγραφή..." : "Εγγραφή"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Είστε ήδη μέλος; <Link to="/login" className="text-green-600 font-bold hover:underline">Συνδεθείτε εδώ</Link>
        </p>
      </div>
    </div>
  );
}
