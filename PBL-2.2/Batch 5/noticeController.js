import { query } from "../config/db.js";
import { notifyClass } from "../utils/notifications.js";
import { facultyOwnsClass } from "../utils/classPermissions.js";

export async function listNotices(req, res) {
  if (req.user.role === "student") {
    return res.json(
      await query(
        `SELECT * FROM notices
         WHERE branch = :branch AND year = :year AND section = :section
         ORDER BY created_at DESC`,
        { branch: req.user.branch, year: req.user.year, section: req.user.section }
      )
    );
  }

  res.json(await query("SELECT * FROM notices WHERE faculty_id = :facultyId ORDER BY created_at DESC", { facultyId: req.user.id }));
}

export async function createNotice(req, res) {
  const { title, description, branch, year, section } = req.body;
  const ownClass = await facultyOwnsClass({ facultyId: req.user.id, branch, year, section });
  if (!ownClass) return res.status(403).json({ message: "You can send notices only to your own active classes" });
  await query(
    `INSERT INTO notices (faculty_id, title, description, branch, year, section)
     VALUES (:facultyId, :title, :description, :branch, :year, :section)`,
    { facultyId: req.user.id, title, description, branch, year: String(year), section }
  );
  await notifyClass({ req, branch, year: String(year), section, title: "New notice", message: title, type: "notice", linkPath: "/dashboard/study-materials?tab=notices", metadata: { branch, year: String(year), section } });
  res.status(201).json({ message: "Notice created" });
}

export async function updateNotice(req, res) {
  await query(
    `UPDATE notices SET title = :title, description = :description, branch = :branch, year = :year, section = :section
     WHERE id = :id AND faculty_id = :facultyId`,
    { ...req.body, id: req.params.id, facultyId: req.user.id }
  );
  res.json({ message: "Notice updated" });
}

export async function deleteNotice(req, res) {
  await query("DELETE FROM notices WHERE id = :id AND faculty_id = :facultyId", { id: req.params.id, facultyId: req.user.id });
  res.json({ message: "Notice removed" });
}
