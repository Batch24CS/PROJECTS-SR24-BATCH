import { campus } from "../config/campus.js";

const BLOCK_ZONE_NAMES = new Set(["sv block", "mv block", "canteen", "main gate", "gate"]);

export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function isInsideCampus(lat, lng) {
  const currentLat = Number(lat);
  const currentLng = Number(lng);
  if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) return false;
  return getDistanceMeters(campus.center.lat, campus.center.lng, currentLat, currentLng) <= campus.radiusMeters;
}

function zonePriority(zone) {
  const name = String(zone.name || "").toLowerCase();
  if (name.includes("room")) return 1;
  if (name.includes("floor") || name.includes("steps")) return 2;
  if (BLOCK_ZONE_NAMES.has(name) || name.includes("block") || name === "canteen") return 4;
  return 3;
}

export function findNearestZone(lat, lng, zones) {
  const matches = zones
    .map((zone) => ({
      zone,
      distance: getDistanceMeters(lat, lng, Number(zone.latitude), Number(zone.longitude)),
      radius: Number(zone.radius) || 20,
      priority: zonePriority(zone)
    }))
    .filter((item) => item.distance <= item.radius);

  if (!matches.length) return null;

  matches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.radius !== b.radius) return a.radius - b.radius;
    return a.distance - b.distance;
  });

  const best = matches[0].zone;
  return {
    id: best.id,
    name: best.name,
    description: best.description,
    latitude: Number(best.latitude),
    longitude: Number(best.longitude),
    distanceMeters: Math.round(matches[0].distance)
  };
}

export function zoneRectangleBounds(zone) {
  const lat = Number(zone.latitude);
  const lng = Number(zone.longitude);
  const radius = Number(zone.radius) || 25;
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lat - dLat, lng - dLng],
    [lat + dLat, lng + dLng]
  ];
}
