import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import BrandLockup from "../components/BrandLockup";
import PasswordField from "../components/PasswordField";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { navigate } from "../utils/navigation";

const branches = ["CSE", "CS Cyber Security", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEMICAL", "AIML", "DS"];
const years = [1, 2, 3, 4];
const sections = ["A", "B", "C", "D"];
const fieldClass = "rounded-lg border border-blue-100 bg-white px-3 py-3 text-slate-950 outline-none focus:border-sweety-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950";
const labeledFieldClass = `mt-2 w-full ${fieldClass}`;
const knownSubjects = {
  "CS Cyber Security-2-A": ["Software Engineering", "Business Economics & Financial Analysis", "Discrete Mathematics", "Computer Networks", "Operating Systems", "Constitution of India", "Node JS Lab", "RTRP", "CN Lab", "OS Lab"]
};

const emptyClass = { branch: "", year: "", section: "", subject: "" };

export default function FacultySignup() {
  const { facultySignup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", facultyId: "", phone: "", facultyType: "normal", inchargeClass: { branch: "", year: "", section: "" }, password: "", confirmPassword: "", classes: [{ ...emptyClass }] });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateClass(index, patch) {
    setForm((current) => ({ ...current, classes: current.classes.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function addClass() {
    setForm({ ...form, classes: [...form.classes, { ...emptyClass }] });
  }

  function removeClass(index) {
    setForm({ ...form, classes: form.classes.filter((_, itemIndex) => itemIndex !== index) });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    const keys = form.classes.map((item) => `${item.branch}|${item.year}|${item.section}|${item.subject}`);
    if (new Set(keys).size !== keys.length) return setError("Duplicate class rows are not allowed");
    try {
      const { data } = await facultySignup(form);
      setMessage(data?.message || "Faculty account created.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to create faculty account");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950 dark:text-white sm:py-8">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} autoComplete="off" className="mx-auto max-w-5xl rounded-lg border border-blue-100 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <BrandLockup />
        <h1 className="mt-6 text-3xl font-semibold text-sweety-ink dark:text-white">Faculty Signup</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input label="Full Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Input label="Faculty ID" value={form.facultyId} onChange={(value) => setForm({ ...form, facultyId: value.toUpperCase() })} />
          <Input label="Phone Number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Are you class incharge?<select value={form.facultyType} onChange={(event) => setForm({ ...form, facultyType: event.target.value })} className={labeledFieldClass}><option value="normal">No</option><option value="incharge">Yes</option></select></label>
          {form.facultyType === "incharge" && <div className="grid gap-3 rounded-lg border border-blue-100 bg-sky-50 p-3 dark:border-blue-900/60 dark:bg-blue-950/30 md:col-span-2 md:grid-cols-3"><Select value={form.inchargeClass.branch} options={branches} onChange={(value) => setForm({ ...form, inchargeClass: { ...form.inchargeClass, branch: value } })} /><Select value={form.inchargeClass.year} options={years} onChange={(value) => setForm({ ...form, inchargeClass: { ...form.inchargeClass, year: value } })} /><Select value={form.inchargeClass.section} options={sections} onChange={(value) => setForm({ ...form, inchargeClass: { ...form.inchargeClass, section: value } })} /></div>}
          <Input label="Password" type="password" value={form.password} autoComplete="new-password" onChange={(value) => setForm({ ...form, password: value })} />
          <Input label="Confirm Password" type="password" value={form.confirmPassword} autoComplete="new-password" onChange={(value) => setForm({ ...form, confirmPassword: value })} />
        </div>

        <section className="mt-6 rounded-lg border border-blue-100 bg-sky-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Class Assignments</h2>
            <button type="button" onClick={addClass} className="flex items-center gap-2 rounded-lg bg-sweety-blue px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> Add Subject/Class</button>
          </div>
          <div className="mt-4 space-y-3">
            {form.classes.map((item, index) => <ClassRow key={index} item={item} onChange={(patch) => updateClass(index, patch)} onRemove={() => removeClass(index)} canRemove={form.classes.length > 1} />)}
          </div>
        </section>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        <div className="mt-6 flex items-center justify-between">
          <a href="/" className="text-sm text-slate-500 hover:text-sweety-blue dark:text-slate-400">Back to login</a>
          <button className="rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-5 py-3 font-semibold text-white">Create Faculty Account</button>
        </div>
      </motion.form>
    </main>
  );
}

function ClassRow({ item, onChange, onRemove, canRemove }) {
  const options = knownSubjects[`${item.branch}-${item.year}-${item.section}`] || [];
  return <div className="grid gap-3 rounded-lg bg-white p-3 dark:bg-slate-900 md:grid-cols-[1fr_90px_90px_1.4fr_auto]"><Select value={item.branch} options={branches} onChange={(value) => onChange({ branch: value, subject: "" })} /><Select value={item.year} options={years} onChange={(value) => onChange({ year: value, subject: "" })} /><Select value={item.section} options={sections} onChange={(value) => onChange({ section: value, subject: "" })} />{options.length ? <select required value={options.includes(item.subject) ? item.subject : item.subject ? "__custom" : ""} onChange={(event) => onChange({ subject: event.target.value === "__custom" ? "" : event.target.value })} className={fieldClass}><option value="">Subject</option>{options.map((subject) => <option key={subject}>{subject}</option>)}<option value="__custom">Create new subject</option></select> : <input required placeholder="Subject" value={item.subject} onChange={(event) => onChange({ subject: event.target.value })} className={fieldClass} />}<button type="button" disabled={!canRemove} onClick={onRemove} className="rounded-lg border border-red-100 px-3 text-red-600 disabled:opacity-40 dark:border-red-900/60"><Trash2 size={18} /></button>{options.length > 0 && !options.includes(item.subject) && <input placeholder="New subject" value={item.subject} onChange={(event) => onChange({ subject: event.target.value })} className={`${fieldClass} md:col-span-4`} />}</div>;
}

function Input({ label, value, onChange, type = "text", autoComplete = "off" }) {
  if (type === "password") {
    return (
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
        <PasswordField bare value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className={`mt-2 ${labeledFieldClass}`} />
      </label>
    );
  }
  return <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">{label}<input required autoComplete={autoComplete} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={labeledFieldClass} /></label>;
}

function Select({ value, options, onChange }) {
  return <select required value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}
