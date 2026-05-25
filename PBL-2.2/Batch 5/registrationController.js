import { query, transaction } from "../config/db.js";
import { createNotification } from "../utils/notifications.js";

const CLASS_INCHARGE_WINDOW_MINUTES = 60;

async function classInchargeFor({ branch, year, section }) {
  const rows = await query(
    `SELECT id FROM users
     WHERE role = 'faculty' AND faculty_type = 'incharge' AND approval_status = 'approved'
       AND branch = :branch AND year = :year AND section = :section
     ORDER BY id LIMIT 1`,
    { branch, year: String(year), section }
  );
  return rows[0]?.id || null;
}

async function mentorsForStudent(studentId) {
  return query("SELECT faculty_id AS id FROM student_mentors WHERE student_id = :studentId", { studentId });
}

async function escalateExpiredRegistrationRequests(req) {
  const expired = await query(
    `SELECT rr.*, u.name, u.roll_number
     FROM registration_requests rr
     JOIN users u ON u.id = rr.student_id
     WHERE rr.status = 'pending'
       AND rr.branch = :branch
       AND TIMESTAMPDIFF(MINUTE, rr.created_at, NOW()) >= ${CLASS_INCHARGE_WINDOW_MINUTES}
       AND (rr.message IS NULL OR rr.message <> 'Escalated to mentors after class incharge timeout.')`,
    { branch: req.user.branch }
  );
  await Promise.all(expired.map(async (request) => {
    const mentors = await mentorsForStudent(request.student_id);
    await Promise.all(mentors.map((mentor) => createNotification({
      req,
      userId: mentor.id,
      title: "Registration request escalated",
      message: `${request.name} (${request.roll_number}) was not reviewed by class incharge within 1 hour.`,
      type: "registration",
      referenceId: request.id,
      linkPath: "/dashboard/registration-requests",
      metadata: { requestId: request.id, studentId: request.student_id }
    })));
    await query(
      "UPDATE registration_requests SET message = 'Escalated to mentors after class incharge timeout.' WHERE id = :id",
      { id: request.id }
    );
  }));
}

export async function listRegistrationRequests(req, res) {
  await escalateExpiredRegistrationRequests(req);
  const params = { branch: req.user.branch, facultyId: req.user.id };
  const rows = await query(
    req.user.role === "hod"
      ? `SELECT DISTINCT rr.*, u.name, u.email, u.phone, u.roll_number, u.admission_type
         FROM registration_requests rr
         JOIN users u ON u.id = rr.student_id
         WHERE rr.branch = :branch
         ORDER BY rr.created_at DESC`
      : `SELECT DISTINCT rr.*, u.name, u.email, u.phone, u.roll_number, u.admission_type
         FROM registration_requests rr
         JOIN users u ON u.id = rr.student_id
         WHERE rr.branch = :branch
           AND rr.status = 'pending'
           AND (
             (rr.faculty_id = :facultyId AND TIMESTAMPDIFF(MINUTE, rr.created_at, NOW()) < ${CLASS_INCHARGE_WINDOW_MINUTES})
             OR (
               TIMESTAMPDIFF(MINUTE, rr.created_at, NOW()) >= ${CLASS_INCHARGE_WINDOW_MINUTES}
               AND EXISTS (SELECT 1 FROM student_mentors sm WHERE sm.student_id = rr.student_id AND sm.faculty_id = :facultyId)
             )
           )
         ORDER BY rr.created_at DESC`,
    params
  );
  res.json(rows);
}

export async function listFacultyRequests(req, res) {
  const rows = await query(
    `SELECT fr.*, u.name, u.email, u.phone, u.mobile, u.faculty_id, u.faculty_type
     FROM faculty_requests fr
     JOIN users u ON u.id = fr.faculty_id
     WHERE fr.branch = :branch
     ORDER BY fr.created_at DESC`,
    { branch: req.user.branch }
  );
  res.json(rows);
}

export async function reviewRegistrationRequest(req, res) {
  const status = req.body.status;
  if (!["approved", "rejected", "blocked"].includes(status)) return res.status(400).json({ message: "Status must be approved, rejected or blocked" });

  const rows = await query(
    `SELECT rr.*, u.name, u.roll_number
     FROM registration_requests rr
     JOIN users u ON u.id = rr.student_id
     WHERE rr.id = :id AND rr.branch = :branch LIMIT 1`,
    { id: req.params.id, branch: req.user.branch }
  );
  const request = rows[0];
  if (!request) return res.status(404).json({ message: "Registration request not found in your branch" });
  if (req.user.role === "faculty") {
    const minutes = Number(request.created_at ? (Date.now() - new Date(request.created_at).getTime()) / 60000 : 0);
    const isClassIncharge = Number(request.faculty_id) === Number(req.user.id) && minutes < CLASS_INCHARGE_WINDOW_MINUTES;
    const isMentorAfterTimeout = minutes >= CLASS_INCHARGE_WINDOW_MINUTES && (await query(
      "SELECT 1 FROM student_mentors WHERE student_id = :studentId AND faculty_id = :facultyId LIMIT 1",
      { studentId: request.student_id, facultyId: req.user.id }
    )).length > 0;
    if (!isClassIncharge && !isMentorAfterTimeout) return res.status(403).json({ message: "Class incharge approval expired or this request is not assigned to you" });
  }

  await transaction(async (connection) => {
    await connection.execute(
      `UPDATE users
       SET approval_status = :status, approved_by = :approvedBy, approved_at = CASE WHEN :status = 'approved' THEN NOW() ELSE approved_at END
       WHERE id = :studentId AND branch = :branch`,
      { status, approvedBy: req.user.id, studentId: request.student_id, branch: req.user.branch }
    );
    await connection.execute(
      `UPDATE registration_requests
       SET status = :status, faculty_id = :facultyId, reviewed_at = NOW()
       WHERE id = :id`,
      { status, facultyId: req.user.id, id: request.id }
    );
  });

  await createNotification({
    req,
    userId: request.student_id,
    title: status === "approved" ? "Your account has been approved." : status === "blocked" ? "Registration blocked" : "Registration rejected",
    message: status === "approved" ? "Your account has been approved. You can now access your full dashboard." : status === "blocked" ? "Your registration was blocked. Contact faculty." : "Your registration was rejected. Contact faculty.",
    type: "registration",
    referenceId: request.id,
    linkPath: "/dashboard/profile",
    metadata: { requestId: request.id, status }
  });

  res.json({ message: `Registration ${status}` });
}

export async function reviewFacultyRequest(req, res) {
  const status = req.body.status;
  if (!["approved", "rejected", "blocked"].includes(status)) return res.status(400).json({ message: "Status must be approved, rejected or blocked" });
  const rows = await query(
    `SELECT fr.*, u.name
     FROM faculty_requests fr
     JOIN users u ON u.id = fr.faculty_id
     WHERE fr.id = :id AND fr.branch = :branch LIMIT 1`,
    { id: req.params.id, branch: req.user.branch }
  );
  const request = rows[0];
  if (!request) return res.status(404).json({ message: "Faculty request not found in your branch" });
  await transaction(async (connection) => {
    await connection.execute(
      "UPDATE users SET approval_status = :status, approved_by = :hodId, approved_at = CASE WHEN :status = 'approved' THEN NOW() ELSE approved_at END WHERE id = :facultyId AND role = 'faculty'",
      { status, hodId: req.user.id, facultyId: request.faculty_id }
    );
    await connection.execute(
      "UPDATE faculty_requests SET status = :status, hod_id = :hodId, reviewed_at = NOW() WHERE id = :id",
      { status, hodId: req.user.id, id: request.id }
    );
  });
  await createNotification({
    req,
    userId: request.faculty_id,
    title: status === "approved" ? "HOD approved your faculty account" : status === "blocked" ? "Faculty account blocked" : "Faculty request rejected",
    message: status === "approved" ? "You can now access your faculty dashboard." : status === "blocked" ? "You cannot re-request approval. Contact HOD." : "You can re-request faculty approval.",
    type: "faculty_request",
    referenceId: request.id,
    linkPath: "/dashboard/profile",
    metadata: { status }
  });
  res.json({ message: `Faculty request ${status}` });
}

export async function rerequestFacultyApproval(req, res) {
  if (req.user.approvalStatus === "blocked") return res.status(403).json({ message: "Your account is blocked. Contact HOD." });
  if (req.user.approvalStatus === "approved") return res.status(400).json({ message: "Your account is already approved" });
  const hod = (await query("SELECT id FROM users WHERE role = 'hod' AND branch = :branch AND approval_status = 'approved' LIMIT 1", { branch: req.user.branch }))[0];
  await transaction(async (connection) => {
    await connection.execute("UPDATE users SET approval_status = 'pending' WHERE id = :facultyId", { facultyId: req.user.id });
    await connection.execute(
      `INSERT INTO faculty_requests (faculty_id, hod_id, branch, status, message)
       VALUES (:facultyId, :hodId, :branch, 'pending', 'Faculty re-requested approval.')`,
      { facultyId: req.user.id, hodId: hod?.id || null, branch: req.user.branch }
    );
  });
  if (hod) {
    await createNotification({
      req,
      userId: hod.id,
      title: "Faculty re-request",
      message: `${req.user.name} submitted a new faculty approval request.`,
      type: "faculty_request",
      linkPath: "/dashboard/faculty-requests",
      metadata: { facultyId: req.user.id }
    });
  }
  res.json({ message: "Faculty approval request submitted again" });
}

export async function rerequestRegistration(req, res) {
  if (req.user.role !== "student") return res.status(403).json({ message: "Only students can re-request approval" });
  if (req.user.approvalStatus === "blocked") return res.status(403).json({ message: "Your account is blocked. Contact faculty/admin." });
  if (req.user.approvalStatus === "approved") return res.status(400).json({ message: "Your account is already approved" });

  await transaction(async (connection) => {
    await connection.execute("UPDATE users SET approval_status = 'pending' WHERE id = :studentId", { studentId: req.user.id });
    const inchargeId = await classInchargeFor({ branch: req.user.branch, year: req.user.year, section: req.user.section });
    await connection.execute(
      `INSERT INTO registration_requests (student_id, faculty_id, branch, year, section, status, message)
       VALUES (:studentId, :facultyId, :branch, :year, :section, 'pending', 'Student re-requested approval.')`,
      { studentId: req.user.id, facultyId: inchargeId, branch: req.user.branch, year: String(req.user.year), section: req.user.section }
    );
  });

  const inchargeId = await classInchargeFor({ branch: req.user.branch, year: req.user.year, section: req.user.section });
  const notifyRows = inchargeId ? [{ id: inchargeId }] : await mentorsForStudent(req.user.id);
  await Promise.all(notifyRows.map((faculty) => createNotification({
    req,
    userId: faculty.id,
    title: "Registration re-request",
    message: `${req.user.name} (${req.user.rollNumber}) submitted a new approval request.`,
    type: "registration",
    linkPath: "/dashboard/registration-requests",
    metadata: { studentId: req.user.id }
  })));

  res.json({ message: "Approval request submitted again" });
}
