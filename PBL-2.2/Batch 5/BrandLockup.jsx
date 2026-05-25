export default function BrandLockup({ size = "normal", align = "left" }) {
  const compact = size === "compact";
  const logoSize = compact ? "h-11 w-11" : "h-14 w-14";
  const titleSize = compact ? "text-lg" : "text-2xl sm:text-3xl";
  const lineClass = `${titleSize} font-extrabold leading-tight tracking-tight`;

  return (
    <div className={`flex items-center gap-3 ${align === "center" ? "justify-center text-center" : ""}`}>
      <img src="/sphoorthy-logo.png" alt="Sphoorthy Engineering College logo" className={`${logoSize} shrink-0 object-contain`} />
      <div>
        <p className={`${lineClass} uppercase tracking-[0.12em] text-sweety-blue dark:text-sky-300`}>Sphoorthy</p>
        <h1 className={`${lineClass} text-slate-950 dark:text-white`}>Engineering College</h1>
      </div>
    </div>
  );
}
