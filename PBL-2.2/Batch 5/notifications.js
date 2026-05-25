import { query } from "../config/db.js";

export async function createNotification({ req, userId, title, message, type = "general", referenceId = null, linkPath = null, metadata = null }) {
  if (!userId) return null;
  const result = await query(
    `INSERT INTO notifications (user_id, title, message, type, reference_id, link_path, metadata, metadata_json)
     VALUES (:userId, :title, :message, :type, :referenceId, :linkPath, :metadata, :metadata)`,
    { userId, title, message, type, referenceId, linkPath, metadata: metadata ? JSON.stringify(metadata) : null }
  );
  const rows = await query("SELECT * FROM notifications WHERE id = :id", { id: result.insertId });
  const notification = rows[0];
  req?.app?.get("io")?.to(`user:${userId}`).emit("notification:new", notification);
  return notification;
}

export async function notifyClass({ req, branch, year, section, title, message, type = "general", referenceId = null, linkPath = null, metadata = null }) {
  const students = await query(
    `SELECT id FROM users
     WHERE role = 'student' AND approval_status = 'approved'
       AND branch = :branch AND year = :year AND section = :section`,
    { branch, year: String(year), section }
  );
  await Promise.all(students.map((student) => createNotification({ req, userId: student.id, title, message, type, referenceId, linkPath, metadata })));
  return students.length;
}
