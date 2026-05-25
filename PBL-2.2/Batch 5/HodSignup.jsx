import { useState } from "react";
import { motion } from "framer-motion";
import BrandLockup from "../components/BrandLockup";
import PasswordField from "../components/PasswordField";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { navigate } from "../utils/navigation";

const branches = ["CSE", "CS Cyber Security", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEMICAL", "AIML", "DS"];
const fieldClass = "mt-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-3 text-slate-950 outline-none focus:border-sweety-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950";

export default function HodSignup() {
  const { hodSignup } = useAuth();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", branch: "CSE", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    try {
      const { data } = await hodSignup(form);
      setMessage(data?.message || "HOD account created.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create HOD account");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950 dark:text-white sm:py-8">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} autoComplete="off" className="mx-auto max-w-2xl rounded-lg border border-blue-100 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <BrandLockup />
        <h1 className="mt-6 text-3xl font-semibold text-sweety-ink dark:text-white">HOD Signup</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Mobile Number" value={form.mobile} onChange={(value) => setForm({ ...form, mobile: value })} />
          <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Branch<select required value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} className={fieldClass}>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
          <Input label="Password" type="password" value={form.password} autoComplete="new-password" onChange={(value) => setForm({ ...form, password: value })} />
          <Input label="Confirm Password" type="password" value={form.confirmPassword} autoComplete="new-password" onChange={(value) => setForm({ ...form, confirmPassword: value })} />
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        <div className="mt-6 flex items-center justify-between">
          <a href="/" className="text-sm text-slate-500 hover:text-sweety-blue dark:text-slate-400">Back to login</a>
          <button className="rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-5 py-3 font-semibold text-white">Create HOD Account</button>
        </div>
      </motion.form>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", autoComplete = "off" }) {
  if (type === "password") {
    return (
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
        <PasswordField bare value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className={`mt-2 ${fieldClass}`} />
      </label>
    );
  }
  return <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">{label}<input required autoComplete={autoComplete} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} /></label>;
}
