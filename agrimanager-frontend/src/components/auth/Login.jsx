import { Link } from "react-router-dom";
import { useState } from "react";
import api from "../../api/axios";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/auth/login", { username, password });
      localStorage.setItem("jwt", response.data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Λάθος στοιχεία ή πρόβλημα σύνδεσης");
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">AgriManager 🚜</h1>
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200 font-bold"
        >
          Είσοδος
        </button>
        <Link to="/signup" className="text-sm text-green-600 mt-4 block text-center hover:underline">
          Δεν έχετε λογαριασμό; Εγγραφείτε!
        </Link>
      </form>
    </Layout>
  );
}