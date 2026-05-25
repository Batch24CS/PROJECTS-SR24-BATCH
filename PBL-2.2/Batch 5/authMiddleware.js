import { query } from "../config/db.js";
import { verifyToken } from "../utils/tokenUtils.js";

export function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    branch: row.branch,
    year: row.year,
    section: row.section,
    phone: row.phone,
    mobile: row.mobile || row.phone,
    rollNumber: row.roll_number,
    approvalStatus: row.approval_status,
    facultyType: row.faculty_type,
    admissionType: row.admission_type,
    rollPrefix: row.roll_prefix,
    rollSuffix: row.roll_suffix,
    facultyId: row.faculty_id,
    createdAt: row.created_at
  };
}

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = verifyToken(token);
    const rows = await query("SELECT * FROM users WHERE id = :id LIMIT 1", { id: decoded.id });
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = formatUser(user);
    req.userRow = user;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (req.user.role === "admin") return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
