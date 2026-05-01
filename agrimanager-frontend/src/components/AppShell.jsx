import { createElement, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  Sprout,
  Sun,
  UserCircle2,
} from "lucide-react";
import { useAppPreferences } from "../i18n";
import { Button } from "./ui";

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("el-GR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const readAssistantContext = () => {
  try {
    const raw = window.localStorage.getItem("aiAssistantContext");
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Αδυναμία ανάγνωσης ειδοποιήσεων AI:", err);
    return {};
  }
};

const buildAssistantAlerts = (context = {}) => {
  const alerts = [];
  const tasks = Array.isArray(context.tasks) ? context.tasks : [];

  tasks.forEach((task) => {
    const taskLabel = task?.taskType || task?.name || task?.title || "εργασία";
    const dueDate = task?.dueDate || task?.deadline || task?.date || task?.due_date;
    const formattedDate = formatDate(dueDate);
    if (formattedDate) {
      alerts.push(`Έχεις να κάνεις ${taskLabel} μέχρι την ${formattedDate}`);
    }
  });

  const weatherCondition = context.weather?.condition || context.weather?.description || "";
  const conditionText = String(weatherCondition).toLowerCase();
  if (conditionText.includes("βροχ") || conditionText.includes("χαλάζ") || conditionText.includes("καταιγίδ")) {
    const todayDate = formatDate(new Date().toISOString());
    if (todayDate) {
      alerts.push(`Έχεις να κάνεις έλεγχο του καιρού μέχρι την ${todayDate}`);
    }
  }

  return alerts;
};

const navItems = [
  { to: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/fields", labelKey: "fields", icon: Map },
  { to: "/tasks", labelKey: "tasks", icon: Sprout },
  { to: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { to: "/profile", labelKey: "profile", icon: UserCircle2 },
];

function BellDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts] = useState(() => buildAssistantAlerts(readAssistantContext()));
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        onClick={() => setIsOpen((open) => !open)}
        variant="secondary"
        className="relative h-11 w-11 rounded-2xl p-0 text-slate-500 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {alerts.length > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
            {alerts.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="rounded-t-3xl border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">
            AI Assistant
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto p-4">
            {alerts.length > 0 ? (
              alerts.map((message, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  {message}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Δεν υπάρχουν ειδοποιήσεις αυτή τη στιγμή.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const { language, setLanguage, theme, toggleTheme, t } = useAppPreferences();

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-[1100] hidden w-72 border-r border-white/60 bg-emerald-950/95 px-4 py-5 text-white shadow-2xl backdrop-blur-md dark:border-emerald-800/60 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-white/15">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">AgriManager</p>
            <p className="text-xs font-semibold text-emerald-100/70">{t.shell.productSubtitle}</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                  isActive
                    ? "bg-white text-emerald-950 shadow-lg"
                    : "text-emerald-50/80 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              {createElement(item.icon, { className: "h-5 w-5" })}
              {t.nav[item.labelKey]}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100/70">{t.shell.account}</p>
          <div className="mt-3 flex items-center gap-3">
            <UserCircle2 className="h-9 w-9 text-emerald-100" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{t.shell.user}</p>
              <p className="text-xs text-emerald-100/70">{t.shell.activeSession}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="mt-4 w-full rounded-2xl bg-white/10 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            {t.shell.logout}
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-[1000] border-b border-white/60 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/75 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300 lg:hidden">
              <Sprout className="h-6 w-6" />
              AgriManager
            </NavLink>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
              {["el", "en"].map((code) => (
                <Button
                  key={code}
                  onClick={() => setLanguage(code)}
                  variant="ghost"
                  size="sm"
                  className={[
                    "h-9 min-w-10 rounded-xl px-2 text-xs font-black transition",
                    language === code
                      ? "bg-emerald-950 text-white dark:bg-emerald-500 dark:text-slate-950"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  {code.toUpperCase()}
                </Button>
              ))}
            </div>

            <Button
              onClick={toggleTheme}
              variant="secondary"
              className="h-11 w-11 rounded-2xl p-0 text-slate-500 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <BellDropdown />

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/tasks?view=calendar")}
              className="h-11 rounded-2xl px-3"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>
          <nav className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition",
                    isActive
                      ? "bg-emerald-950 text-white"
                      : "bg-white/80 text-slate-600 ring-1 ring-slate-200",
                  ].join(" ")
                }
              >
                {createElement(item.icon, { className: "h-4 w-4" })}
                {t.nav[item.labelKey]}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="h-[calc(100vh-121px)] overflow-y-auto px-4 py-6 md:px-6 lg:h-[calc(100vh-73px)]">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
