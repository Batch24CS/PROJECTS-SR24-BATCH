import { motion } from "framer-motion";

export default function StatCard({ title, value, hint, icon: Icon, tone = "red", onClick, active = false }) {
  const clickable = typeof onClick === "function";
  const className = `w-full rounded-xl border p-5 text-left shadow-soft transition ${
    active
      ? "border-sweety-blue bg-sky-50 ring-2 ring-sweety-blue/30 dark:border-sky-500 dark:bg-blue-950/40"
      : "border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-900"
  } ${clickable ? "cursor-pointer hover:border-sky-200 dark:hover:border-slate-600" : ""}`;
  const Wrapper = clickable ? motion.button : motion.div;
  return (
    <Wrapper type={clickable ? "button" : undefined} onClick={onClick} whileHover={clickable ? { y: -3 } : undefined} className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-semibold text-sweety-ink">{value}</h3>
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 ${tone === "green" ? "bg-emerald-50 text-emerald-600" : "bg-sweety-blush text-sweety-red"}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {hint && <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">{hint}</p>}
      {clickable && <p className="mt-3 text-xs font-semibold text-sweety-blue dark:text-sky-300">Click to review</p>}
    </Wrapper>
  );
}
