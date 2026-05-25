import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, RefreshCw } from "lucide-react";
import BrandLockup from "./BrandLockup";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function StudentLocationGate({ children }) {
  const { logout } = useAuth();
  const requestedRef = useRef(false);
  const [permission, setPermission] = useState("prompt");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("Location access is required to open the student dashboard.");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      setMessage("Location access is required, but this browser does not support location services.");
      return;
    }

    requestedRef.current = true;
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermission("granted");
        setChecking(false);
      },
      (error) => {
        setPermission(error.code === 1 ? "denied" : "prompt");
        setChecking(false);
        setMessage("Location access is required to open the student dashboard.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.permissions?.query) {
      requestLocation();
      return undefined;
    }

    let permissionStatus;
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      permissionStatus = status;
      setPermission(status.state);
      if (status.state === "granted") return;
      if (!requestedRef.current) requestLocation();
      status.onchange = () => {
        setPermission(status.state);
        if (status.state === "granted") setMessage("");
      };
    }).catch(() => requestLocation());

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [requestLocation]);

  if (permission === "granted") return children;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8 text-sweety-ink dark:bg-slate-950 dark:text-white">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-lg border border-blue-100 bg-white p-6 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <BrandLockup align="center" />
        <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sweety-blue">
          <LocateFixed size={24} />
        </div>
        <p className="mt-5 text-base font-semibold text-red-600">Location access is required</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        {permission === "denied" && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Allow location permission in your browser settings, then try again.</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={requestLocation}
            disabled={checking}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sweety-blue px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {checking ? <RefreshCw size={18} className="animate-spin" /> : <LocateFixed size={18} />}
            {checking ? "Checking" : "Allow Location"}
          </button>
          <button type="button" onClick={logout} className="rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-600 hover:text-sweety-blue dark:border-slate-700 dark:text-slate-300">
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
