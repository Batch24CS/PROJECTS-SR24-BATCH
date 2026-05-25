import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Smartphone, ShieldCheck } from "lucide-react";
import BrandLockup from "../components/BrandLockup";
import PasswordField from "../components/PasswordField";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { getClientDevice, isMobileClient } from "../utils/device";
import { navigate } from "../utils/navigation";

export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (role === "student" && !isMobileClient()) {
      setError("Student login is allowed only on mobile devices.");
      return;
    }
    try {
      const clientDevice = getClientDevice();
      await login(role === "student" ? { role, rollNumber, password, clientDevice } : role === "admin" ? { role, email: identifier, password, clientDevice } : { role, identifier, password, clientDevice });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  function switchRole(nextRole) {
    setRole(nextRole);
    setPassword("");
  }

  return (
    <main className="app-shell grid min-h-screen text-slate-950 dark:text-white lg:grid-cols-[1.05fr_0.95fr]">
      <div className="app-shell-bg pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <section className="flex items-center px-4 py-8 sm:px-6 md:px-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
          <BrandLockup />
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Secure college ERP access for students, faculty, HODs and admins.</p>

          <form onSubmit={submit} className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-950 md:grid-cols-4">
              {["student", "faculty", "hod", "admin"].map((item) => (
                <button key={item} type="button" onClick={() => switchRole(item)} className={`rounded-md px-2 py-2 text-sm font-semibold capitalize transition ${role === item ? "bg-white text-sweety-blue shadow-sm dark:bg-slate-800 dark:text-sky-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}>
                  {item === "hod" ? "HOD" : item} Login
                </button>
              ))}
            </div>
            {role === "student" && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sweety-blue dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-sky-200">
                <Smartphone size={16} className="mt-0.5 shrink-0" />
                Student login works only from a mobile device and requires location permission before the dashboard opens.
              </p>
            )}
            {role === "student" ? (
              <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                <Mail size={18} className="text-slate-400" />
                <input autoComplete="off" value={rollNumber} onChange={(event) => setRollNumber(event.target.value.toUpperCase())} placeholder="Roll Number" className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-white" />
              </label>
            ) : role === "faculty" ? (
              <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                <Mail size={18} className="text-slate-400" />
                <input autoComplete="off" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Faculty ID or Email" className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-white" />
              </label>
            ) : role === "hod" ? (
              <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                <Mail size={18} className="text-slate-400" />
                <input autoComplete="off" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Email or Mobile Number" className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-white" />
              </label>
            ) : (
              <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                <Mail size={18} className="text-slate-400" />
                <input autoComplete="off" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Admin Email" className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-white" />
              </label>
            )}
            <PasswordField value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="mt-5 w-full rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white transition hover:from-sweety-crimson hover:to-sweety-blue">Enter Dashboard</button>
            <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <a onClick={(event) => { event.preventDefault(); if (role !== "admin") navigate(role === "student" ? "/signup" : role === "faculty" ? "/faculty-signup" : "/hod-signup"); }} className="text-sweety-red" href={role === "student" ? "/signup" : role === "faculty" ? "/faculty-signup" : role === "hod" ? "/hod-signup" : "/"}>{role === "student" ? "Create Student Account" : role === "faculty" ? "Create Faculty Account" : role === "hod" ? "Create HOD Account" : "Admin access only"}</a>
              <a onClick={(event) => { event.preventDefault(); navigate("/forgot-password"); }} className="text-slate-500 hover:text-sweety-red dark:text-slate-400" href="/forgot-password">Forgot password?</a>
            </div>
          </form>
        </motion.div>
      </section>
      <section className="hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-10 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 lg:block">
        <div className="flex h-full flex-col justify-between rounded-lg border border-white/70 bg-white/70 p-8 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><GraduationCap className="text-sweety-red" /><span className="font-semibold">Sphoorthy ERP</span></div>
            <ShieldCheck className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-5xl font-semibold leading-tight">Professional, privacy-first college management.</h2>
            <p className="mt-5 max-w-xl text-slate-600 dark:text-slate-300">Student login uses roll number. Faculty login uses faculty ID or email. Live campus presence stays geofenced.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {["MySQL data", "Student signup", "Reset password"].map((item) => <div key={item} className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-950">{item}</div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
