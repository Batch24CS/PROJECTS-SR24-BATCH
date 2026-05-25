import { LogOut, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import BrandLockup from "./BrandLockup";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { tabToPath } from "../utils/dashboardRoutes";
import { navigate } from "../utils/navigation";
import NotificationReturnBar from "./NotificationReturnBar";

export default function Layout({ title, subtitle, navItems, active, setActive, children }) {
  const { user, logout } = useAuth();

  function goToTab(id) {
    const path = tabToPath(user.role, id);
    navigate(path);
    setActive(id);
  }

  return (
    <div className="app-shell min-h-screen text-sweety-ink dark:text-white">
      <div className="app-shell-bg pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />

      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden w-72 flex-col lg:flex">
        <div className="shrink-0 px-6 pb-4 pt-5">
          <BrandLockup size="compact" />
        </div>
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 pb-6">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => goToTab(id)}
              className={`app-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200 ${
                active === id ? "app-nav-item-active" : ""
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="app-header sticky top-0 z-10 px-4 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200/80 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div>
                <h2 className="bg-gradient-to-r from-sweety-blue to-sweety-indigo bg-clip-text text-xl font-bold text-transparent md:text-2xl dark:from-sky-300 dark:to-indigo-300">
                  {title}
                </h2>
                <p className="text-sm text-muted">{subtitle}</p>
              </div>
            </div>
            <div className="hidden min-w-72 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 md:flex">
              <Search size={16} className="text-slate-400" />
              <span className="text-sm text-muted">Search modules, students, uploads</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle className="hidden sm:inline-flex" />
              <NotificationBell />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted">{user.role.toUpperCase()}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-500 shadow-sm transition hover:border-red-200 hover:text-sweety-red dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-x-hidden p-4 pb-24 md:p-8 lg:pb-8"
        >
          <NotificationReturnBar />
          {children}
        </motion.div>
      </main>

      {navItems.length > 0 && (
        <nav className="app-mobile-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 px-1 py-2 lg:hidden">
          {mobileItems(user.role, navItems).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => goToTab(id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition ${
                active === id ? "text-sweety-blue dark:text-sky-300" : "text-muted"
              }`}
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{shortLabel(label)}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function mobileItems(role, navItems) {
  if (role === "admin") return ["overview", "hodRequests", "hods", "faculty", "profile"].map((id) => navItems.find((item) => item.id === id)).filter(Boolean);
  const wanted =
    role === "student"
      ? ["overview", "attendance", "contact", "timetable", "profile"]
      : role === "hod"
        ? ["overview", "facultyManagement", "permissionRequests", "attendance", "profile"]
        : ["overview", "attendance", "messages", "requests", "profile"];
  return wanted.map((id) => navItems.find((item) => item.id === id)).filter(Boolean);
}

function shortLabel(label) {
  return label.replace("Registration Requests", "Requests").replace("Contact Faculty", "Chat").replace("Overview", "Home");
}
