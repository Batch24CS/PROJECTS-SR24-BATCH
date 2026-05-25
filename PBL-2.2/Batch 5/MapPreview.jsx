export default function MapPreview({ latitude, longitude, label, tall = false }) {
  if (!latitude || !longitude) {
    return (
      <div className={`grid place-items-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-muted dark:border-slate-700 dark:bg-slate-900 ${tall ? "h-64" : "h-44"}`}>
        No live map outside campus
      </div>
    );
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const pad = 0.0012;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - pad},${lat - pad},${lng + pad},${lat + pad}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
      <iframe
        title={label || "Campus map"}
        src={src}
        className={`w-full border-0 ${tall ? "h-64 min-h-[256px]" : "h-52 min-h-[208px]"}`}
        loading="lazy"
      />
    </div>
  );
}
