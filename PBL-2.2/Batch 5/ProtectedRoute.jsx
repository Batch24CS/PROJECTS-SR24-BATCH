import Login from "../pages/Login";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sweety-red dark:bg-slate-950">Loading Sphoorthy Engineering College...</div>;
  if (!user) return <Login />;
  if (roles?.length && !roles.includes(user.role)) return <Login />;
  return children;
}
