import { query } from "../config/db.js";
import { createNotification } from "../utils/notifications.js";
import { facultyCanReachStudent } from "../utils/classPermissions.js";

async function canChat({ user, studentId, facultyId }) {
  if (!facultyId) return false;
  const target = (await query("SELECT id, role, branch FROM users WHERE id = :facultyId LIMIT 1", { facultyId }))[0];
  if (target?.role === "hod") {
    const participant = (await query("SELECT id, role, branch FROM users WHERE id = :studentId AND role IN ('student','faculty') LIMIT 1", { studentId }))[0];
    if (!participant || participant.branch !== target.branch) return false;
    return user.role === "hod" ? Number(user.id) === Number(facultyId) : ["student", "faculty"].includes(user.role) && Number(user.id) === Number(studentId);
  }
  if (user.role === "student") {
    if (Number(user.id) !== Number(studentId)) return false;
    const rows = await query(
      `SELECT 1 FROM classes c
       JOIN users u ON u.id = :studentId AND u.role = 'student' AND u.approval_status = 'approved' AND u.branch = c.branch AND u.year = c.year AND u.section = c.section
       WHERE c.faculty_id = :facultyId AND c.status = 'active' LIMIT 1`,
      { studentId, facultyId }
    );
    return rows.length > 0;
  }
  if (Number(user.id) !== Number(facultyId)) return false;
  return Boolean(await facultyCanReachStudent({ facultyId, studentId }));
}

export async function listContacts(req, res) {
  if (req.user.role === "student") {
    if (req.user.approvalStatus !== "approved") return res.json([]);
    const rows = await query(
      `SELECT u.id, u.name, u.faculty_id, u.email, c.branch, c.year, c.section,
              GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ', ') AS subject_name
       FROM classes c
       JOIN users u ON u.id = c.faculty_id
       JOIN subjects s ON s.id = c.subject_id
       WHERE c.branch = :branch AND c.year = :year AND c.section = :section AND c.status = 'active'
       GROUP BY u.id, u.name, u.faculty_id, u.email, c.branch, c.year, c.section
       ORDER BY u.name`,
      { branch: req.user.branch, year: req.user.year, section: req.user.section }
    );
    return res.json(rows);
  }

  if (req.user.role === "hod") {
    const students = await query(
      `SELECT id, name, roll_number, email, branch, year, section
       FROM users
       WHERE role = 'student' AND approval_status = 'approved' AND branch = :branch
       ORDER BY name`,
      { branch: req.user.branch }
    );
    const faculty = await query(
      `SELECT id, name, faculty_id, email, branch, year, section, 'faculty' AS role
       FROM users
       WHERE role = 'faculty' AND approval_status = 'approved' AND branch = :branch
       ORDER BY name`,
      { branch: req.user.branch }
    );
    return res.json([...faculty, ...students.map((item) => ({ ...item, role: "student" }))]);
  }

  const rows = await query(
    `SELECT DISTINCT u.id, u.name, u.roll_number, u.email, u.branch, u.year, u.section
     FROM users u
     JOIN classes c ON c.branch = u.branch AND c.year = u.year AND c.section = u.section
     WHERE c.faculty_id = :facultyId AND c.status = 'active' AND u.role = 'student' AND u.approval_status = 'approved'
     ORDER BY u.name`,
    { facultyId: req.user.id }
  );
  res.json(rows.map((item) => ({ ...item, role: "student" })));
}

export async function listConversations(req, res) {
  const where = req.user.role === "student" ? "c.student_id = :userId" : req.user.role === "hod" ? "c.hod_id = :userId" : "c.faculty_id = :userId";
  const rows = await query(
    `SELECT c.*, su.name AS student_name, su.roll_number, COALESCE(fu.name, hu.name) AS faculty_name, COALESCE(fu.faculty_id, 'HOD') AS faculty_id,
            SUM(CASE WHEN m.receiver_id = :userId AND m.is_read = FALSE THEN 1 ELSE 0 END) AS unread_count,
            MAX(m.created_at) AS last_message_at
     FROM conversations c
     JOIN users su ON su.id = c.student_id AND su.role IN ('student','faculty') AND su.approval_status = 'approved'
     LEFT JOIN users fu ON fu.id = c.faculty_id AND fu.role = 'faculty'
     LEFT JOIN users hu ON hu.id = c.hod_id AND hu.role = 'hod'
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE ${where}
     GROUP BY c.id
     ORDER BY COALESCE(last_message_at, c.created_at) DESC`,
    { userId: req.user.id }
  );
  res.json(rows);
}

export async function createConversation(req, res) {
  const facultyHodChat = req.user.role === "faculty" && req.body.hodId;
  const studentId = req.user.role === "student" || facultyHodChat ? req.user.id : Number(req.body.studentId);
  const requestedId = req.user.role === "hod" ? req.user.id : facultyHodChat ? Number(req.body.hodId) : req.user.role === "faculty" ? req.user.id : Number(req.body.facultyId);
  const target = (await query("SELECT id, role FROM users WHERE id = :id LIMIT 1", { id: requestedId }))[0];
  const facultyId = target?.role === "faculty" ? requestedId : null;
  const hodId = target?.role === "hod" ? requestedId : null;
  const chatPeerId = facultyId || hodId;
  if (!studentId || !chatPeerId) return res.status(400).json({ message: "Student and faculty/HOD are required" });
  if (!(await canChat({ user: req.user, studentId, facultyId: chatPeerId }))) return res.status(403).json({ message: "Chat is allowed only within your branch or class" });

  await query(
    `INSERT IGNORE INTO conversations (student_id, faculty_id, hod_id)
     VALUES (:studentId, :facultyId, :hodId)`,
    { studentId, facultyId, hodId }
  );
  const rows = await query("SELECT * FROM conversations WHERE student_id = :studentId AND ((:facultyId IS NOT NULL AND faculty_id = :facultyId) OR (:hodId IS NOT NULL AND hod_id = :hodId)) LIMIT 1", { studentId, facultyId, hodId });
  res.status(201).json(rows[0]);
}

export async function listMessages(req, res) {
  const rows = await query("SELECT * FROM conversations WHERE id = :id LIMIT 1", { id: req.params.id });
  const conversation = rows[0];
  const peerId = conversation.faculty_id || conversation.hod_id;
  if (!conversation || !(await canChat({ user: req.user, studentId: conversation.student_id, facultyId: peerId }))) {
    return res.status(403).json({ message: "You are not allowed to access this conversation." });
  }
  res.json(await query("SELECT * FROM messages WHERE conversation_id = :id ORDER BY created_at ASC", { id: req.params.id }));
}

export async function sendMessage(req, res) {
  const { conversationId, message } = req.body;
  if (!conversationId || !String(message || "").trim()) return res.status(400).json({ message: "Conversation and message are required" });
  const rows = await query("SELECT * FROM conversations WHERE id = :conversationId LIMIT 1", { conversationId });
  const conversation = rows[0];
  const peerId = conversation.faculty_id || conversation.hod_id;
  if (!conversation || !(await canChat({ user: req.user, studentId: conversation.student_id, facultyId: peerId }))) {
    return res.status(403).json({ message: "You are not allowed to access this conversation." });
  }
  if (![Number(conversation.student_id), Number(conversation.faculty_id), Number(conversation.hod_id)].includes(Number(req.user.id))) {
    return res.status(403).json({ message: "You are not allowed to access this conversation." });
  }
  const receiverId = Number(req.user.id) === Number(conversation.student_id) ? (conversation.hod_id || conversation.faculty_id) : conversation.student_id;
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, receiver_id, message)
     VALUES (:conversationId, :senderId, :receiverId, :message)`,
    { conversationId, senderId: req.user.id, receiverId, message: String(message).trim() }
  );
  const sent = (await query("SELECT * FROM messages WHERE id = :id", { id: result.insertId }))[0];
  req.app.get("io")?.to(`conversation:${conversationId}`).emit("chat:message", sent);
  const receiverRole = req.user.role === "student" ? (conversation.hod_id ? "hod" : "faculty") : "student";
  await createNotification({
    req,
    userId: receiverId,
    title: "New chat message",
    message: sent.message,
    type: "chat",
    referenceId: Number(conversationId),
    linkPath: receiverRole === "student" ? `/dashboard/contact-faculty?conversationId=${conversationId}` : `/dashboard/messages?conversationId=${conversationId}`,
    metadata: { conversationId: Number(conversationId), senderId: req.user.id }
  });
  res.status(201).json(sent);
}

export async function markMessagesRead(req, res) {
  const rows = await query("SELECT * FROM conversations WHERE id = :conversationId LIMIT 1", { conversationId: req.body.conversationId });
  const conversation = rows[0];
  if (!conversation || !(await canChat({ user: req.user, studentId: conversation.student_id, facultyId: conversation.faculty_id || conversation.hod_id }))) {
    return res.status(403).json({ message: "You are not allowed to access this conversation." });
  }
  await query(
    "UPDATE messages SET is_read = TRUE WHERE conversation_id = :conversationId AND receiver_id = :userId",
    { conversationId: req.body.conversationId, userId: req.user.id }
  );
  req.app.get("io")?.to(`conversation:${req.body.conversationId}`).emit("chat:read", { conversationId: req.body.conversationId, userId: req.user.id });
  res.json({ message: "Messages marked read" });
}
