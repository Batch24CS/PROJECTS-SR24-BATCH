import CampusStaticMap from "./CampusStaticMap";
import { formatExactTimestamp } from "../utils/campusMapStyles";

/** Live-tracking: campus zones + green pin only when student is inside campus. */
export default function CampusMiniMap({ latitude, longitude, label, locationLabel, lastUpdated, insideCampus = false }) {
  if (!insideCampus) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-red-100 bg-red-50 px-4 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <div>
          <p className="font-semibold">Student is outside campus</p>
          <p className="mt-1 text-xs opacity-90">Live map and pin are hidden for privacy.</p>
          {lastUpdated && (
            <p className="mt-3 text-xs font-medium text-sweety-ink dark:text-slate-200">
              Last updated: {formatExactTimestamp(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <CampusStaticMap
      compact
      markerScale={2.2}
      insideCampus
      studentLat={latitude}
      studentLng={longitude}
      studentLabel={label || locationLabel || "Student"}
      lastUpdated={lastUpdated}
    />
  );
}
