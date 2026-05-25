import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LocateFixed, RefreshCw, Smartphone } from "lucide-react";
import BrandLockup from "../components/BrandLockup";
import PasswordField from "../components/PasswordField";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { getClientDevice, isMobileClient } from "../utils/device";
import { navigate } from "../utils/navigation";

const branches = ["CSE", "CS Cyber Security", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEMICAL", "AIML", "DS"];
const years = [1, 2, 3, 4];
const sections = ["A", "B", "C", "D"];
const branchCodes = { CSE: "61", "CS Cyber Security": "62", DS: "66" };
const yearCodes = { 1: "25N81A", 2: "24N81A", 3: "23N81A", 4: "22N81A" };
const fieldClass = "mt-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-3 text-slate-950 outline-none focus:border-sweety-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950";
const labelClass = "block text-sm font-medium text-slate-600 dark:text-slate-300";
const branchPrefixRules = {
  AIML: {
    suffixLength: 4,
    regular: { 1: "25N81A", 2: "24N81A", 3: "23N81", 4: "22N81A" },
    lateral: { 2: "25N85A", 3: "24N85A", 4: "23N85A" }
  },
  CIVIL: {
    suffixLength: 2,
    regular: { 1: "25N81A01", 2: "24N81A01" },
    lateral: { 2: "25N85A01" }
  }
};

function prefixFor(branch, year, admissionType, rollNumber = "") {
  if (branch === "CS Cyber Security" && Number(year) === 2 && admissionType === "regular" && rollNumber === "23N81A6285") return "23N81A62";
  const branchRule = branchPrefixRules[branch];
  if (branchRule) return branchRule[admissionType === "lateral" ? "lateral" : "regular"]?.[Number(year)] || "";
  const code = branchCodes[branch] || "";
  if (!code || !year || !admissionType) return "";
  return admissionType === "lateral" ? `25N85A${code}` : `${yearCodes[year]}${code}`;
}

function suffixLengthFor(branch) {
  return branchPrefixRules[branch]?.suffixLength || 2;
}

function validateRoll(branch, year, admissionType, rollNumber) {
  if (!branchCodes[branch] && !branchPrefixRules[branch]) return "Smart roll number generation is available for CSE, CS Cyber Security, DS, AIML and CIVIL.";
  if (rollNumber === "23N81A6285" && branch === "CS Cyber Security" && Number(year) === 2 && admissionType === "regular") return "";
  const prefix = prefixFor(branch, year, admissionType, rollNumber);
  if (!prefix) return "Roll number prefix is not available for this branch, year and admission type.";
  if (!rollNumber.startsWith(prefix)) return "Roll number prefix cannot be changed.";
  const suffix = rollNumber.slice(prefix.length);
  const branchRule = branchPrefixRules[branch];
  if (branchRule) {
    if (!new RegExp(`^\\d{${branchRule.suffixLength}}$`).test(suffix)) return `${branch} roll suffix must be ${branchRule.suffixLength} digits.`;
    const number = Number(suffix);
    if (number < 1) return `${branch} roll suffix must be ${branchRule.suffixLength} digits.`;
    if (branch === "CIVIL" && admissionType === "lateral" && number > 6) return "Invalid lateral roll number. Allowed lateral entries are 01 to 06 only.";
    return "";
  }
  if (admissionType === "lateral") {
    const number = Number(suffix);
    if (![2, 3, 4].includes(Number(year))) return "Lateral entry is available only from 2nd year to 4th year.";
    if (!/^\d{2}$/.test(suffix) || number < 1 || number > 6) return "Invalid lateral roll number. Allowed lateral entries are 01 to 06 only.";
    return "";
  }
  if (!/^\d{2}$/.test(suffix)) return "Regular roll suffix must be 01 to 99.";
  const number = Number(suffix);
  if (number < 1 || number > (branch === "CS Cyber Security" ? 64 : 99)) return branch === "CS Cyber Security" ? "No roll number exists for this batch." : "Regular roll suffix must be 01 to 99.";
  return "";
}

export default function Signup() {
  const { signup } = useAuth();
  const inputRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", branch: "", year: "", section: "", admissionType: "", rollNumber: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signupComplete, setSignupComplete] = useState(false);
  const [locationChecking, setLocationChecking] = useState(false);
  const currentPrefix = useMemo(() => prefixFor(form.branch, form.year, form.admissionType, form.rollNumber), [form.branch, form.year, form.admissionType, form.rollNumber]);
  const availableYears = form.branch === "CIVIL" ? [1, 2] : years;
  const validation = form.rollNumber && form.branch && form.year && form.admissionType ? validateRoll(form.branch, form.year, form.admissionType, form.rollNumber) : "";

  function updateAcademic(next) {
    const updated = { ...form, ...next };
    if (updated.branch === "CIVIL" && Number(updated.year) > 2) updated.year = "";
    const nextPrefix = prefixFor(updated.branch, updated.year, updated.admissionType);
    updated.rollNumber = nextPrefix;
    setForm(updated);
    setTimeout(() => inputRef.current?.setSelectionRange(nextPrefix.length, nextPrefix.length), 0);
  }

  function updateRoll(value) {
    const prefix = currentPrefix;
    let next = value.toUpperCase();
    if (prefix) {
      const suffix = (next.startsWith(prefix) ? next.slice(prefix.length) : next.replace(prefix, "")).replace(/\D/g, "").slice(0, suffixLengthFor(form.branch));
      next = `${prefix}${suffix}`;
    }
    setForm({ ...form, rollNumber: next });
    setTimeout(() => inputRef.current?.setSelectionRange(Math.max(next.length, prefix.length), Math.max(next.length, prefix.length)), 0);
  }

  function requestSignupLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location access is required, but this browser does not support location services.");
      return;
    }

    setLocationChecking(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationChecking(false);
        setMessage("Location access enabled. Redirecting to login.");
        setTimeout(() => navigate("/login"), 700);
      },
      () => {
        setLocationChecking(false);
        setError("Location access is required.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isMobileClient()) return setError("Student signup is allowed only on mobile devices.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (validation) return setError(validation);
    try {
      const { data } = await signup({ ...form, clientDevice: getClientDevice() });
      setSignupComplete(true);
      setMessage(`${data?.message || "Student account created. Waiting for class incharge approval."} Location access is required before the student dashboard opens.`);
      requestSignupLocation();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to create student account");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-6 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950 dark:text-white sm:py-8">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} autoComplete="off" className="mx-auto max-w-4xl rounded-lg border border-blue-100 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandLockup />
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sweety-blue dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-sky-200">
            <Smartphone size={15} />
            Mobile only
          </span>
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight">Student Signup</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Create a student account request. Student signup works only from a mobile device, and dashboard access requires location permission after approval.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input label="Full Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Input label="Phone Number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Select label="Branch" value={form.branch} options={branches} onChange={(value) => updateAcademic({ branch: value })} />
          <Select label="Year" value={form.year} options={availableYears} onChange={(value) => updateAcademic({ year: value })} />
          <Select label="Section" value={form.section} options={sections} onChange={(value) => updateAcademic({ section: value })} />
          <Select label="Admission Type" value={form.admissionType} options={[["regular", "Regular"], ["lateral", "Lateral Entry"]]} onChange={(value) => updateAcademic({ admissionType: value, year: value === "lateral" && form.year === "1" ? "2" : form.year })} />
          <label className={labelClass}>Roll Number<input ref={inputRef} required autoComplete="off" value={form.rollNumber} onChange={(event) => updateRoll(event.target.value)} onFocus={() => currentPrefix && inputRef.current?.setSelectionRange(form.rollNumber.length, form.rollNumber.length)} className={fieldClass} /></label>
          <Input label="Password" type="password" value={form.password} autoComplete="new-password" onChange={(value) => setForm({ ...form, password: value })} />
          <Input label="Confirm Password" type="password" value={form.confirmPassword} autoComplete="new-password" onChange={(value) => setForm({ ...form, confirmPassword: value })} />
        </div>
        <div className="mt-4 rounded-lg border border-blue-100 bg-sky-50 px-4 py-3 text-sm text-slate-600 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-slate-300">
          <span className="font-semibold text-slate-950 dark:text-white">Preview:</span> {form.rollNumber || "Select branch, year and admission type"}
          {validation && <p className="mt-2 text-red-600">{validation}</p>}
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {signupComplete && (
          <button
            type="button"
            onClick={requestSignupLocation}
            disabled={locationChecking}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 px-4 py-3 font-semibold text-sweety-blue disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-sky-300 sm:w-auto"
          >
            {locationChecking ? <RefreshCw size={18} className="animate-spin" /> : <LocateFixed size={18} />}
            {locationChecking ? "Checking Location" : "Allow Location Access"}
          </button>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="text-center text-sm text-slate-500 hover:text-sweety-blue dark:text-slate-400 sm:text-left">Back to login</a>
          <button disabled={signupComplete || locationChecking} className="rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">Create Student Account</button>
        </div>
      </motion.form>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", autoComplete = "off" }) {
  if (type === "password") {
    return (
      <label className={labelClass}>
        {label}
        <PasswordField bare value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className={`mt-2 ${fieldClass}`} />
      </label>
    );
  }
  return <label className={labelClass}>{label}<input required autoComplete={autoComplete} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} /></label>;
}

function Select({ label, value, options, onChange }) {
  return <label className={labelClass}>{label}<select required value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}><option value="">Select</option>{options.map((option) => Array.isArray(option) ? <option key={option[0]} value={option[0]}>{option[1]}</option> : <option key={option} value={option}>{option}</option>)}</select></label>;
}
