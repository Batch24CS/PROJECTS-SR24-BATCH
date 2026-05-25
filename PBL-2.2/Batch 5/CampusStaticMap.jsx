import { Circle, MapContainer, Marker, Popup, Rectangle, TileLayer } from "react-leaflet";
import L from "leaflet";
import { CAMPUS, CAMPUS_MARKERS } from "../config/campusMarkers";
import { formatExactTimestamp, MAP_LEGEND, zoneRectangleBounds, zoneStyle } from "../utils/campusMapStyles";

const studentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -40]
});

/**
 * Static campus map with colored location rectangles.
 */
export default function CampusStaticMap({
  studentLat,
  studentLng,
  studentLabel = "Student",
  compact = false,
  markerScale = 1,
  lastUpdated,
  insideCampus = false
}) {
  const hasStudent =
    insideCampus &&
    studentLat != null &&
    studentLng != null &&
    !Number.isNaN(Number(studentLat)) &&
    !Number.isNaN(Number(studentLng));
  const studentPoint = hasStudent ? [Number(studentLat), Number(studentLng)] : null;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
        <MapContainer
          center={[CAMPUS.center.lat, CAMPUS.center.lng]}
          zoom={compact ? 17 : 18}
          scrollWheelZoom={!compact}
          className={compact ? "h-64 w-full" : "h-[min(560px,70vh)] w-full rounded-lg"}
        >
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Circle
            center={[CAMPUS.center.lat, CAMPUS.center.lng]}
            radius={CAMPUS.radiusMeters}
            pathOptions={{ color: "#1d4ed8", fillColor: "#38bdf8", fillOpacity: 0.1, weight: 2 }}
          />
          {CAMPUS_MARKERS.map((zone) => (
            <Rectangle
              key={zone.id}
              bounds={zoneRectangleBounds(zone, markerScale)}
              pathOptions={zoneStyle(zone)}
            >
              <Popup>
                <strong>{zone.name}</strong>
              </Popup>
            </Rectangle>
          ))}
          {studentPoint && (
            <Marker position={studentPoint} icon={studentIcon}>
              <Popup>
                <strong>{studentLabel}</strong>
                <br />
                Inside campus
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {!compact && (
        <div className="app-card p-4">
          <p className="mb-3 text-sm font-semibold text-sweety-ink dark:text-white">Map legend</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            {MAP_LEGEND.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-4 w-6 rounded-sm border-2"
                  style={{ borderColor: item.color, backgroundColor: item.fill }}
                />
                {item.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-5 w-3 rounded-sm bg-emerald-500" />
              Student (pin)
            </span>
          </div>
        </div>
      )}
      {compact && lastUpdated && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sweety-blue dark:bg-blue-950/40 dark:text-sky-300">
          Last updated: {formatExactTimestamp(lastUpdated)}
        </p>
      )}
      {compact && (
        <div className="flex flex-wrap gap-2 text-[10px] text-muted">
          {MAP_LEGEND.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 rounded-sm border" style={{ borderColor: item.color, backgroundColor: item.fill }} />
              {item.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-2 rounded-sm bg-emerald-500" />
            Student pin
          </span>
        </div>
      )}
    </div>
  );
}
