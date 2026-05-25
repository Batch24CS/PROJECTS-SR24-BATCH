import { query } from "../config/db.js";
import { enrichLiveRows } from "../utils/liveLocation.js";

function attendanceSummary(records) {
  const subjects = records.map((record) => ({
    subject: record.subject,
    total: record.total_classes,
    present: record.attended_classes,
    percentage: Number(record.percentage || 0)
  }));
  const total = subjects.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const present = subjects.reduce((sum, item) => sum + Number(item.present || 0), 0);
  return { overall: total ? Math.round((present / total) * 100) : 0, subjects };
}

function detailedAttendanceSummary(records) {
  const grouped = new Map();
  for (const record of records) {
    const key = record.subject || "Subject";
    const item = grouped.get(key) || { subject: key, total: 0, present: 0, percentage: 0 };
    item.total += 1;
    if (["present", "smart_present", "present_override"].includes(record.status)) item.present += 1;
    item.percentage = item.total ? Math.round((item.present / item.total) * 100) : 0;
    grouped.set(key, item);
  }
  const subjects = [...grouped.values()];
  const total = records.length;
  const present = records.filter((record) => ["present", "smart_present", "present_override"].includes(record.status)).length;
  return { overall: total ? Math.round((present / total) * 100) : 0, subjects, records };
}

export async function studentOverview(req, res) {
  if (req.user.approvalStatus !== "approved") {
    return res.json({ student: req.user, approvalStatus: req.user.approvalStatus, attendance: { overall: 0, subjects: [], records: [] } });
  }
  const params = { studentId: req.user.id, branch: req.user.branch, year: req.user.year, section: req.user.section };
  const [attendance, documents, notices, events, locations, timetable, blockedClasses] = await Promise.all([
    query(
      `SELECT ar.*, s.attendance_date, s.period_number, s.topic, sub.name AS subject,
              DAYNAME(s.attendance_date) AS day_name
       FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       LEFT JOIN subjects sub ON sub.id = s.subject_id
       WHERE ar.student_id = :studentId
       ORDER BY s.attendance_date DESC, s.period_number DESC`,
      params
    ),
    query(
      `SELECT * FROM documents
       WHERE branch = :branch AND year = :year AND section = :section
       ORDER BY created_at DESC LIMIT 8`,
      params
    ),
    query(
      `SELECT * FROM notices
       WHERE branch = :branch AND year = :year AND section = :section
       ORDER BY created_at DESC LIMIT 6`,
      params
    ),
    query(
      `SELECT * FROM events
       WHERE event_date >= CURDATE() AND branch = :branch AND year = :year AND section = :section
       ORDER BY event_date ASC LIMIT 5`,
      params
    ),
    query("SELECT * FROM location_updates WHERE student_id = :studentId ORDER BY last_updated DESC LIMIT 1", params),
    query(
      `SELECT * FROM timetable
       WHERE branch = :branch AND year = :year AND section = :section
       ORDER BY FIELD(day_of_week, 'MON','TUE','WED','THU','FRI','SAT'), period_number`,
      params
    ),
    query(
      `SELECT c.*, s.name AS subject_name FROM classes c
       JOIN subjects s ON s.id = c.subject_id
       WHERE c.branch = :branch AND c.year = :year AND c.section = :section AND c.status = 'blocked'`,
      params
    )
  ]);

  res.json({ student: req.user, approvalStatus: "approved", attendance: detailedAttendanceSummary(attendance), recentUploads: documents, notices, events, campusStatus: locations[0] || { campus_status: "OUTSIDE" }, timetable, blockedClasses });
}

export async function facultyOverview(req, res) {
  const params = { branch: req.user.branch };
  const [students, uploads, events, liveRows, pendingRequests] = await Promise.all([
    query(
      `SELECT u.*, COALESCE(ROUND(AVG(a.percentage)), 0) AS attendance_percentage
       FROM users u
       JOIN classes c ON c.branch = u.branch AND c.year = u.year AND c.section = u.section AND c.faculty_id = :facultyId AND c.status = 'active'
       LEFT JOIN attendance a ON a.student_id = u.id
       WHERE u.role = 'student' AND u.branch = :branch AND u.approval_status = 'approved'
       GROUP BY u.id
       ORDER BY u.name`,
      { ...params, facultyId: req.user.id }
    ),
    query("SELECT * FROM documents WHERE uploaded_by = :facultyId ORDER BY created_at DESC LIMIT 6", { facultyId: req.user.id }),
    query("SELECT * FROM events WHERE faculty_id = :facultyId ORDER BY event_date ASC LIMIT 5", { facultyId: req.user.id }),
    query(
      `SELECT latest.*, u.name, u.roll_number, u.branch, u.year, u.section,
        COALESCE(ROUND(AVG(a.percentage)), 0) AS attendance_percentage
       FROM users u
       JOIN classes c ON c.branch = u.branch AND c.year = u.year AND c.section = u.section AND c.faculty_id = :facultyId AND c.status = 'active'
       LEFT JOIN (
         SELECT lu.*
         FROM location_updates lu
         JOIN (
           SELECT student_id, MAX(last_updated) AS max_updated
           FROM location_updates
           GROUP BY student_id
         ) recent ON recent.student_id = lu.student_id AND recent.max_updated = lu.last_updated
       ) latest ON latest.student_id = u.id
       LEFT JOIN attendance a ON a.student_id = u.id
       WHERE u.role = 'student' AND u.branch = :branch AND u.approval_status = 'approved'
       GROUP BY u.id, latest.id
       ORDER BY latest.last_updated DESC`,
      { ...params, facultyId: req.user.id }
    ),
    query(
      `SELECT COUNT(DISTINCT rr.id) AS count
       FROM registration_requests rr
       JOIN classes c ON c.faculty_id = :facultyId AND c.branch = rr.branch AND c.year = rr.year AND c.section = rr.section
       WHERE rr.branch = :branch AND rr.status = 'pending'`,
      { ...params, facultyId: req.user.id }
    )
  ]);

  const liveStudents = enrichLiveRows(liveRows);
  const insideCampus = liveStudents.filter((item) => item.insideCampus).length;
  res.json({
    assignedStudents: students.length,
    insideCampus,
    outsideCampus: Math.max(students.length - insideCampus, 0),
    recentUploads: uploads,
    events,
    pendingRequests: Number(pendingRequests[0]?.count || 0),
    students,
    liveStudents
  });
}

export async function hodOverview(req, res) {
  const params = { branch: req.user.branch };
  const [students, faculty, liveRows, pendingStudents, pendingFaculty, smartRows] = await Promise.all([
    query(
      `SELECT u.*, COALESCE(ROUND(AVG(a.percentage)), 0) AS attendance_percentage
       FROM users u
       LEFT JOIN attendance a ON a.student_id = u.id
       WHERE u.role = 'student' AND u.branch = :branch AND u.approval_status = 'approved'
       GROUP BY u.id ORDER BY u.name`,
      params
    ),
    query("SELECT id, name, email, faculty_id, faculty_type, approval_status, branch, year, section FROM users WHERE role = 'faculty' AND branch = :branch ORDER BY name", params),
    query(
      `SELECT latest.*, u.name, u.roll_number, u.branch, u.year, u.section,
        COALESCE(ROUND(AVG(a.percentage)), 0) AS attendance_percentage
       FROM users u
       LEFT JOIN (
         SELECT lu.*
         FROM location_updates lu
         JOIN (SELECT student_id, MAX(last_updated) AS max_updated FROM location_updates GROUP BY student_id) recent
           ON recent.student_id = lu.student_id AND recent.max_updated = lu.last_updated
       ) latest ON latest.student_id = u.id
       LEFT JOIN attendance a ON a.student_id = u.id
       WHERE u.role = 'student' AND u.branch = :branch AND u.approval_status = 'approved'
       GROUP BY u.id, latest.id
       ORDER BY latest.last_updated DESC`,
      params
    ),
    query("SELECT COUNT(*) AS count FROM registration_requests WHERE branch = :branch AND status = 'pending'", params),
    query("SELECT COUNT(*) AS count FROM faculty_requests WHERE branch = :branch AND status = 'pending'", params),
    query("SELECT COUNT(*) AS count FROM smart_attendance WHERE branch = :branch", params)
  ]);
  const liveStudents = enrichLiveRows(liveRows);
  const insideCampus = liveStudents.filter((item) => item.insideCampus).length;
  res.json({
    assignedStudents: students.length,
    totalFaculty: faculty.length,
    insideCampus,
    outsideCampus: Math.max(students.length - insideCampus, 0),
    pendingRequests: Number(pendingStudents[0]?.count || 0),
    pendingFaculty: Number(pendingFaculty[0]?.count || 0),
    smartAttendance: Number(smartRows[0]?.count || 0),
    students,
    faculty,
    liveStudents,
    recentUploads: [],
    events: []
  });
}

export async function adminOverview(_req, res) {
  const [roles, pendingFaculty, pendingStudents, pendingHods, branches] = await Promise.all([
    query("SELECT role, COUNT(*) AS count FROM users GROUP BY role"),
    query("SELECT COUNT(*) AS count FROM users WHERE role = 'faculty' AND approval_status = 'pending'"),
    query("SELECT COUNT(*) AS count FROM users WHERE role = 'student' AND approval_status = 'pending'"),
    query("SELECT COUNT(*) AS count FROM users WHERE role = 'hod' AND approval_status = 'pending'"),
    query("SELECT COUNT(DISTINCT branch) AS count FROM users WHERE branch IS NOT NULL AND branch <> ''")
  ]);
  const countFor = (role) => Number(roles.find((item) => item.role === role)?.count || 0);
  res.json({
    totalHods: countFor("hod"),
    pendingHods: Number(pendingHods[0]?.count || 0),
    totalFaculty: countFor("faculty"),
    pendingFaculty: Number(pendingFaculty[0]?.count || 0),
    totalStudents: countFor("student"),
    pendingStudents: Number(pendingStudents[0]?.count || 0),
    totalBranches: Number(branches[0]?.count || 0)
  });
}
