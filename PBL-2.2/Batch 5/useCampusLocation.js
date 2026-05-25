import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../services/api";

const MAX_ACCURACY_METERS = 35;
const MIN_EMIT_INTERVAL_MS = 12000;
const MIN_MOVE_METERS = 4;

function distanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function useCampusLocation(user) {
  const [permission, setPermission] = useState("prompt");
  const [status, setStatus] = useState({ insideCampus: false, nearestZone: null, lastSeenAt: null });
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const watchRef = useRef(null);
  const samplesRef = useRef([]);
  const lastEmitRef = useRef({ lat: null, lng: null, at: 0 });

  const privacyNotice = useMemo(
    () =>
      "Sphoorthy Engineering College asks for location only after login. Live sharing is sent only while you are inside campus; outside campus, precise coordinates are not shared with faculty.",
    []
  );

  useEffect(() => {
    if (!user || user.role !== "student") return undefined;
    const token = localStorage.getItem("sweety_token");
    socketRef.current = io(API_URL || window.location.origin, { auth: { token } });

    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this browser.");
      return undefined;
    }

    function emitLocation(position) {
      const accuracy = position.coords.accuracy;
      if (accuracy != null && accuracy > MAX_ACCURACY_METERS) return;

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      samplesRef.current.push({ lat, lng });
      if (samplesRef.current.length > 3) samplesRef.current.shift();

      const smoothed =
        samplesRef.current.length >= 2
          ? {
              lat: samplesRef.current.reduce((sum, item) => sum + item.lat, 0) / samplesRef.current.length,
              lng: samplesRef.current.reduce((sum, item) => sum + item.lng, 0) / samplesRef.current.length
            }
          : { lat, lng };

      const last = lastEmitRef.current;
      const now = Date.now();
      const moved =
        last.lat == null ? Infinity : distanceMeters(last.lat, last.lng, smoothed.lat, smoothed.lng);
      if (moved < MIN_MOVE_METERS && now - last.at < MIN_EMIT_INTERVAL_MS) return;

      lastEmitRef.current = { lat: smoothed.lat, lng: smoothed.lng, at: now };
      socketRef.current?.emit(
        "student:location",
        { latitude: smoothed.lat, longitude: smoothed.lng, accuracy },
        (response) => {
          if (response && !response.rejected) {
            setStatus({ ...response, lastSeenAt: response.lastUpdated || new Date().toISOString() });
          }
        }
      );
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setPermission("granted");
        emitLocation(position);
      },
      (geoError) => {
        setPermission(geoError.code === 1 ? "denied" : "prompt");
        setError(geoError.code === 1 ? "Location access is required." : geoError.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      socketRef.current?.disconnect();
      samplesRef.current = [];
    };
  }, [user]);

  return { permission, status, error, privacyNotice };
}
