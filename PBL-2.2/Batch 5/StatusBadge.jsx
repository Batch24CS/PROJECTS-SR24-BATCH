import { motion } from "framer-motion";

export default function StatusBadge({ inside, label }) {
  return (
    <motion.span
      animate={{ scale: inside ? [1, 1.04, 1] : 1 }}
      transition={{ repeat: inside ? Infinity : 0, duration: 1.8 }}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        inside ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${inside ? "bg-emerald-500" : "bg-red-500"}`} />
      {label || (inside ? "INSIDE CAMPUS" : "OUTSIDE CAMPUS")}
    </motion.span>
  );
}
