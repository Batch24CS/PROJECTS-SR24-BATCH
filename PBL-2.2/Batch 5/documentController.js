import { query } from "../config/db.js";
import { notifyClass } from "../utils/notifications.js";
import { facultyOwnsClass } from "../utils/classPermissions.js";

const typeMap = { notes: "notes", questions: "important_questions", notice: "notice", notices: "notice" };

export async function listDocuments(req, res) {
  const type = req.query.type || typeMap[req.query.category] || req.query.category;
  const search = `%${req.query.search || ""}%`;
  const params = { type, search };
  let sql = "SELECT * FROM documents WHERE (title LIKE :search OR type LIKE :search)";

  if (type) sql += " AND type = :type";
  if (req.user.role === "student") {
    Object.assign(params, { branch: req.user.branch, year: req.user.year, section: req.user.section });
    sql += " AND branch = :branch AND year = :year AND section = :section";
  } else {
    params.branch = req.user.branch;
    sql += " AND branch = :branch";
  }

  sql += " ORDER BY created_at DESC";
  res.json(await query(sql, params));
}

export async function createDocument(req, res) {
  const { title, type, category, branch, year, section } = req.body;
  if (!title || !(type || category) || !branch || !year || !section) {
    return res.status(400).json({ message: "Title, type, branch, year and section are required" });
  }
  const ownClass = req.user.role === "hod" && branch === req.user.branch ? true : await facultyOwnsClass({ facultyId: req.user.id, branch, year, section });
  if (!ownClass) return res.status(403).json({ message: "You can upload only for your own active classes" });

  await query(
    `INSERT INTO documents (uploaded_by, title, type, branch, year, section, file_path)
     VALUES (:uploadedBy, :title, :type, :branch, :year, :section, :filePath)`,
    {
      uploadedBy: req.user.id,
      title,
      type: type || typeMap[category] || category,
      branch,
      year: String(year),
      section,
      filePath: req.file ? `/uploads/${req.file.filename}` : null
    }
  );

  const docType = type || typeMap[category] || category;
  await notifyClass({
    req,
    branch,
    year: String(year),
    section,
    title: docType === "important_questions" ? "Important questions uploaded" : docType === "notice" ? "New notice uploaded" : "New notes uploaded",
    message: `${title} is available for your class.`,
    type: docType,
    linkPath: docType === "important_questions" ? "/dashboard/study-materials?tab=important_questions" : docType === "notice" ? "/dashboard/study-materials?tab=notices" : "/dashboard/study-materials?tab=notes",
    metadata: { branch, year: String(year), section, documentType: docType }
  });

  res.status(201).json({ message: "Document uploaded" });
}
