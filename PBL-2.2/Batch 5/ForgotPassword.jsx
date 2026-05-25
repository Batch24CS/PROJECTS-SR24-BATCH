import { useState } from "react";
import { motion } from "framer-motion";
import BrandLockup from "../components/BrandLockup";
import ThemeToggle from "../components/ThemeToggle";
import { authService } from "../services/authService";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResetLink("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword(identifier);
      setMessage(data.message || "If the account exists, reset link has been sent to registered email.");
      if (data.resetLink) setResetLink(data.resetLink);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <BrandLockup size="compact" />
        <h1 className="mt-2 text-2xl font-semibold">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter roll number, faculty ID, email, or mobile number.</p>
        <input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Roll / Faculty ID / Email / Mobile" className="mt-5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none focus:border-sweety-red dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {resetLink && (
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Development reset link: <a className="underline" href={resetLink}>{resetLink}</a>
          </div>
        )}
        <button disabled={loading} className="mt-5 w-full rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Generating..." : "Generate Reset Link"}</button>
        <a href="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-sweety-red dark:text-slate-400">Back to login</a>
      </motion.form>
    </main>
  );
}
