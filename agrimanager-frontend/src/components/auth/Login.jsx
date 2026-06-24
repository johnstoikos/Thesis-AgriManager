import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Languages, Moon, ShieldCheck, Sun } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/auth-context";
import { getHomePath } from "../../utils/auth";
import { useAppPreferences } from "../../i18n";
import { Button, Switch } from "../ui";

export function AuthPreferences() {
  const { language, setLanguage, theme, toggleTheme, t } = useAppPreferences();
  const isDark = theme === "dark";

  return (
    <div className="fixed right-4 top-4 z-20 flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <span className="sr-only">{t.shell.appearance}</span>
        {isDark ? (
          <Moon className="h-4 w-4 text-emerald-300" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
        <Switch checked={isDark} onChange={toggleTheme} aria-label={t.shell.darkMode} />
      </div>

      <div className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/80 p-1 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <Languages className="ml-2 h-4 w-4 text-slate-500 dark:text-slate-300" />
        {[
          { code: "el", label: "EL" },
          { code: "en", label: "EN" },
        ].map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            className={[
              "rounded-xl px-3 py-1.5 text-xs font-black transition",
              language === option.code
                ? "bg-emerald-950 text-white dark:bg-emerald-400 dark:text-slate-950"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            ].join(" ")}
            aria-pressed={language === option.code}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  const { t } = useAppPreferences();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <AuthPreferences />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_30%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/35">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-100">AgriManager</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.shell.productSubtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { t } = useAppPreferences();
  const labels = t.auth || {};
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(() => sessionStorage.getItem("authErrorMessage") || "");

  useEffect(() => {
    sessionStorage.removeItem("authErrorMessage");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/api/auth/login", { username, password });
      const { token } = response.data;

      const profile = await loginWithToken(token, rememberMe);
      if (!profile) {
        setError(labels.profileLoadError || "Login succeeded, but the profile could not be loaded.");
        return;
      }

      navigate(getHomePath(profile), { replace: true });
    } catch (err) {
      console.error("Σφάλμα σύνδεσης:", err);
      const backendMessage = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message;
      setError(backendMessage || labels.loginError || "Wrong credentials or connection problem.");
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-6 text-center text-3xl font-black text-emerald-700 dark:text-emerald-300">{labels.loginTitle || "Sign in"}</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{labels.username || "Username"}</label>
          <input 
            type="text" 
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-950 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{labels.password || "Password"}</label>
          <input 
            type="password" 
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-950 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          {labels.rememberMe || "Remember me"}
        </label>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        <Button
          type="submit" 
          className="w-full"
        >
          {labels.loginButton || "Sign in"}
        </Button>
        <Link to="/signup" className="mt-4 block text-center text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-300">
          {labels.signupLink || "No account? Sign up."}
        </Link>
      </form>
    </AuthLayout>
  );
}
