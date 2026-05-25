import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { tabToPath } from "../utils/dashboardRoutes";
import { clearNotificationReturn, navigate, navigateBack, navigateFromNotification } from "../utils/navigation";

function parseMetadata(item) {
  if (!item) return {};
  if (typeof item.metadata === "object" && item.metadata) return item.metadata;
  if (item.metadata_json) {
    try {
      return typeof item.metadata_json === "string" ? JSON.parse(item.metadata_json) : item.metadata_json;
    } catch (_error) {
      return {};
    }
  }
  return {};
}

function isAbsentNotification(item) {
  const meta = parseMetadata(item);
  return item.type === "attendance" && (meta.status === "absent" || String(item.title || "").toLowerCase().includes("absent"));
}

function absentClassLabel(item) {
  const meta = parseMetadata(item);
  const subject = meta.subjectName || meta.subject || "Class";
  const period = meta.periodNumber ? `Period ${meta.periodNumber}` : "";
  const date = meta.attendanceDate ? String(meta.attendanceDate).slice(0, 10) : "";
  return [subject, period, date].filter(Boolean).join(" · ");
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/notifications");
      setItems(data || []);
      await api.put("/notifications/read-all");
    }
    load();
  }, []);

  const visible = items.filter((item) =>
    `${item.title} ${item.message} ${item.type} ${absentClassLabel(item)}`.toLowerCase().includes(search.toLowerCase())
  );

  const absentClasses = useMemo(() => {
    if (user?.role !== "student") return [];
    return items.filter(isAbsentNotification).map((item) => ({ id: item.id, label: absentClassLabel(item), item }));
  }, [items, user?.role]);

  async function open(item) {
    await api.put(`/notifications/${item.id}/read`);
    if (item.link_path) {
      navigateFromNotification(item.link_path);
    }
  }

  function handleBack() {
    clearNotificationReturn();
    navigateBack(tabToPath(user?.role, "overview"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="app-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <label className="app-card flex w-full max-w-xl items-center gap-2 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notifications"
            className="w-full bg-transparent text-sm outline-none dark:text-white"
          />
        </label>
      </div>

      {user?.role === "student" && absentClasses.length > 0 && (
        <div className="app-card border-red-200 bg-red-50/80 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <h3 className="font-semibold text-red-800 dark:text-red-200">Classes you were marked absent</h3>
          <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">
            These absences are kept in your notifications until you review them.
          </p>
          <ul className="mt-4 space-y-2">
            {absentClasses.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => open(entry.item)}
                  className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-left text-sm transition hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <span className="font-semibold text-red-800 dark:text-red-200">{entry.label}</span>
                  <span className="mt-1 block text-xs text-muted">{entry.item.message}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="app-card overflow-hidden">
        {visible.length === 0 && <p className="p-5 text-sm text-muted">No Notifications</p>}
        {visible.map((item) => {
          const meta = parseMetadata(item);
          const absent = isAbsentNotification(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              className="block w-full border-b border-blue-50 px-5 py-4 text-left text-sm transition hover:bg-sky-50/80 dark:border-slate-800 dark:hover:bg-slate-800/80"
            >
              <span className="block font-semibold text-sweety-ink dark:text-white">{item.title}</span>
              {absent && meta.subjectName && (
                <span className="mt-1 block text-sm font-medium text-red-700 dark:text-red-300">
                  Absent in: {meta.subjectName}
                  {meta.periodNumber ? ` · Period ${meta.periodNumber}` : ""}
                  {meta.attendanceDate ? ` · ${String(meta.attendanceDate).slice(0, 10)}` : ""}
                </span>
              )}
              <span className="mt-1 block text-muted">{item.message}</span>
              <span className="mt-2 block text-xs text-muted">{new Date(item.created_at).toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
