import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { io } from "socket.io-client";
import { api, API_URL } from "../services/api";
import { navigate } from "../utils/navigation";
import { invalidate, REFRESH_EVENT, shouldRefresh } from "../utils/refresh";

export default function NotificationBell() {
  const [items, setItems] = useState([]);

  async function load() {
    const { data } = await api.get("/notifications");
    setItems(data || []);
  }

  useEffect(() => {
    load();
    markRelatedToCurrentPath();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    const token = localStorage.getItem("sweety_token");
    const socket = io(API_URL || window.location.origin, { auth: { token } });
    socket.on("notification:new", (notification) => {
      setItems((current) => [notification, ...current]);
      invalidate(["notifications", "dashboard"]);
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 880;
        gain.gain.value = 0.05;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);
      } catch (_error) {}
      if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification(notification.title, { body: notification.message }); } catch (_error) {}
      }
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const onPath = () => markRelatedToCurrentPath();
    const onRefresh = (event) => {
      if (shouldRefresh(event, ["notifications"])) load();
    };
    window.addEventListener("popstate", onPath);
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener("popstate", onPath);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
    };
  }, []);

  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  async function markRelatedToCurrentPath() {
    const path = `${window.location.pathname}${window.location.search}`;
    await api.put("/notifications/read-related", { linkPath: path }).catch(() => {});
    setItems((current) => current.map((item) => isRelatedPath(item.link_path, path) ? { ...item, is_read: 1 } : item));
  }

  async function openNotifications() {
    await api.put("/notifications/read-all");
    setItems((current) => current.map((item) => ({ ...item, is_read: 1 })));
    navigate("/dashboard/notifications");
  }

  return (
    <div className="relative">
      <button onClick={openNotifications} className="relative rounded-lg border border-gray-200 p-2 text-gray-600 hover:text-sweety-blue" title="Notifications">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-sweety-crimson px-1 text-center text-xs font-bold text-white">{unread}</span>}
      </button>
    </div>
  );
}

function isRelatedPath(linkPath = "", currentPath = "") {
  const cleanLink = linkPath.split("?")[0];
  const cleanCurrent = currentPath.split("?")[0];
  return cleanLink && (cleanCurrent === cleanLink || cleanCurrent.startsWith(cleanLink));
}
