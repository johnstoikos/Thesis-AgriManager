import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/auth-context";
import { getHomePath } from "../../utils/auth";
import { useAppPreferences } from "../../i18n";
import { Button } from "../ui";
import { AuthLayout } from "./Login";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { t } = useAppPreferences();
  const labels = t.auth || {};

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
        setError(labels.signupProfileLoadError || "Registration succeeded, but automatic sign-in failed.");
        return;
      }

      navigate(getHomePath(profile), { replace: true });
    } catch (err) {
      const backendMessage = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message;
      setError(backendMessage || labels.signupError || "Something went wrong during registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-6 text-center text-3xl font-black text-emerald-700 dark:text-emerald-300">{labels.signupTitle || "Create account"}</h1>
        
      <form onSubmit={handleSignup} className="space-y-4">
        <input 
          type="text" 
          placeholder={labels.username || "Username"}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-950 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
        <input 
          type="email" 
          placeholder={labels.email || "Email"}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-950 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input 
          type="password" 
          placeholder={labels.password || "Password"}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-950 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        <Button
          type="submit" 
          className="w-full"
          disabled={submitting}
        >
          {submitting ? labels.signupSubmitting || "Creating account..." : labels.signupButton || "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {labels.loginPrompt || "Already have an account?"}{" "}
        <Link to="/login" className="font-bold text-emerald-700 hover:underline dark:text-emerald-300">
          {labels.loginLink || "Sign in here"}
        </Link>
      </p>
    </AuthLayout>
  );
}
