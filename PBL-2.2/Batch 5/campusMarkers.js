/** Static campus markers — must match server/config/campus.js */
export const CAMPUS = {
  name: "Sphoorthy Engineering College",
  center: { lat: 17.282545, lng: 78.553195 },
  radiusMeters: 400
};

function distanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const toRad = (v) => (Number(v) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function isInsideCampusCoords(lat, lng) {
  const currentLat = Number(lat);
  const currentLng = Number(lng);
  if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) return false;
  return distanceMeters(CAMPUS.center.lat, CAMPUS.center.lng, currentLat, currentLng) <= CAMPUS.radiusMeters;
}

export const CAMPUS_MARKERS = [
  { id: 1, name: "SV Block", category: "sv", latitude: 17.282808788017398, longitude: 78.5530623095411, radius: 35, description: "SV Block" },
  { id: 2, name: "MV Block", category: "mv", latitude: 17.282282, longitude: 78.553328, radius: 28, description: "MV Block" },
  { id: 3, name: "Cricket Ground", category: "ground", latitude: 17.282962, longitude: 78.553844, radius: 30, description: "Cricket Ground" },
  { id: 4, name: "Stage", category: "stage", latitude: 17.283474603548253, longitude: 78.55376322240204, radius: 22, description: "Stage" },
  { id: 5, name: "Main Gate", category: "gate", latitude: 17.280408165765795, longitude: 78.5539008038925, radius: 24, description: "Main Gate" },
  { id: 6, name: "Concrete Technology Lab", category: "labs", latitude: 17.282154344865926, longitude: 78.55286158954087, radius: 18, description: "Concrete Technology Lab" },
  { id: 7, name: "Strength of Material Lab", category: "labs", latitude: 17.28203800354768, longitude: 78.55289579081679, radius: 18, description: "Strength of Material Lab" },
  { id: 8, name: "Stationary", category: "stationary", latitude: 17.283312094416406, longitude: 78.55319845582007, radius: 16, description: "Stationary" },
  { id: 9, name: "Sachin Tendulkar Block", category: "sachin", latitude: 17.2833488425347, longitude: 78.5526134707187, radius: 26, description: "Sachin Tendulkar Block" },
  { id: 10, name: "Canteen", category: "canteen", latitude: 17.281737509704133, longitude: 78.55375164080283, radius: 22, description: "Canteen" },
  { id: 11, name: "Bus Parking Area", category: "bus", latitude: 17.281174122254203, longitude: 78.55372180818487, radius: 26, description: "Bus Parking Area" }
];
