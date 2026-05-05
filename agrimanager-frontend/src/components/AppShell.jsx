import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Droplets,
  LayoutDashboard,
  Leaf,
  LogOut,
  Map,
  Moon,
  Settings,
  Shield,
  Sprout,
  Sun,
  Tractor,
  UserCircle2,
  Wind,
  Wrench,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/auth-context";
import { useAppPreferences } from "../i18n";
import { Button, Popover, Switch } from "./ui";

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

const navItems = [
  { to: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/fields", labelKey: "fields", icon: Map },
  { to: "/tasks", labelKey: "tasks", icon: Sprout },
  { to: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { to: "/profile", labelKey: "profile", icon: UserCircle2 },
];

const dateKey = (date) => {
  const current = new Date(date);
  if (Number.isNaN(current.getTime())) return "";
  return [
    current.getFullYear(),
    String(current.getMonth() + 1).padStart(2, "0"),
    String(current.getDate()).padStart(2, "0"),
  ].join("-");
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

function getNotificationIcon(taskType = "") {
  const type = String(taskType).toLowerCase();
  if (type.includes("ποτ")) return Droplets;
  if (type.includes("ψεκ")) return Wind;
  if (type.includes("λιπ")) return Leaf;
  if (type.includes("συγ")) return Sprout;
  if (type.includes("κλαδ")) return Wrench;
  if (type.includes("βροχ") || type.includes("καιρ")) return CloudRain;
  if (type.includes("προστα") || type.includes("ασθεν")) return Shield;
  return Tractor;
}

function getNotificationTone(taskType = "") {
  const type = String(taskType).toLowerCase();
  if (type.includes("ψεκ")) return "warning";
  if (type.includes("ποτ")) return "info";
  return "success";
}

const notificationToneClasses = {
  info: {
    card: "border-l-sky-500 bg-sky-50/80 dark:bg-sky-950/25",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    meta: "text-sky-700 dark:text-sky-300",
  },
  warning: {
    card: "border-l-amber-500 bg-amber-50/90 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    meta: "text-amber-700 dark:text-amber-300",
  },
  success: {
    card: "border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/20",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    meta: "text-emerald-700 dark:text-emerald-300",
  },
};

function BellDropdown({ label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useOutsideClose(dropdownRef, () => setIsOpen(false));

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/tasks/notifications");
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης ειδοποιήσεων εργασιών:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCheck = async (taskId) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Σφάλμα ολοκλήρωσης εργασίας από ειδοποίηση:", err);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) fetchNotifications();
        }}
        variant="secondary"
        className="relative h-12 w-12 rounded-full p-3 text-slate-500 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
        aria-label={label}
      >
        <Bell className="h-6 w-6" />
        {tasks.length > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
            {tasks.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <Popover className="w-[calc(100vw-2rem)] sm:w-[420px] sm:max-w-[420px]">
          <div className="rounded-t-3xl border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-black text-slate-950 dark:text-slate-100">{label}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {tasks.length ? `${tasks.length} επείγουσες εργασίες` : "Δεν υπάρχουν επείγουσες εργασίες"}
            </p>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading...</p>
            ) : tasks.length > 0 ? (
              tasks.map((task) => {
                const Icon = getNotificationIcon(task.taskType);
                const tone = notificationToneClasses[getNotificationTone(task.taskType)];
                return (
                  <article
                    key={task.id}
                    className={`rounded-2xl border border-slate-200 border-l-4 p-4 shadow-sm dark:border-slate-800 ${tone.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {task.taskType || "Task"}
                          </h3>
                          <span className={`text-[11px] font-black uppercase tracking-wide ${tone.meta}`}>
                            {formatDate(task.taskDate) || "No date"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {task.description || "Εκκρεμής εργασία που χρειάζεται έλεγχο."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleCheck(task.id)}
                        variant="success"
                        size="sm"
                        className="shrink-0 rounded-xl"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Check
                      </Button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Δεν υπάρχουν ειδοποιήσεις αυτή τη στιγμή.</p>
            )}
          </div>
        </Popover>
      )}
    </div>
  );
}

function SettingsPopover({ onLogout }) {
  const { language, setLanguage, theme, toggleTheme, t } = useAppPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useOutsideClose(popoverRef, () => setIsOpen(false));

  return (
    <div ref={popoverRef} className="relative">
      <Button
        onClick={() => setIsOpen((open) => !open)}
        variant="secondary"
        className="h-12 w-12 rounded-full p-3 text-slate-500 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
        aria-label={t.shell.settings}
      >
        <Settings className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Popover>
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-black text-slate-950 dark:text-slate-100">{t.shell.settings}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.shell.appearance}</p>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">{t.shell.darkMode}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{theme === "dark" ? "Dark" : "Light"}</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onChange={toggleTheme} aria-label={t.shell.darkMode} />
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t.shell.language}
              </p>
              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
                {["el", "en"].map((code) => (
                  <Button
                    key={code}
                    onClick={() => setLanguage(code)}
                    variant="ghost"
                    size="sm"
                    className={[
                      "h-10 rounded-xl shadow-none",
                      language === code
                        ? "bg-emerald-950 text-white hover:bg-emerald-950 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-500"
                        : "text-slate-600 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {code.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <Button onClick={onLogout} variant="danger" className="w-full">
              <LogOut className="h-4 w-4" />
              {t.shell.logout}
            </Button>
          </div>
        </Popover>
      )}
    </div>
  );
}

function CalendarPopover() {
  const { language, t } = useAppPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const popoverRef = useRef(null);

  useOutsideClose(popoverRef, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen || loaded) return;

    let isMounted = true;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const fieldsRes = await api.get("/api/fields");
        const fields = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        const cropsByFieldResults = await Promise.allSettled(
          fields.map((field) => api.get(`/api/crops/field/${field.id}`))
        );

        const crops = [];
        const cropLookup = {};
        cropsByFieldResults.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const field = fields[index];
          const fieldCrops = Array.isArray(result.value?.data) ? result.value.data : [];
          fieldCrops.forEach((crop) => {
            crops.push(crop);
            cropLookup[crop.id] = {
              cropName: crop.type || `Crop #${crop.id}`,
              fieldName: field.name || `Field #${field.id}`,
            };
          });
        });

        const tasksByCropResults = await Promise.allSettled(
          crops.map((crop) => api.get(`/api/tasks/crop/${crop.id}`))
        );
        const mergedTasks = [];
        tasksByCropResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const cropTasks = Array.isArray(result.value?.data) ? result.value.data : [];
          cropTasks.forEach((task) => mergedTasks.push({ ...task, cropInfo: cropLookup[task.cropId] }));
        });

        if (isMounted) {
          setTasks(mergedTasks);
          setLoaded(true);
        }
      } catch (err) {
        console.error("Σφάλμα φόρτωσης mini calendar:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, [isOpen, loaded]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks
      .filter((task) => task.taskDate && new Date(task.taskDate) >= today)
      .sort((a, b) => new Date(a.taskDate) - new Date(b.taskDate))
      .slice(0, 5);
  }, [tasks]);

  const taskDates = useMemo(() => new Set(tasks.map((task) => dateKey(task.taskDate)).filter(Boolean)), [tasks]);
  const monthDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const mondayOffset = (firstDay + 6) % 7;
    return [
      ...Array.from({ length: mondayOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [visibleMonth]);

  const formatterLocale = language === "el" ? "el-GR" : "en-US";
  const goToPreviousMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  return (
    <div ref={popoverRef} className="relative">
      <Button
        onClick={() => setIsOpen((open) => !open)}
        variant="secondary"
        className="h-12 w-12 rounded-full p-3 text-slate-500 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
        aria-label={t.shell.calendar}
      >
        <CalendarDays className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Popover className="sm:w-[420px] sm:max-w-[420px]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <Button
              type="button"
              onClick={goToPreviousMonth}
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full p-0"
              aria-label={t.tasks?.previous || "Previous"}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 text-center">
              <p className="text-sm font-black text-slate-950 dark:text-slate-100">{t.shell.calendar}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {visibleMonth.toLocaleDateString(formatterLocale, { month: "long", year: "numeric" })}
              </p>
            </div>
            <Button
              type="button"
              onClick={goToNextMonth}
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full p-0"
              aria-label={t.tasks?.next || "Next"}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-slate-400">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((day, index) => {
                const isToday = day && dateKey(day) === dateKey(new Date());
                const hasTask = day && taskDates.has(dateKey(day));
                return (
                  <div
                    key={day ? dateKey(day) : `blank-${index}`}
                    className={[
                      "relative flex aspect-square items-center justify-center rounded-xl text-xs font-bold",
                      day ? "text-slate-700 dark:text-slate-200" : "",
                      isToday ? "bg-emerald-950 text-white dark:bg-emerald-500 dark:text-slate-950" : "bg-slate-50 dark:bg-slate-900",
                    ].join(" ")}
                  >
                    {day ? day.getDate() : ""}
                    {hasTask && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t.shell.upcomingTasks}
              </p>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {loading ? (
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading...</p>
                ) : upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                            {task.taskType || "Task"}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {task.cropInfo?.fieldName || task.cropInfo?.cropName || ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-emerald-300 dark:ring-slate-700">
                          {formatDate(task.taskDate)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.shell.noUpcomingTasks}</p>
                )}
              </div>
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
}

function UserAvatar({ profile, className = "h-10 w-10", iconClassName = "h-6 w-6" }) {
  const avatar = profile?.profilePhoto || profile?.avatarUrl || "";
  const name = profile?.fullName || profile?.name || "AgriManager User";

  return (
    <span className={[
      "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-white/20",
      className,
    ].join(" ")}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover" decoding="async" />
      ) : (
        <UserCircle2 className={iconClassName} />
      )}
    </span>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const { t } = useAppPreferences();
  const { clearAuth, user } = useAuth();
  const profile = user || {};

  const userName = profile.fullName || profile.name || profile.username || t.shell.user;

  const handleLogout = () => {
    clearAuth();
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
          <div className="flex items-center gap-3">
            <UserAvatar profile={profile} className="h-11 w-11" iconClassName="h-8 w-8" />
            <p className="min-w-0 truncate text-sm font-black">{userName}</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-[1000] border-b border-white/60 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/75 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300 lg:hidden">
              <Sprout className="h-6 w-6" />
              AgriManager
            </NavLink>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <BellDropdown label={t.shell.notifications} />
              <CalendarPopover />
              <SettingsPopover onLogout={handleLogout} />
            </div>
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
