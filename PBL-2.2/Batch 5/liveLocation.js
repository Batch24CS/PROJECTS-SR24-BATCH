import { campusZones } from "../config/campus.js";
import { findNearestZone, isInsideCampus } from "./geoUtils.js";

/** Treat location as stale if older than this (live tracking). */
export const LIVE_STALE_MS = 3 * 60 * 1000;

function isStale(lastUpdated) {
  if (!lastUpdated) return true;
  const ts = new Date(lastUpdated).getTime();
  return Number.isNaN(ts) || Date.now() - ts > LIVE_STALE_MS;
}

/** Re-check coordinates and freshness so old DB rows do not show false INSIDE. */
export function enrichLiveLocation(row) {
  if (!row) return { campus_status: "OUTSIDE", insideCampus: false, isStale: true };

  const lastUpdated = row.last_updated || row.lastUpdated;
  const lat = row.latitude != null ? Number(row.latitude) : null;
  const lng = row.longitude != null ? Number(row.longitude) : null;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (isStale(lastUpdated) || !hasCoords) {
    return {
      ...row,
      campus_status: "OUTSIDE",
      insideCampus: false,
      isStale: true,
      latitude: null,
      longitude: null,
      zone_name: null
    };
  }

  const inside = isInsideCampus(lat, lng);
  if (!inside) {
    return {
      ...row,
      campus_status: "OUTSIDE",
      insideCampus: false,
      isStale: false,
      latitude: null,
      longitude: null,
      zone_name: null
    };
  }

  const zone = findNearestZone(lat, lng, campusZones);
  const zoneName = zone?.description || zone?.name || null;

  return {
    ...row,
    campus_status: "INSIDE",
    insideCampus: true,
    isStale: false,
    latitude: lat,
    longitude: lng,
    zone_name: zoneName
  };
}

export function enrichLiveRows(rows = []) {
  return rows.map((row) => enrichLiveLocation(row));
}
