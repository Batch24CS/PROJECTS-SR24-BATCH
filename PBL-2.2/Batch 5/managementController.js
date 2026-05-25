import { query } from "../config/db.js";
import { createNotification } from "../utils/notifications.js";

export async function listFaculty(req, res) {
  res.json(await query(
    `SELECT id, name, email, phone, mobile, faculty_id, faculty_type, approval_status, branch, year, section
     FROM users WHERE role = 'faculty' ${req.user.role === "admin" ? "" : "AND branch = :branch"} ORDER BY name`,
    { branch: req.user.branch }
  ));
}

export async function listUsersByRole(req, res) {
  const role = req.params.role;
  if (!["admin", "hod", "faculty", "student"].includes(role)) return res.status(400).json({ message: "Invalid role" });
  res.json(await query(
    `SELECT id, name, email, phone, mobile, roll_number, faculty_id, faculty_type, approval_status, branch, year, section, created_at
     FROM users WHERE role = :role ORDER BY created_at DESC`,
    { role }
  ));
}

export async function listHodRequests(_req, res) {
  res.json(await query(
    `SELECT hr.*, u.name, u.email, u.mobile, u.phone, u.approval_status
     FROM hod_requests hr
     JOIN users u ON u.id = hr.hod_id
     ORDER BY hr.created_at DESC`
  ));
}

export async function reviewHodRequest(req, res) {
  const status = req.body.status;
  if (!["approved", "rejected", "blocked"].includes(status)) return res.status(400).json({ message: "Status must be approved, rejected or blocked" });
  const rows = await query(
    `SELECT hr.*, u.name
     FROM hod_requests hr
     JOIN users u ON u.id = hr.hod_id
     WHERE hr.id = :id LIMIT 1`,
    { id: req.params.id }
  );
  const request = rows[0];
  if (!request) return res.status(404).json({ message: "HOD request not found" });
  await query("UPDATE users SET approval_status = :status, approved_by = :adminId, approved_at = CASE WHEN :status = 'approved' THEN NOW() ELSE approved_at END WHERE id = :hodId AND role = 'hod'", { status, adminId: req.user.id, hodId: request.hod_id });
  await query("UPDATE hod_requests SET status = :status, admin_id = :adminId, reviewed_at = NOW() WHERE id = :id", { status, adminId: req.user.id, id: request.id });
  await createNotification({
    req,
    userId: request.hod_id,
    title: status === "approved" ? "Admin approved your HOD account" : status === "blocked" ? "HOD account blocked" : "HOD request rejected",
    message: status === "approved" ? "You can now access the HOD dashboard." : status === "blocked" ? "Your HOD account was blocked." : "Your HOD request was rejected.",
    type: "approval",
    referenceId: request.id,
    linkPath: "/dashboard/profile",
    metadata: { status }
  });
  res.json({ message: `HOD request ${status}` });
}

export async function reviewUserApproval(req, res) {
  const status = req.body.status;
  if (!["approved", "rejected", "blocked"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved, rejected or blocked" });
  }
  const rows = await query("SELECT * FROM users WHERE id = :id LIMIT 1", { id: req.params.id });
  const user = rows[0];
  if (!user || !["faculty", "student"].includes(user.role)) {
    return res.status(404).json({ message: "User not found or cannot be reviewed by admin" });
  }

  await query(
    `UPDATE users
     SET approval_status = :status, approved_by = :adminId,
         approved_at = CASE WHEN :status = 'approved' THEN NOW() ELSE approved_at END
     WHERE id = :id`,
    { status, adminId: req.user.id, id: user.id }
  );

  if (user.role === "faculty") {
    await query(
      `UPDATE faculty_requests SET status = :status, reviewed_at = NOW()
       WHERE faculty_id = :facultyId AND status = 'pending'`,
      { status, facultyId: user.id }
    );
  }

  if (user.role === "student") {
    await query(
      `UPDATE registration_requests
       SET status = :status, reviewed_at = NOW()
       WHERE student_id = :studentId AND status = 'pending'`,
      { status, studentId: user.id }
    );
  }

  await createNotification({
    req,
    userId: user.id,
    title:
      status === "approved"
        ? "Your account has been approved"
        : status === "blocked"
          ? "Account blocked"
          : "Account request rejected",
    message:
      status === "approved"
        ? "An admin approved your account. You can access your dashboard."
        : status === "blocked"
          ? "Your account was blocked. Contact the college admin."
          : "Your account request was rejected by admin.",
    type: "approval",
    referenceId: user.id,
    linkPath: "/dashboard/profile",
    metadata: { status, role: user.role }
  });

  res.json({ message: `${user.role} ${status}` });
}

export async function listMentors(req, res) {
  const branch = req.user.role === "admin" ? String(req.query.branch || "") : req.user.branch;
  const scope = { branch, branchOnly: branch ? 1 : 0, facultyId: req.user.id, facultyOnly: req.user.role === "faculty" ? 1 : 0 };
  const individual = await query(
    `SELECT sm.*, s.name AS student_name, s.roll_number, s.branch, s.year, s.section,
            f.name AS faculty_name, f.faculty_id
     FROM student_mentors sm
     JOIN users s ON s.id = sm.student_id
     JOIN users f ON f.id = sm.faculty_id
     WHERE (:branchOnly = 0 OR s.branch = :branch)
       AND (:facultyOnly = 0 OR sm.faculty_id = :facultyId)
     ORDER BY sm.created_at DESC`,
    scope
  );
  const ranges = await query(
    `SELECT ma.*, f.name AS faculty_name, f.faculty_id
     FROM mentor_assignments ma
     JOIN users f ON f.id = ma.faculty_id
     WHERE (:branchOnly = 0 OR ma.branch = :branch)
       AND (:facultyOnly = 0 OR ma.faculty_id = :facultyId)
     ORDER BY ma.created_at DESC`,
    scope
  );
  const rangesWithStudents = await Promise.all(ranges.map(async (item) => {
    const students = await query(
      `SELECT id, name, roll_number, branch, year, section
       FROM users
       WHERE role = 'student' AND approval_status = 'approved'
         AND branch = :branch AND year = :year AND section = :section
         AND roll_number BETWEEN :startRoll AND :endRoll
       ORDER BY roll_number`,
      { branch: item.branch, year: String(item.year), section: item.section, startRoll: item.start_roll, endRoll: item.end_roll }
    );
    return { ...item, students, assignment_type: "range" };
  }));
  res.json([...rangesWithStudents, ...individual.map((item) => ({ ...item, assignment_type: "student" }))]);
}

export async function assignMentor(req, res) {
  const { studentId, facultyId, branch, year, section, startRoll, endRoll } = req.body;
  if (!facultyId) return res.status(400).json({ message: "Faculty is required" });
  if (startRoll && endRoll) {
    const classBranch = branch || req.user.branch;
    if (req.user.role === "hod" && classBranch !== req.user.branch) return res.status(403).json({ message: "Mentor assignment must stay inside HOD branch" });
    const faculty = await query("SELECT id FROM users WHERE id = :facultyId AND role = 'faculty' AND branch = :branch LIMIT 1", { facultyId, branch: classBranch });
    if (!faculty.length) return res.status(403).json({ message: "Faculty must be in your branch" });
    await query(
      `INSERT IGNORE INTO mentor_assignments (faculty_id, branch, year, section, start_roll, end_roll, assigned_by)
       VALUES (:facultyId, :branch, :year, :section, :startRoll, :endRoll, :assignedBy)`,
      { facultyId, branch: classBranch, year: String(year), section, startRoll, endRoll, assignedBy: req.user.id }
    );
    const students = await query(
      `SELECT id FROM users
       WHERE role = 'student' AND approval_status = 'approved'
         AND branch = :branch AND year = :year AND section = :section
         AND roll_number BETWEEN :startRoll AND :endRoll`,
      { branch: classBranch, year: String(year), section, startRoll, endRoll }
    );
    await Promise.all(students.map((student) => query(
      "INSERT IGNORE INTO student_mentors (student_id, faculty_id, assigned_by) VALUES (:studentId, :facultyId, :assignedBy)",
      { studentId: student.id, facultyId, assignedBy: req.user.id }
    )));
    return res.status(201).json({ message: "Mentor range assigned", studentCount: students.length });
  }
  if (!studentId) return res.status(400).json({ message: "Student or roll range is required" });
  const allowed = await query(
    `SELECT s.id AS student_id, f.id AS faculty_id
     FROM users s
     JOIN users f ON f.id = :facultyId AND f.role = 'faculty' AND f.branch = s.branch
     WHERE s.id = :studentId AND s.role = 'student' AND s.branch = :branch LIMIT 1`,
    { studentId, facultyId, branch: req.user.role === "admin" ? branch : req.user.branch }
  );
  if (!allowed.length) return res.status(403).json({ message: "Mentor assignment must stay inside HOD branch" });
  await query(
    "INSERT IGNORE INTO student_mentors (student_id, faculty_id, assigned_by) VALUES (:studentId, :facultyId, :assignedBy)",
    { studentId, facultyId, assignedBy: req.user.id }
  );
  res.status(201).json({ message: "Mentor assigned" });
}

export async function createAbsenceRequest(req, res) {
  const { date, periodNumber, subjectId, reason, eventId } = req.body;
  if (!date || !reason) return res.status(400).json({ message: "Date and reason are required" });
  const hod = (await query("SELECT id FROM users WHERE role = 'hod' AND branch = :branch AND approval_status = 'approved' LIMIT 1", { branch: req.user.branch }))[0];
  const mentor = (await query("SELECT faculty_id FROM student_mentors WHERE student_id = :studentId ORDER BY created_at DESC LIMIT 1", { studentId: req.user.id }))[0];
  const incharge = (await query(
    `SELECT id FROM users
     WHERE role = 'faculty' AND faculty_type = 'incharge' AND approval_status = 'approved'
       AND branch = :branch AND year = :year AND section = :section
     ORDER BY id LIMIT 1`,
    { branch: req.user.branch, year: String(req.user.year), section: req.user.section }
  ))[0];
  const result = await query(
    `INSERT INTO absence_requests (student_id, faculty_id, mentor_id, hod_id, date, period_number, subject_id, reason, proof_file, event_id, status)
     VALUES (:studentId, :facultyId, :mentorId, :hodId, :date, :periodNumber, :subjectId, :reason, :proofFile, :eventId, 'pending')`,
    { studentId: req.user.id, facultyId: incharge?.id || null, mentorId: mentor?.faculty_id || null, hodId: hod?.id || null, date, periodNumber: periodNumber || null, subjectId: subjectId || null, reason, proofFile: req.file ? `/uploads/${req.file.filename}` : null, eventId: eventId || null }
  );
  const notifyTargets = [...new Set([incharge?.id, hod?.id].filter(Boolean))];
  await Promise.all(notifyTargets.map((notifyId) => createNotification({
    req,
    userId: notifyId,
    title: "Permission request",
    message: `Permission request from ${req.user.rollNumber || req.user.roll_number} & ${req.user.name}.`,
    type: "absence_request",
    referenceId: result.insertId,
    linkPath: "/dashboard/absence-requests",
    metadata: { absenceRequestId: result.insertId }
  })));
  res.status(201).json({ message: "Permission request submitted to class incharge and HOD" });
}

export async function listAbsenceRequests(req, res) {
  if (req.user.role === "student") {
    return res.json(await query(
      `SELECT ar.*, reviewer.name AS reviewed_by_name, reviewer.role AS reviewed_by_role, reviewer.faculty_type AS reviewed_by_faculty_type
       FROM absence_requests ar
       LEFT JOIN users reviewer ON reviewer.id = ar.reviewed_by
       WHERE ar.student_id = :studentId
       ORDER BY ar.created_at DESC`,
      { studentId: req.user.id }
    ));
  }
  const rows = await query(
    `SELECT ar.*, u.name AS student_name, u.roll_number, u.branch, u.year, u.section,
            mentor.name AS mentor_name, faculty.name AS faculty_name, reviewer.name AS reviewed_by_name,
            reviewer.role AS reviewed_by_role, reviewer.faculty_type AS reviewed_by_faculty_type, e.title AS event_title
     FROM absence_requests ar
     JOIN users u ON u.id = ar.student_id
     LEFT JOIN users mentor ON mentor.id = ar.mentor_id
     LEFT JOIN users faculty ON faculty.id = ar.faculty_id
     LEFT JOIN users reviewer ON reviewer.id = ar.reviewed_by
     LEFT JOIN events e ON e.id = ar.event_id
     WHERE u.branch = :branch AND (:isHod = 1 OR ar.faculty_id = :facultyId)
     ORDER BY ar.created_at DESC`,
    { branch: req.user.branch, facultyId: req.user.id, isHod: req.user.role === "hod" ? 1 : 0 }
  );
  res.json(rows);
}

export async function reviewAbsenceRequest(req, res) {
  const status = req.body.status;
  if (!["approved", "rejected", "blocked"].includes(status)) return res.status(400).json({ message: "Status must be approved, rejected or blocked" });
  const rows = await query(
    `SELECT ar.*, u.branch, u.name AS student_name, u.roll_number
     FROM absence_requests ar
     JOIN users u ON u.id = ar.student_id
     WHERE ar.id = :id AND u.branch = :branch LIMIT 1`,
    { id: req.params.id, branch: req.user.branch }
  );
  const item = rows[0];
  if (!item) return res.status(404).json({ message: "Request not found" });
  if (item.status !== "pending") {
    const reviewer = item.reviewed_by ? (await query("SELECT role, faculty_type FROM users WHERE id = :id LIMIT 1", { id: item.reviewed_by }))[0] : null;
    const who = reviewer?.role === "hod" ? "HOD" : reviewer?.faculty_type === "incharge" ? "class incharge" : "another person";
    return res.json({ message: `Request already ${item.status} by ${who}` });
  }
  if (req.user.role === "faculty" && Number(item.faculty_id) !== Number(req.user.id)) {
    return res.status(403).json({ message: "You can review only requests sent to you" });
  }
  await query("UPDATE absence_requests SET status = :status, reviewed_by = :reviewedBy, reviewed_at = NOW() WHERE id = :id", { status, reviewedBy: req.user.id, id: req.params.id });
  if (status === "approved" && item.event_id) {
    const smart = await query(
      `INSERT INTO smart_attendance (created_by, created_by_role, branch, year, section, reason, start_date, end_date, start_period, end_period, remarks)
       SELECT :createdBy, :createdByRole, u.branch, u.year, u.section, 'Event participation', ar.date, ar.date,
              1, 7, CONCAT('Auto-created from permission request #', ar.id)
       FROM absence_requests ar
       JOIN users u ON u.id = ar.student_id
       WHERE ar.id = :id`,
      { createdBy: req.user.id, createdByRole: req.user.role === "hod" ? "hod" : "faculty", id: item.id }
    );
    await query("INSERT IGNORE INTO smart_attendance_students (smart_attendance_id, student_id) VALUES (:smartAttendanceId, :studentId)", { smartAttendanceId: smart.insertId, studentId: item.student_id });
  }
  await createNotification({
    req,
    userId: item.student_id,
    title: `Permission request ${status}`,
    message: `Your permission request was ${status} by ${req.user.role === "hod" ? "HOD" : "class incharge"}.`,
    type: "absence_request",
    referenceId: item.id,
    linkPath: "/dashboard/absence-request",
    metadata: { status }
  });
  const otherReviewer = req.user.role === "hod" ? item.faculty_id : item.hod_id;
  if (otherReviewer) await createNotification({
    req,
    userId: otherReviewer,
    title: `Permission request ${status}`,
    message: `Permission request from ${item.roll_number} & ${item.student_name} was ${status} by ${req.user.role === "hod" ? "HOD" : "class incharge"}.`,
    type: "absence_request",
    referenceId: item.id,
    linkPath: "/dashboard/absence-requests",
    metadata: { status, reviewedBy: req.user.role }
  });
  res.json({ message: `Request ${status} successfully` });
}
