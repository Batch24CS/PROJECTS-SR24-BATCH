import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tabToPath } from "../utils/dashboardRoutes";
import { clearNotificationReturn, navigate, shouldShowNotificationReturn } from "../utils/navigation";

export default function NotificationReturnBar() {
  const { user } = useAuth();
  if (!shouldShowNotificationReturn()) return null;

  function goBackToNotifications() {
    clearNotificationReturn();
    const path = tabToPath(user?.role, "notifications");
    navigate(path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <button
      type="button"
      onClick={goBackToNotifications}
      className="app-btn-secondary mb-4 inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
    >
      <ArrowLeft size={16} />
      Back to Notifications
    </button>
  );
}
