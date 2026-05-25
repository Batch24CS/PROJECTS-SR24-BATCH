import { campus, campusZones } from "../config/campus.js";
import { query } from "../config/db.js";
import { processStudentLocation } from "../utils/locationFilter.js";
import { enrichLiveRows } from "../utils/liveLocation.js";

export async function updateLocation(req, res) {
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  const accuracy = req.body.accuracy != null ? Number(req.body.accuracy) : null;
  const processed = processStudentLocation(req.user.id, latitude, longitude, accuracy, campusZones);

  if (processed.rejected) {
    return res.status(400).json({ message: "Location reading was too inaccurate. Please wait for GPS to stabilize." });
  }

  await query(
    `INSERT INTO location_updates (student_id, latitude, longitude, campus_status, zone_name, last_updated)
     VALUES (:studentId, :latitude, :longitude, :campusStatus, :zoneName, NOW())`,
    {
      studentId: req.user.id,
      latitude: processed.latitude,
      longitude: processed.longitude,
      campusStatus: processed.campusStatus,
      zoneName: processed.nearestZone?.description || processed.nearestZone?.name || null
    }
  );

  const update = buildLocationPayload(req.user, processed);
  req.app.get("io")?.to(`branch:${req.user.branch}`).emit("location:update", update);
  res.json(update);
}

export function buildLocationPayload(user, processed) {
  return {
    student: {
      id: user.id,
      name: user.name,
      rollNumber: user.roll_number || user.rollNumber,
      branch: user.branch,
      year: user.year,
      section: user.section
    },
    campusStatus: processed.campusStatus,
    insideCampus: processed.insideCampus,
    nearestZone: processed.nearestZone,
    latitude: processed.latitude,
    longitude: processed.longitude,
    lastUpdated: new Date().toISOString()
  };
}

export async function listCampusZones(_req, res) {
  res.json({ campus, zones: campusZones });
}

export async function liveBranchLocations(req, res) {
  if (req.user.role !== "faculty" && req.user.role !== "hod") {
    return res.status(403).json({ message: "Faculty access required" });
  }
  const rows = await query(
    `SELECT latest.*, u.id AS student_id, u.name, u.roll_number, u.branch, u.year, u.section
     FROM users u
     JOIN (
       SELECT lu.*
       FROM location_updates lu
       JOIN (
         SELECT student_id, MAX(last_updated) AS max_updated
         FROM location_updates
         GROUP BY student_id
       ) recent ON recent.student_id = lu.student_id AND recent.max_updated = lu.last_updated
     ) latest ON latest.student_id = u.id
     WHERE u.role = 'student' AND u.branch = :branch
     ORDER BY latest.last_updated DESC`,
    { branch: req.user.branch }
  );
  res.json(enrichLiveRows(rows));
}
