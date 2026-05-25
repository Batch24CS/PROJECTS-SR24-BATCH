import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "new-password",
  className = "",
  bare = false,
  required = true
}) {
  const [visible, setVisible] = useState(false);
  const shellClass = bare
    ? `flex items-center gap-3 ${className}`
    : `mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950 ${className}`;

  const content = (
    <>
      {!bare && <Lock size={18} className="shrink-0 text-slate-400" />}
      <input
        required={required}
        autoComplete={autoComplete}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-sweety-blue dark:text-slate-400"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </>
  );

  if (bare) return <div className={shellClass}>{content}</div>;
  return <label className={shellClass}>{content}</label>;
}
