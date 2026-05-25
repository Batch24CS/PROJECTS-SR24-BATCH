import { useState } from "react";
import { motion } from "framer-motion";
import BrandLockup from "../components/BrandLockup";
import PasswordField from "../components/PasswordField";
import ThemeToggle from "../components/ThemeToggle";
import { authService } from "../services/authService";
import { navigate } from "../utils/navigation";

export default function ResetPassword({ token }) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }
    try {
      await authService.resetPassword(token, form);
      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <BrandLockup size="compact" />
        <h1 className="mt-2 text-2xl font-semibold">Reset Password</h1>
        <PasswordField
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="New password"
          className="mt-5"
        />
        <PasswordField
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          placeholder="Confirm password"
        />
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        <button className="mt-5 w-full rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white">Reset Password</button>
      </motion.form>
    </main>
  );
}
