import { campus } from "../config/campus.js";
import { findNearestZone, getDistanceMeters, isInsideCampus } from "./geoUtils.js";

const MAX_ACCURACY_METERS = 35;
const MAX_SPEED_MPS = 12;
const MIN_MOVE_METERS = 4;
const SMOOTHING_WINDOW = 3;
const ZONE_SWITCH_MARGIN = 6;

const studentState = new Map();

function emptyState() {
  return {
    samples: [],
    lastAccepted: null,
    lastZone: null,
    zoneStreak: 0,
    pendingZone: null
  };
}

function averagePosition(samples) {
  const lat = samples.reduce((sum, item) => sum + item.lat, 0) / samples.length;
  const lng = samples.reduce((sum, item) => sum + item.lng, 0) / samples.length;
  return { lat, lng };
}

function applyZoneHysteresis(state, zone) {
  const zoneKey = zone ? `${zone.id}:${zone.name}` : null;
  if (!state.lastZone) {
    state.lastZone = zoneKey;
    state.zoneStreak = 1;
    state.pendingZone = null;
    return zone;
  }
  if (zoneKey === state.lastZone) {
    state.zoneStreak += 1;
    state.pendingZone = null;
    return zone;
  }
  if (state.pendingZone === zoneKey) {
    state.zoneStreak += 1;
    if (state.zoneStreak >= 2) {
      state.lastZone = zoneKey;
      state.pendingZone = null;
      return zone;
    }
    return state.lastAccepted?.nearestZone || null;
  }
  state.pendingZone = zoneKey;
  state.zoneStreak = 1;
  return state.lastAccepted?.nearestZone || null;
}

export function processStudentLocation(studentId, latitude, longitude, accuracy = null, zones = []) {
  const state = studentState.get(studentId) || emptyState();
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { rejected: true, reason: "invalid_coordinates", lastAccepted: state.lastAccepted };
  }
  const acc = accuracy == null ? null : Number(accuracy);

  if (acc != null && Number.isFinite(acc) && acc > MAX_ACCURACY_METERS) {
    if (state.lastAccepted) {
      return { ...state.lastAccepted, reused: true, reason: "low_accuracy" };
    }
    return { rejected: true, reason: "low_accuracy", lastAccepted: state.lastAccepted };
  }

  const sample = { lat, lng, at: Date.now() };
  state.samples.push(sample);
  if (state.samples.length > SMOOTHING_WINDOW) state.samples.shift();

  const smoothed = state.samples.length >= 2 ? averagePosition(state.samples) : { lat, lng };

  if (state.lastAccepted?.latitude != null && state.lastAccepted?.longitude != null) {
    const moved = getDistanceMeters(state.lastAccepted.latitude, state.lastAccepted.longitude, smoothed.lat, smoothed.lng);
    const elapsedSec = Math.max(1, (Date.now() - (state.lastAccepted.at || Date.now())) / 1000);
    const speed = moved / elapsedSec;
    if (speed > MAX_SPEED_MPS && moved > 25) {
      return { ...state.lastAccepted, reused: true, reason: "speed_jump" };
    }
    if (moved < MIN_MOVE_METERS && state.lastAccepted.insideCampus) {
      return { ...state.lastAccepted, reused: true, reason: "minimal_move" };
    }
  }

  const insideCampus = isInsideCampus(smoothed.lat, smoothed.lng);
  const campusStatus = insideCampus ? "INSIDE" : "OUTSIDE";
  const rawZone = insideCampus ? findNearestZone(smoothed.lat, smoothed.lng, zones) : null;
  const nearestZone = insideCampus ? applyZoneHysteresis(state, rawZone) : null;

  if (nearestZone && rawZone && nearestZone.id !== rawZone.id) {
    const currentDistance = getDistanceMeters(smoothed.lat, smoothed.lng, nearestZone.latitude, nearestZone.longitude);
    const candidateDistance = getDistanceMeters(smoothed.lat, smoothed.lng, rawZone.latitude, rawZone.longitude);
    if (candidateDistance + ZONE_SWITCH_MARGIN < currentDistance) {
      state.lastZone = `${rawZone.id}:${rawZone.name}`;
      state.zoneStreak = 2;
    }
  }

  const result = {
    latitude: insideCampus ? smoothed.lat : null,
    longitude: insideCampus ? smoothed.lng : null,
    insideCampus,
    campusStatus,
    nearestZone: insideCampus ? (nearestZone || rawZone) : null,
    at: Date.now(),
    reused: false
  };

  state.lastAccepted = result;
  studentState.set(studentId, state);
  return result;
}

export function clearStudentLocationState(studentId) {
  studentState.delete(studentId);
}
