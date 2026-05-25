import { query } from "../config/db.js";
import { facultyOwnsClass } from "../utils/classPermissions.js";

function classScopeFromQuery(req) {
  return {
    branch: req.query.branch || req.body.branch || req.user.branch,
    year: String(req.query.year || req.body.year || req.user.year || ""),
    section: req.query.section || req.body.section || req.user.section || ""
  };
}

function subjectCode(subject) {
  const normalized = String(subject || "").trim().toLowerCase();
  const known = {
    "software engineering": "SE",
    "business economics & financial analysis": "BEFA",
    "business economics and financial analysis": "BEFA",
    "discrete mathematics": "DM",
    "computer networks": "CN",
    "operating systems": "OS",
    "constitution of india": "COI",
    "node js lab": "NODE",
    rtrp: "RTRP",
    "cn lab": "CNL",
    "os lab": "OSL"
  };
  return known[normalized] || String(subject || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "SUB";
}

export async function listSubjects(req, res) {
  const scope = classScopeFromQuery(req);
  const params = { ...scope, facultyId: req.user.id };
  let sql = req.user.role === "faculty"
    ? `SELECT s.* FROM subjects s JOIN classes c ON c.subject_id = s.id AND c.faculty_id = :facultyId WHERE s.branch = :branch AND c.status = 'active'`
    : "SELECT * FROM subjects WHERE branch = :branch";
  if (scope.year) sql += req.user.role === "faculty" ? " AND s.year = :year" : " AND year = :year";
  if (scope.section) sql += req.user.role === "faculty" ? " AND s.section = :section" : " AND section = :section";
  sql += " ORDER BY name";
  res.json(await query(sql, params));
}

export async function listTimetable(req, res) {
  const scope = classScopeFromQuery(req);
  const params = { ...scope, facultyId: req.user.id };
  let sql = "SELECT * FROM timetable WHERE branch = :branch";
  if (scope.year) sql += " AND year = :year";
  if (scope.section) sql += " AND section = :section";
  if (req.user.role === "faculty") sql += " AND EXISTS (SELECT 1 FROM classes c WHERE c.faculty_id = :facultyId AND c.branch = timetable.branch AND c.year = timetable.year AND c.section = timetable.section AND c.subject_id = timetable.subject_id AND c.status = 'active')";
  sql += " ORDER BY FIELD(day_of_week, 'MON','TUE','WED','THU','FRI','SAT'), period_number";
  res.json(await query(sql, params));
}

export async function upsertTimetable(req, res) {
  const { id, branch, year, section, dayOfWeek, periodNumber, startTime, endTime, subjectId, room } = req.body;
  if (!branch || !year || !section || !dayOfWeek || !periodNumber || !subjectId) {
    return res.status(400).json({ message: "Class, day, period and subject are required" });
  }

  const subjects = await query(
    `SELECT s.* FROM subjects s
     JOIN classes c ON c.subject_id = s.id
     WHERE s.id = :subjectId AND c.faculty_id = :facultyId AND c.branch = :branch AND c.year = :year AND c.section = :section AND c.status = 'active'
     LIMIT 1`,
    { subjectId, facultyId: req.user.id, branch, year: String(year), section }
  );
  const subject = subjects[0];
  if (!subject) return res.status(403).json({ message: "Subject is not assigned to you for this class" });

  if (id) {
    await query(
      `UPDATE timetable
       SET day_of_week = :dayOfWeek, period_number = :periodNumber, start_time = :startTime, end_time = :endTime,
           subject_id = :subjectId, subject_name = :subjectName, room = :room
       WHERE id = :id AND faculty_id = :facultyId`,
      { id, dayOfWeek, periodNumber, startTime, endTime, subjectId, subjectName: subject.name, room, facultyId: req.user.id }
    );
  } else {
    await query(
      `INSERT INTO timetable (branch, year, section, day_of_week, period_number, start_time, end_time, subject_id, subject_name, faculty_id, room)
       VALUES (:branch, :year, :section, :dayOfWeek, :periodNumber, :startTime, :endTime, :subjectId, :subjectName, :facultyId, :room)`,
      { branch, year: String(year), section, dayOfWeek, periodNumber, startTime, endTime, subjectId, subjectName: subject.name, facultyId: req.user.id, room }
    );
  }

  res.status(201).json({ message: "Timetable saved" });
}

export async function listClasses(req, res) {
  const rows = await query(
    req.user.role === "hod"
      ? `SELECT c.*, s.name AS subject_name, s.code AS subject_code, u.name AS faculty_name
         FROM classes c
         JOIN subjects s ON s.id = c.subject_id
         JOIN users u ON u.id = c.faculty_id
         WHERE c.branch = :branch
         ORDER BY c.created_at DESC`
      : `SELECT c.*, s.name AS subject_name, s.code AS subject_code
         FROM classes c
         JOIN subjects s ON s.id = c.subject_id
         WHERE c.faculty_id = :facultyId
         ORDER BY c.created_at DESC`,
    { facultyId: req.user.id, branch: req.user.branch }
  );
  res.json(rows);
}

export async function createClass(req, res) {
  const { branch, year, section, subject } = req.body;
  if (!branch || !year || !section || !subject) return res.status(400).json({ message: "Branch, year, section and subject are required" });
  if (req.user.role === "hod" && branch !== req.user.branch) return res.status(403).json({ message: "HOD can manage only own branch" });
  const targetFacultyId = req.user.role === "hod" ? Number(req.body.facultyId) : req.user.id;
  if (!targetFacultyId) return res.status(400).json({ message: "Faculty is required" });
  const code = subjectCode(subject);
  let subjectRow = (await query(
    "SELECT * FROM subjects WHERE branch = :branch AND year = :year AND section = :section AND code = :code LIMIT 1",
    { branch, year: String(year), section, code }
  ))[0];
  if (!subjectRow) {
    const result = await query(
      `INSERT INTO subjects (name, code, branch, year, section, faculty_id)
       VALUES (:subject, :code, :branch, :year, :section, :facultyId)`,
      { subject, code, branch, year: String(year), section, facultyId: targetFacultyId }
    );
    subjectRow = { id: result.insertId, name: subject, code };
  }
  const duplicate = await query(
    "SELECT id FROM classes WHERE branch = :branch AND year = :year AND section = :section AND subject_id = :subjectId AND status = 'active' LIMIT 1",
    { branch, year: String(year), section, subjectId: subjectRow.id }
  );
  if (duplicate.length) return res.status(409).json({ message: "This subject is already assigned to another faculty for this class." });

  await query(
    `INSERT INTO classes (faculty_id, branch, year, section, subject_id, status)
     VALUES (:facultyId, :branch, :year, :section, :subjectId, 'active')`,
    { facultyId: targetFacultyId, branch, year: String(year), section, subjectId: subjectRow.id }
  );
  res.status(201).json({ message: "Class added" });
}

export async function updateClassStatus(req, res) {
  const status = req.body.status;
  if (!["active", "blocked"].includes(status)) return res.status(400).json({ message: "Status must be active or blocked" });
  if (status === "active") {
    const rows = await query("SELECT * FROM classes WHERE id = :id AND faculty_id = :facultyId LIMIT 1", { id: req.params.id, facultyId: req.user.id });
    const item = rows[0];
    if (!item) return res.status(404).json({ message: "Class not found" });
    const duplicate = await query(
      "SELECT id FROM classes WHERE id <> :id AND branch = :branch AND year = :year AND section = :section AND subject_id = :subjectId AND status = 'active' LIMIT 1",
      { id: item.id, branch: item.branch, year: item.year, section: item.section, subjectId: item.subject_id }
    );
    if (duplicate.length) return res.status(409).json({ message: "This subject is already assigned to another faculty for this class." });
  }
  await query("UPDATE classes SET status = :status WHERE id = :id AND faculty_id = :facultyId", { status, id: req.params.id, facultyId: req.user.id });
  res.json({ message: status === "blocked" ? "Class blocked" : "Class unblocked" });
}

export async function deleteClass(req, res) {
  await query("DELETE FROM classes WHERE id = :id AND faculty_id = :facultyId", { id: req.params.id, facultyId: req.user.id });
  res.json({ message: "Class removed" });
}

export async function deleteTimetable(req, res) {
  const rows = await query("SELECT * FROM timetable WHERE id = :id LIMIT 1", { id: req.params.id });
  const item = rows[0];
  if (!item) return res.status(404).json({ message: "Timetable period not found" });
  const ownClass = await facultyOwnsClass({ facultyId: req.user.id, branch: item.branch, year: item.year, section: item.section, subjectId: item.subject_id });
  if (!ownClass) return res.status(403).json({ message: "You can remove only your own active class periods" });
  await query("DELETE FROM timetable WHERE id = :id", { id: req.params.id });
  res.json({ message: "Timetable period removed" });
}
