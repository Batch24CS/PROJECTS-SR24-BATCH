import { query } from "../config/db.js";

export async function listNotifications(req, res) {
  const rows = await query(
    "SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT 40",
    { userId: req.user.id }
  );
  res.json(rows);
}

export async function markNotificationRead(req, res) {
  await query("UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :userId", { id: req.params.id, userId: req.user.id });
  res.json({ message: "Notification marked as read" });
}

export async function markAllNotificationsRead(req, res) {
  await query("UPDATE notifications SET is_read = TRUE WHERE user_id = :userId", { userId: req.user.id });
  res.json({ message: "All notifications marked as read" });
}

export async function markRelatedNotificationsRead(req, res) {
  const linkPath = String(req.body.linkPath || "").split("?")[0];
  if (!linkPath) return res.json({ message: "No related notifications" });
  await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = :userId
       AND link_path IS NOT NULL
       AND (SUBSTRING_INDEX(link_path, '?', 1) = :linkPath OR :linkPath LIKE CONCAT(SUBSTRING_INDEX(link_path, '?', 1), '%'))`,
    { userId: req.user.id, linkPath }
  );
  res.json({ message: "Related notifications marked as read" });
}
