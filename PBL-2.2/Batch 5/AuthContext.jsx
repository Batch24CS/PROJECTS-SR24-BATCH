import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { navigate } from "../utils/navigation";
import { invalidate, REFRESH_EVENT, shouldRefresh } from "../utils/refresh";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sweety_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser().catch(() => {
      localStorage.removeItem("sweety_token");
      localStorage.removeItem("sweety_user");
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const sync = () => {
      if (document.visibilityState !== "hidden") refreshUser().catch(() => {});
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [user?.id]);

  useEffect(() => {
    const onRefresh = (event) => {
      if (user && shouldRefresh(event, ["auth", "dashboard", "requests"])) refreshUser().catch(() => {});
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [user?.id]);

  async function refreshUser() {
    const { data } = await authService.me();
    setUser(data.user);
    localStorage.setItem("sweety_user", JSON.stringify(data.user));
    return data.user;
  }

  async function login(payload) {
    const { data } = await authService.login(payload);
    localStorage.setItem("sweety_token", data.token);
    localStorage.setItem("sweety_user", JSON.stringify(data.user));
    setUser(data.user);
    const fresh = await refreshUser();
    navigate("/dashboard");
    return fresh;
  }

  async function signup(payload) {
    return authService.signup(payload);
  }

  async function facultySignup(payload) {
    return authService.facultySignup(payload);
  }

  async function hodSignup(payload) {
    return authService.hodSignup(payload);
  }

  function logout() {
    localStorage.removeItem("sweety_token");
    localStorage.removeItem("sweety_user");
    setUser(null);
    setProfile(null);
    invalidate(["auth", "dashboard", "notifications", "chat"]);
    navigate("/login");
  }

  const value = useMemo(() => ({ user, profile, loading, login, signup, facultySignup, hodSignup, refreshUser, logout }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
