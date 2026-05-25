import { query } from "../config/db.js";
import { createNotification } from "../utils/notifications.js";
import { isClassIncharge, periodRangeForType } from "../utils/campusLocation.js";

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function inchargeClassGuard(req, { branch, year, section }) {
  if (!isClassIncharge(req.user)) {
    return { ok: false, status: 403, message: "Smart Attendance can only be managed by the class incharge." };
  }
  if (branch !== req.user.branch || String(year) !== String(req.user.year) || section !== req.user.section) {
    return { ok: false, status: 403, message: "Class incharge can manage smart attendance only for their own class." };
  }
  return { ok: true };
}

function datesBetween(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

async function notifyTimetableFacultyForSmartAttendance({
  req,
  branch,
  year,
  section,
  startDate,
  endDate,
  startPeriod,
  endPeriod,
  reason,
  studentCount
}) {
  const notified = new Set();
  for (const date of datesBetween(startDate, endDate)) {
    const dayOfWeek = DAY_CODES[new Date(`${date}T12:00:00`).getDay()];
    for (let period = startPeriod; period <= endPeriod; period += 1) {
      const rows = await query(
        `SELECT t.faculty_id, t.subject_name, sub.name AS subject_label
         FROM timetable t
         LEFT JOIN subjects sub ON sub.id = t.subject_id
         WHERE t.branch = :branch AND t.year = :year AND t.section = :section
           AND t.day_of_week = :dayOfWeek AND t.period_number = :periodNumber
           AND t.faculty_id IS NOT NULL`,
        { branch, year: String(year), section, dayOfWeek, periodNumber: period }
      );
      for (const row of rows) {
        const facultyId = Number(row.faculty_id);
        if (!facultyId || notified.has(facultyId) || facultyId === Number(req.user.id)) continue;
        notified.add(facultyId);
        const subjectName = row.subject_label || row.subject_name || "class";
        await createNotification({
          req,
          userId: facultyId,
          title: "Smart attendance in your class period",
          message: `${studentCount} student(s) have smart attendance (${reason}) during ${subjectName} on ${date}, Period ${period}.`,
          type: "smart_attendance",
          linkPath: "/dashboard/attendance",
          metadata: { branch, year, section, date, periodNumber: period, subjectName }
        });
      }
    }
  }
}

export async function listAttendance(req, res) {
  if (req.user.role === "student") {
    return res.json(await query(
      `SELECT ar.*, s.attendance_date, s.period_number, s.topic, sub.name AS subject, sub.code,
              DAYNAME(s.attendance_date) AS day_name
       FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       LEFT JOIN subjects sub ON sub.id = s.subject_id
       WHERE ar.student_id = :studentId
       ORDER BY s.attendance_date DESC, s.period_number DESC`,
      { studentId: req.user.id }
    ));
  }

  const rows = await query(
    `SELECT s.*, sub.name AS subject, COUNT(ar.id) AS total_students,
            SUM(ar.status = 'absent') AS absent_count
     FROM attendance_sessions s
     LEFT JOIN subjects sub ON sub.id = s.subject_id
     LEFT JOIN attendance_records ar ON ar.session_id = s.id
     WHERE ${req.user.role === "hod" ? "s.branch = :branch" : "s.faculty_id = :facultyId"}
     GROUP BY s.id
     ORDER BY s.attendance_date DESC, s.period_number DESC`,
    { facultyId: req.user.id, branch: req.user.branch }
  );
  res.json(rows);
}

async function updateAttendanceSummary(studentId, subjectId) {
  const subjectRows = await query("SELECT name FROM subjects WHERE id = :subjectId LIMIT 1", { subjectId });
  const subjectName = subjectRows[0]?.name;
  if (!subjectName) return;
  const totalRows = await query(
    `SELECT COUNT(*) AS total
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.session_id
     WHERE ar.student_id = :studentId AND s.subject_id = :subjectId`,
    { studentId, subjectId }
  );
  const presentRows = await query(
    `SELECT COUNT(*) AS present
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.session_id
     WHERE ar.student_id = :studentId AND s.subject_id = :subjectId
       AND ar.status IN ('present','smart_present','present_override')`,
    { studentId, subjectId }
  );
  const total = Number(totalRows[0]?.total || 0);
  const present = Number(presentRows[0]?.present || 0);
  const percentage = total ? Math.round((present / total) * 100) : 0;
  const existing = await query("SELECT id FROM attendance WHERE student_id = :studentId AND subject = :subject LIMIT 1", { studentId, subject: subjectName });
  if (existing.length) {
    await query("UPDATE attendance SET total_classes = :total, attended_classes = :present, percentage = :percentage WHERE id = :id", { total, present, percentage, id: existing[0].id });
  } else {
    await query("INSERT INTO attendance (student_id, subject, total_classes, attended_classes, percentage) VALUES (:studentId, :subject, :total, :present, :percentage)", { studentId, subject: subjectName, total, present, percentage });
  }
}

async function subjectForUser(req, subjectId) {
  const params = { subjectId, facultyId: req.user.id, branch: req.user.branch };
  const rows = await query(
    req.user.role === "hod"
      ? "SELECT * FROM subjects WHERE id = :subjectId AND branch = :branch LIMIT 1"
      : `SELECT s.* FROM subjects s
         JOIN classes c ON c.subject_id = s.id
         WHERE s.id = :subjectId AND c.faculty_id = :facultyId AND c.status = 'active'
         LIMIT 1`,
    params
  );
  return rows[0];
}

async function smartStudentIds({ branch, year, section, attendanceDate, periodNumber }) {
  const rows = await query(
    `SELECT sas.student_id
     FROM smart_attendance sa
     JOIN smart_attendance_students sas ON sas.smart_attendance_id = sa.id
     WHERE sa.branch = :branch AND sa.year = :year AND sa.section = :section
       AND :attendanceDate BETWEEN sa.start_date AND sa.end_date
       AND :periodNumber BETWEEN sa.start_period AND sa.end_period`,
    { branch, year: String(year), section, attendanceDate, periodNumber: Number(periodNumber) }
  );
  return new Set(rows.map((row) => Number(row.student_id)));
}

export async function listAttendanceRoster(req, res) {
  const { subjectId, attendanceDate = new Date().toISOString().slice(0, 10), periodNumber = 1 } = req.query;
  const subject = await subjectForUser(req, subjectId);
  if (!subject) return res.status(403).json({ message: "Subject is not available to you" });
  const smartIds = await smartStudentIds({ branch: subject.branch, year: subject.year, section: subject.section, attendanceDate, periodNumber });
  const students = await query(
    `SELECT u.id, u.name, u.roll_number, u.branch, u.year, u.section,
            latest.campus_status, latest.zone_name, latest.latitude, latest.longitude, latest.last_updated
     FROM users u
     LEFT JOIN (
       SELECT lu.*
       FROM location_updates lu
       JOIN (SELECT student_id, MAX(last_updated) AS max_updated FROM location_updates GROUP BY student_id) recent
         ON recent.student_id = lu.student_id AND recent.max_updated = lu.last_updated
     ) latest ON latest.student_id = u.id
     WHERE u.role = 'student' AND u.approval_status = 'approved'
       AND u.branch = :branch AND u.year = :year AND u.section = :section
     ORDER BY u.roll_number`,
    { branch: subject.branch, year: subject.year, section: subject.section }
  );
  res.json(students.map((student) => ({
    ...student,
    smart_attendance_active: smartIds.has(Number(student.id)),
    default_status: smartIds.has(Number(student.id)) ? "smart_present" : student.campus_status === "INSIDE" ? "present" : "absent",
    place: student.zone_name || (student.campus_status ? "Location not available" : "Location not available")
  })));
}

export async function createAttendanceSession(req, res) {
  const { subjectId, attendanceDate, periodNumber, topic, absentStudentIds = [], overrideStudentIds = [], presentStudentIds = [] } = req.body;
  if (!subjectId || !attendanceDate || !periodNumber || !topic) {
    return res.status(400).json({ message: "Subject, date, period and topic are required" });
  }

  const subject = await subjectForUser(req, subjectId);
  if (!subject) return res.status(403).json({ message: "Subject is not assigned to you" });

  const students = await query(
    `SELECT id, name, roll_number FROM users
     WHERE role = 'student' AND approval_status = 'approved'
       AND branch = :branch AND year = :year AND section = :section
     ORDER BY roll_number`,
    { branch: subject.branch, year: subject.year, section: subject.section }
  );
  const smartIds = await smartStudentIds({ branch: subject.branch, year: subject.year, section: subject.section, attendanceDate, periodNumber });
  const locations = await query(
    `SELECT latest.*
     FROM location_updates latest
     JOIN (SELECT student_id, MAX(last_updated) AS max_updated FROM location_updates GROUP BY student_id) recent
       ON recent.student_id = latest.student_id AND recent.max_updated = latest.last_updated`,
    {}
  );
  const locationByStudent = new Map(locations.map((item) => [Number(item.student_id), item]));
  const studentIds = new Set(students.map((student) => Number(student.id)));
  const absentIds = new Set(absentStudentIds.map(Number).filter((id) => studentIds.has(id)));
  const overrideIds = new Set(overrideStudentIds.map(Number).filter((id) => studentIds.has(id)));
  const presentIds = new Set(presentStudentIds.map(Number).filter((id) => studentIds.has(id)));
  const useExplicitMarks = presentIds.size > 0 || absentIds.size > 0;

  const result = await query(
    `INSERT INTO attendance_sessions (faculty_id, subject_id, branch, year, section, attendance_date, period_number, topic)
     VALUES (:facultyId, :subjectId, :branch, :year, :section, :attendanceDate, :periodNumber, :topic)`,
    {
      facultyId: req.user.role === "faculty" ? req.user.id : null,
      subjectId,
      branch: subject.branch,
      year: subject.year,
      section: subject.section,
      attendanceDate,
      periodNumber,
      topic
    }
  );

  const records = students
    .filter((student) => {
      const studentId = Number(student.id);
      if (smartIds.has(studentId)) return true;
      if (useExplicitMarks) return presentIds.has(studentId) || absentIds.has(studentId);
      return true;
    })
    .map((student) => {
      const studentId = Number(student.id);
      const location = locationByStudent.get(studentId);
      let status;
      if (smartIds.has(studentId)) {
        status = "smart_present";
      } else if (useExplicitMarks) {
        if (presentIds.has(studentId)) {
          status = location?.campus_status === "INSIDE" ? "present" : "present_override";
        } else {
          status = "absent";
        }
      } else {
        status = overrideIds.has(studentId)
          ? "present_override"
          : absentIds.has(studentId) || location?.campus_status !== "INSIDE"
            ? "absent"
            : "present";
      }
      return { student, studentId, location, status };
    });

  await Promise.all(records.map(({ studentId, location, status }) => query(
      "INSERT INTO attendance_records (session_id, student_id, status, source, place, campus_status, override_reason) VALUES (:sessionId, :studentId, :status, :source, :place, :campusStatus, :overrideReason)",
      { sessionId: result.insertId, studentId, status, source: status === "smart_present" ? "smart_attendance" : status === "present_override" ? "override" : "faculty", place: location?.zone_name || "Location not available", campusStatus: location?.campus_status || null, overrideReason: status === "present_override" ? "Faculty marked present outside campus" : null }
    )
  ));

  await Promise.all(records
    .filter((record) => record.status === "absent")
    .map(({ student }) => createNotification({
      req,
      userId: student.id,
      title: "Absent — class marked",
      message: `You were marked absent in ${subject.name} (Period ${periodNumber}) on ${attendanceDate}.${topic ? ` Topic: ${topic}.` : ""}`,
      type: "attendance",
      referenceId: result.insertId,
      linkPath: "/dashboard/attendance",
      metadata: {
        sessionId: result.insertId,
        subjectId: Number(subjectId),
        subjectName: subject.name,
        periodNumber: Number(periodNumber),
        attendanceDate,
        topic,
        status: "absent",
        branch: subject.branch,
        year: subject.year,
        section: subject.section
      }
    })));

  for (const student of students) {
    await updateAttendanceSummary(student.id, subjectId);
  }

  if (subject.faculty_id && Number(subject.faculty_id) !== Number(req.user.id)) {
    await createNotification({
      req,
      userId: subject.faculty_id,
      title: "Attendance submitted",
      message: `Attendance was marked for ${subject.name} Period ${periodNumber} on ${attendanceDate}.`,
      type: "attendance",
      referenceId: result.insertId,
      linkPath: `/dashboard/attendance?sessionId=${result.insertId}`,
      metadata: { sessionId: result.insertId, subjectId: Number(subjectId), periodNumber }
    });
  }

  res.status(201).json({ message: "Attendance submitted successfully", totalStudents: students.length, absentCount: absentIds.size });
}

export async function getAttendanceSession(req, res) {
  const sessionRows = await query(
    `SELECT s.*, sub.name AS subject
     FROM attendance_sessions s
     LEFT JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.id = :id AND (${req.user.role === "hod" ? "s.branch = :branch" : "s.faculty_id = :facultyId"})
     LIMIT 1`,
    { id: req.params.id, branch: req.user.branch, facultyId: req.user.id }
  );
  const session = sessionRows[0];
  if (!session) return res.status(404).json({ message: "Attendance session not found" });
  const records = await query(
    `SELECT ar.*, u.name, u.roll_number
     FROM attendance_records ar
     JOIN users u ON u.id = ar.student_id
     WHERE ar.session_id = :id
     ORDER BY u.roll_number`,
    { id: req.params.id }
  );
  const history = await query(
    `SELECT ah.*, u.name AS changed_by_name
     FROM attendance_history ah
     LEFT JOIN users u ON u.id = ah.changed_by
     JOIN attendance_records ar ON ar.id = ah.attendance_id
     WHERE ar.session_id = :id
     ORDER BY ah.created_at DESC`,
    { id: req.params.id }
  );
  res.json({ session, records, history });
}

export async function updateAttendanceRecord(req, res) {
  const { status, reason = "" } = req.body;
  if (!["present", "absent", "smart_present", "present_override"].includes(status)) return res.status(400).json({ message: "Invalid attendance status" });
  const rows = await query(
    `SELECT ar.*, s.subject_id, s.branch, s.faculty_id
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.session_id
     WHERE ar.id = :id AND (${req.user.role === "hod" ? "s.branch = :branch" : "s.faculty_id = :facultyId"})
     LIMIT 1`,
    { id: req.params.id, branch: req.user.branch, facultyId: req.user.id }
  );
  const record = rows[0];
  if (!record) return res.status(404).json({ message: "Attendance record not found" });
  await query(
    "UPDATE attendance_records SET status = :status, source = :source, override_reason = :reason WHERE id = :id",
    { status, source: status === "smart_present" ? "smart_attendance" : status === "present_override" ? "override" : "faculty", reason: reason || null, id: req.params.id }
  );
  await query(
    "INSERT INTO attendance_history (attendance_id, changed_by, old_status, new_status, reason) VALUES (:attendanceId, :changedBy, :oldStatus, :newStatus, :reason)",
    { attendanceId: req.params.id, changedBy: req.user.id, oldStatus: record.status, newStatus: status, reason }
  );
  await updateAttendanceSummary(record.student_id, record.subject_id);
  res.json({ message: "Attendance submitted successfully" });
}

export async function createSmartAttendance(req, res) {
  const { branch, year, section, studentIds = [], reason, startDate, endDate, remarks, attendanceType = "whole_day", periodStart = 1 } = req.body;
  const guard = inchargeClassGuard(req, { branch, year, section });
  if (!guard.ok) return res.status(guard.status).json({ message: guard.message });
  if (!branch || !year || !section || !reason || !startDate || !endDate || !studentIds.length) {
    return res.status(400).json({ message: "Class, students, reason and date range are required" });
  }
  const { startPeriod, endPeriod } = periodRangeForType(attendanceType, periodStart);
  const insertParams = {
    createdBy: req.user.id,
    createdByRole: "faculty",
    branch,
    year: String(year),
    section,
    reason,
    startDate,
    endDate,
    startPeriod,
    endPeriod,
    attendanceType,
    periodStart: Number(periodStart) || 1,
    remarks: remarks || null
  };
  let result;
  try {
    result = await query(
      `INSERT INTO smart_attendance (created_by, created_by_role, branch, year, section, reason, start_date, end_date, start_period, end_period, attendance_type, period_start, remarks)
       VALUES (:createdBy, :createdByRole, :branch, :year, :section, :reason, :startDate, :endDate, :startPeriod, :endPeriod, :attendanceType, :periodStart, :remarks)`,
      insertParams
    );
  } catch (error) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
    result = await query(
      `INSERT INTO smart_attendance (created_by, created_by_role, branch, year, section, reason, start_date, end_date, start_period, end_period, remarks)
       VALUES (:createdBy, :createdByRole, :branch, :year, :section, :reason, :startDate, :endDate, :startPeriod, :endPeriod, :remarks)`,
      insertParams
    );
  }
  await Promise.all(studentIds.map((studentId) => query(
    "INSERT IGNORE INTO smart_attendance_students (smart_attendance_id, student_id) VALUES (:smartAttendanceId, :studentId)",
    { smartAttendanceId: result.insertId, studentId }
  )));
  await Promise.all(studentIds.map((studentId) => createNotification({
    req,
    userId: studentId,
    title: "Smart Attendance applied",
    message: `${reason} attendance is active from ${startDate} to ${endDate} (Periods ${startPeriod}-${endPeriod}).`,
    type: "smart_attendance",
    referenceId: result.insertId,
    linkPath: "/dashboard/attendance",
    metadata: { smartAttendanceId: result.insertId }
  })));
  await notifyTimetableFacultyForSmartAttendance({
    req,
    branch,
    year,
    section,
    startDate,
    endDate,
    startPeriod,
    endPeriod,
    reason,
    studentCount: studentIds.length
  });
  res.status(201).json({ message: "Smart Attendance submitted", id: result.insertId });
}

export async function listSmartAttendance(req, res) {
  const params = { branch: req.user.branch };
  let where = "sa.branch = :branch";
  if (req.user.role === "faculty" && req.user.facultyType === "incharge") {
    where += " AND sa.year = :year AND sa.section = :section";
    params.year = String(req.user.year);
    params.section = req.user.section;
  }
  const rows = await query(
    `SELECT sa.*, COUNT(sas.student_id) AS student_count
     FROM smart_attendance sa
     LEFT JOIN smart_attendance_students sas ON sas.smart_attendance_id = sa.id
     WHERE ${where}
     GROUP BY sa.id
     ORDER BY sa.created_at DESC`,
    params
  );
  res.json(rows);
}

export async function getSmartAttendance(req, res) {
  const rows = await query(
    `SELECT sa.* FROM smart_attendance sa WHERE sa.id = :id AND sa.branch = :branch LIMIT 1`,
    { id: req.params.id, branch: req.user.branch }
  );
  const entry = rows[0];
  if (!entry) return res.status(404).json({ message: "Smart attendance record not found" });
  const students = await query(
    `SELECT u.id, u.name, u.roll_number
     FROM smart_attendance_students sas
     JOIN users u ON u.id = sas.student_id
     WHERE sas.smart_attendance_id = :id
     ORDER BY u.roll_number`,
    { id: req.params.id }
  );
  res.json({ ...entry, studentIds: students.map((row) => row.id), students });
}

export async function updateSmartAttendance(req, res) {
  const rows = await query("SELECT * FROM smart_attendance WHERE id = :id LIMIT 1", { id: req.params.id });
  const entry = rows[0];
  if (!entry) return res.status(404).json({ message: "Smart attendance record not found" });
  const guard = inchargeClassGuard(req, { branch: entry.branch, year: entry.year, section: entry.section });
  if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

  const {
    studentIds = [],
    reason = entry.reason,
    startDate = entry.start_date,
    endDate = entry.end_date,
    remarks = entry.remarks,
    attendanceType = entry.attendance_type || "whole_day",
    periodStart = entry.period_start || 1
  } = req.body;
  if (!studentIds.length) return res.status(400).json({ message: "Select at least one student" });
  const { startPeriod, endPeriod } = periodRangeForType(attendanceType, periodStart);

  const updateParams = {
    id: req.params.id,
    reason,
    startDate,
    endDate,
    startPeriod,
    endPeriod,
    attendanceType,
    periodStart: Number(periodStart) || 1,
    remarks
  };
  try {
    await query(
      `UPDATE smart_attendance
       SET reason = :reason, start_date = :startDate, end_date = :endDate, start_period = :startPeriod, end_period = :endPeriod,
           attendance_type = :attendanceType, period_start = :periodStart, remarks = :remarks
       WHERE id = :id`,
      updateParams
    );
  } catch (error) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
    await query(
      `UPDATE smart_attendance
       SET reason = :reason, start_date = :startDate, end_date = :endDate, start_period = :startPeriod, end_period = :endPeriod, remarks = :remarks
       WHERE id = :id`,
      updateParams
    );
  }
  await query("DELETE FROM smart_attendance_students WHERE smart_attendance_id = :id", { id: req.params.id });
  await Promise.all(studentIds.map((studentId) => query(
    "INSERT INTO smart_attendance_students (smart_attendance_id, student_id) VALUES (:smartAttendanceId, :studentId)",
    { smartAttendanceId: req.params.id, studentId }
  )));
  res.json({ message: "Smart attendance updated successfully" });
}

export async function deleteSmartAttendance(req, res) {
  const rows = await query("SELECT * FROM smart_attendance WHERE id = :id LIMIT 1", { id: req.params.id });
  const entry = rows[0];
  if (!entry) return res.status(404).json({ message: "Smart attendance record not found" });
  const guard = inchargeClassGuard(req, { branch: entry.branch, year: entry.year, section: entry.section });
  if (!guard.ok) return res.status(guard.status).json({ message: guard.message });
  await query("DELETE FROM smart_attendance WHERE id = :id", { id: req.params.id });
  res.json({ message: "Smart attendance removed successfully" });
}

export async function deleteAttendance(req, res) {
  await query("DELETE FROM attendance_sessions WHERE id = :id AND faculty_id = :facultyId", { id: req.params.id, facultyId: req.user.id });
  res.json({ message: "Attendance session removed" });
}
