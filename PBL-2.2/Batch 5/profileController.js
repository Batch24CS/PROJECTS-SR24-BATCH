import { query } from "../config/db.js";
import { enrichLiveLocation } from "../utils/liveLocation.js";

export async function searchStudents(req, res) {
  const params = {
    facultyBranch: req.user.branch,
    q: `%${req.query.q || ""}%`,
    branch: req.query.branch || req.user.branch,
    year: req.query.year ? String(req.query.year) : null,
    section: req.query.section || null,
    rollNumber: `%${req.query.rollNumber || ""}%`
  };

  const classJoin = req.user.role === "hod" ? "" : "JOIN classes c ON c.branch = u.branch AND c.year = u.year AND c.section = u.section AND c.faculty_id = :facultyId AND c.status = 'active'";
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.roll_number, u.branch, u.year, u.section, u.phone,
            COALESCE(ROUND(AVG(a.percentage)), 0) AS attendance,
            latest.campus_status, latest.zone_name, latest.latitude, latest.longitude, latest.last_updated
     FROM users u
     ${classJoin}
     LEFT JOIN attendance a ON a.student_id = u.id
     LEFT JOIN (
       SELECT lu.*
       FROM location_updates lu
       JOIN (SELECT student_id, MAX(last_updated) AS max_updated FROM location_updates GROUP BY student_id) recent
         ON recent.student_id = lu.student_id AND recent.max_updated = lu.last_updated
     ) latest ON latest.student_id = u.id
     WHERE u.role = 'student'
       AND u.approval_status = 'approved'
       AND u.branch = :facultyBranch
       AND (:branch IS NULL OR u.branch = :branch)
       AND (:year IS NULL OR u.year = :year)
       AND (:section IS NULL OR u.section = :section)
       AND (u.name LIKE :q OR u.roll_number LIKE :q OR u.branch LIKE :q)
       AND u.roll_number LIKE :rollNumber
     GROUP BY u.id, latest.id
     ORDER BY u.name`,
    { ...params, facultyId: req.user.id }
  );

  res.json(
    rows.map((row) => {
      const enriched = enrichLiveLocation(row);
      return {
        ...row,
        campus_status: enriched.campus_status,
        zone_name: enriched.zone_name,
        latitude: enriched.latitude,
        longitude: enriched.longitude,
        last_updated: enriched.last_updated,
        insideCampus: enriched.insideCampus
      };
    })
  );
}

export async function facultyScope(req, res) {
  res.json({ branch: req.user.branch, facultyId: req.user.facultyId, name: req.user.name });
}
