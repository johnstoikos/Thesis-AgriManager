import { createElement, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Languages,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sprout,
  Sun,
  UsersRound,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useTheme } from "../context/ThemeContext";
import { useAppPreferences } from "../i18n";
import AiAssistantWidget from "./AiAssistantWidget";
import { Button, Popover, Switch } from "./ui";

const adminLabels = {
  el: {
    overview: "Επισκόπηση Πλατφόρμας",
    crops: "Στατιστικά Καλλιεργειών",
    users: "Διαχείριση Χρηστών",
    console: "Admin Console",
    admin: "Διαχειριστής",
  },
  en: {
    overview: "Platform Overview",
    crops: "Crop Statistics",
    users: "User Management",
    console: "Admin Console",
    admin: "Administrator",
  },
};

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, ref]);
}

function SettingsDropdown({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useAppPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isDark = theme === "dark";

  useOutsideClose(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        variant="secondary"
        className="h-11 w-11 rounded-full p-2.5 sm:h-12 sm:w-12"
        aria-label={t.shell.settings}
        title={t.shell.settings}
      >
        <SettingsIcon className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Popover className="w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-black text-slate-950 dark:text-slate-100">{t.shell.settings}</p>
          </div>

          <div className="space-y-3 p-3">
            <div className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900 dark:text-slate-100">{t.shell.appearance}</span>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isDark ? "Dark" : "Light"}
                  </span>
                </span>
              </span>
              <Switch checked={isDark} onChange={toggleTheme} aria-label={t.shell.darkMode} />
            </div>

            <div className="rounded-xl px-3 py-2.5">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Languages className="h-5 w-5" />
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{t.shell.language}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: "el", label: "Ελληνικά" },
                  { code: "en", label: "English" },
                ].map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setLanguage(option.code)}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-black transition",
                      language === option.code
                        ? "bg-emerald-950 text-white dark:bg-cyan-300 dark:text-slate-950"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="button" onClick={onLogout} variant="danger" className="w-full justify-center rounded-xl">
              <LogOut className="h-4 w-4" />
              {t.shell.logout}
            </Button>
          </div>
        </Popover>
      )}
    </div>
  );
}

export default function AdminShell() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { language } = useAppPreferences();
  const labels = adminLabels[language] || adminLabels.el;
  const adminName = user?.fullName || user?.username || "Administrator";
  const adminNavItems = [
    { to: "/admin/dashboard", label: labels.overview, icon: LayoutDashboard },
    { to: "/admin/crops-dist", label: labels.crops, icon: BarChart3 },
    { to: "/admin/users", label: labels.users, icon: UsersRound },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-[1100] hidden w-72 border-r border-slate-200 bg-slate-950 px-4 py-5 text-white shadow-2xl dark:border-slate-800 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-white/15">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">AgriManager</p>
            <p className="text-xs font-semibold text-slate-300">{labels.console}</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                  isActive
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              {createElement(item.icon, { className: "h-5 w-5" })}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
              <UserCircle2 className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{adminName}</p>
              <p className="text-xs font-semibold text-slate-300">{labels.admin}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-[1000] border-b border-white/60 bg-white/75 px-3 py-3 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/75 sm:px-4 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <NavLink to="/admin/dashboard" className="flex min-w-0 items-center gap-2 font-black text-slate-900 dark:text-slate-100 lg:hidden">
              <Sprout className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              <span>Admin</span>
            </NavLink>
            <div className="ml-auto flex items-center gap-2">
              <SettingsDropdown onLogout={handleLogout} />
            </div>
          </div>
          <nav className="mx-auto mt-3 flex max-w-7xl gap-3 overflow-x-auto px-1 pb-1 lg:hidden">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition",
                    isActive
                      ? "bg-slate-950 text-white dark:bg-cyan-300 dark:text-slate-950"
                      : "bg-white/80 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800",
                  ].join(" ")
                }
              >
                {createElement(item.icon, { className: "h-4 w-4" })}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="py-6 md:py-8">
          <Outlet />
        </main>
      </div>
      <AiAssistantWidget />
    </div>
  );
}
