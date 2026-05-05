import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/auth-context";
import { Button } from "../ui";

function Layout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-xl rounded-2xl border-2 border-green-500 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/auth/login", { username, password });
      const { token } = response.data;

      const profile = await loginWithToken(token, rememberMe);
      if (!profile) {
        setError("Η σύνδεση πέτυχε, αλλά δεν ήταν δυνατή η φόρτωση του προφίλ.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Σφάλμα σύνδεσης:", err);
      setError("Λάθος στοιχεία ή πρόβλημα σύνδεσης");
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">AgriManager</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-gray-700">Username</label>
          <input 
            type="text" 
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Password</label>
          <input 
            type="password" 
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember Me
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          type="submit" 
          className="w-full"
        >
          Είσοδος
        </Button>
        <Link to="/signup" className="text-sm text-green-600 mt-4 block text-center hover:underline">
          Δεν έχετε λογαριασμό; Εγγραφείτε!
        </Link>
      </form>
    </Layout>
  );
}
