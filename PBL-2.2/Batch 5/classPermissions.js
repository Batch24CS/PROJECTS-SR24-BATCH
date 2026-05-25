import { query } from "../config/db.js";

export async function facultyOwnsClass({ facultyId, branch, year, section, subjectId = null, requireActive = true }) {
  const params = { facultyId, branch, year: String(year), section, subjectId };
  let sql = `SELECT c.*, s.name AS subject_name
             FROM classes c
             LEFT JOIN subjects s ON s.id = c.subject_id
             WHERE c.faculty_id = :facultyId
               AND c.branch = :branch AND c.year = :year AND c.section = :section`;
  if (subjectId) sql += " AND c.subject_id = :subjectId";
  if (requireActive) sql += " AND c.status = 'active'";
  sql += " LIMIT 1";
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function facultyCanReachStudent({ facultyId, studentId, requireActive = true }) {
  const statusClause = requireActive ? "AND c.status = 'active'" : "";
  const rows = await query(
    `SELECT c.*, u.id AS student_id
     FROM users u
     JOIN classes c ON c.branch = u.branch AND c.year = u.year AND c.section = u.section
     WHERE c.faculty_id = :facultyId AND u.id = :studentId ${statusClause}
     LIMIT 1`,
    { facultyId, studentId }
  );
  return rows[0] || null;
}

export async function canFacultyAccessStudent(facultyId, studentId) {
  return Boolean(await facultyCanReachStudent({ facultyId, studentId }));
}
