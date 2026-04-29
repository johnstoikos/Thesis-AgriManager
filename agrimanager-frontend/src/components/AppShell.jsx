import { createElement } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Map,
  Search,
  Sprout,
  UserCircle2,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Αρχική", icon: LayoutDashboard },
  { to: "/fields", label: "Χωράφια", icon: Map },
  { to: "/tasks", label: "Εργασίες", icon: Sprout },
  { to: "/analytics", label: "Στατιστικά", icon: BarChart3 },
  { to: "/profile", label: "Προφίλ", icon: UserCircle2 },
];

export default function AppShell() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-[900] hidden w-72 border-r border-white/60 bg-emerald-950/95 px-4 py-5 text-white shadow-2xl backdrop-blur-md lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-white/15">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">AgriManager</p>
            <p className="text-xs font-semibold text-emerald-100/70">Ψηφιακή γεωργία</p>
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
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100/70">Λογαριασμός</p>
          <div className="mt-3 flex items-center gap-3">
            <UserCircle2 className="h-9 w-9 text-emerald-100" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">Χρήστης AgriManager</p>
              <p className="text-xs text-emerald-100/70">Ενεργή σύνδεση</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Αποσύνδεση
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-[850] border-b border-white/60 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md md:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-2 font-black text-emerald-800 lg:hidden">
              <Sprout className="h-6 w-6" />
              AgriManager
            </NavLink>

            <div className="relative ml-auto hidden flex-1 max-w-xl md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Αναζήτηση σε χωράφια, εργασίες ή καλλιέργειες..."
                className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <button className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-slate-500 shadow-sm transition hover:text-emerald-700">
              <Bell className="h-5 w-5" />
            </button>
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
                {item.label}
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
