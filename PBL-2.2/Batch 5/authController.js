import crypto from "crypto";
import { query, transaction } from "../config/db.js";
import { comparePassword, hashPassword } from "../utils/passwordUtils.js";
import { signToken } from "../utils/tokenUtils.js";
import { formatUser } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/notifications.js";
import { validateRollNumber } from "../utils/rollNumber.js";

const isDev = process.env.NODE_ENV !== "production";
const requiredSignupFields = ["name", "email", "phone", "password", "confirmPassword", "branch", "year", "section", "admissionType", "rollNumber"];
const requiredFacultyFields = ["name", "email", "facultyId", "phone", "password", "confirmPassword"];
const requiredHodFields = ["name", "email", "mobile", "branch", "password", "confirmPassword"];

function developmentMessage(message, error) {
  if (!isDev || !error) return message;
  return `${message}: ${error.sqlMessage || error.message}`;
}

function isMobileRequest(req) {
  const userAgent = String(req.headers["user-agent"] || "");
  const mobileClientHint = String(req.headers["sec-ch-ua-mobile"] || "").toLowerCase();
  return mobileClientHint === "?1" || /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

function subjectCode(subject) {
  const normalized = String(subject || "").trim().toLowerCase();
  const known = {
    "software engineering": "SE",
    "business economics & financial analysis": "BEFA",
    "business economics and financial analysis": "BEFA",
    "discrete mathematics": "DM",
    "computer networks": "CN",
    "operating systems": "OS",
    "constitution of india": "COI",
    "node js lab": "NODE",
    rtrp: "RTRP",
    "cn lab": "CNL",
    "os lab": "OSL"
  };
  return known[normalized] || String(subject || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "SUB";
}

async function findClassIncharge({ branch, year, section }) {
  const rows = await query(
    `SELECT id FROM users
     WHERE role = 'faculty' AND faculty_type = 'incharge' AND approval_status = 'approved'
       AND branch = :branch AND year = :year AND section = :section
     ORDER BY id LIMIT 1`,
    { branch, year: String(year), section }
  );
  return rows[0]?.id || null;
}

export async function signup(req, res) {
  console.log("Signup payload:", req.body);
  try {
    if (!isMobileRequest(req)) {
      return res.status(403).json({ message: "Student signup is allowed only on mobile devices." });
    }

    const missing = requiredSignupFields.filter((field) => !String(req.body[field] || "").trim());
    if (missing.length) return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const email = String(req.body.email).trim().toLowerCase();
    const validation = validateRollNumber({
      branch: req.body.branch,
      year: req.body.year,
      admissionType: req.body.admissionType,
      rollPrefix: req.body.rollPrefix,
      rollSuffix: req.body.rollSuffix,
      rollNumber: req.body.rollNumber
    });
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    const rollNumber = validation.rollNumber;
    const existingEmail = await query("SELECT id FROM users WHERE email = :email LIMIT 1", { email });
    if (existingEmail.length) return res.status(409).json({ message: "Email already exists" });
    const existingRoll = await query("SELECT id FROM users WHERE roll_number = :rollNumber LIMIT 1", { rollNumber });
    if (existingRoll.length) return res.status(409).json({ message: "Roll number already exists" });

    const password = await hashPassword(req.body.password);
    await transaction(async (connection) => {
      const [insertResult] = await connection.execute(
        `INSERT INTO users
          (name, email, roll_number, phone, password, role, branch, year, section, approval_status, admission_type, roll_prefix, roll_suffix)
         VALUES
          (:name, :email, :rollNumber, :phone, :password, 'student', :branch, :year, :section, 'pending', :admissionType, :rollPrefix, :rollSuffix)`,
        {
          name: req.body.name.trim(),
          email,
          rollNumber,
          phone: req.body.phone.trim(),
          password,
          branch: req.body.branch,
          year: String(req.body.year),
          section: req.body.section,
          admissionType: req.body.admissionType === "lateral" ? "lateral" : "regular",
          rollPrefix: validation.prefix,
          rollSuffix: validation.suffix
        }
      );

      const facultyId = await findClassIncharge({ branch: req.body.branch, year: req.body.year, section: req.body.section });
      await connection.execute(
        `INSERT INTO registration_requests (student_id, faculty_id, branch, year, section, status, message)
         VALUES (:studentId, :facultyId, :branch, :year, :section, 'pending', :message)`,
        {
          studentId: insertResult.insertId,
          facultyId,
          branch: req.body.branch,
          year: String(req.body.year),
          section: req.body.section,
          message: "Student registration is waiting for class incharge approval."
        }
      );
    });

    const inchargeId = await findClassIncharge({ branch: req.body.branch, year: req.body.year, section: req.body.section });
    const facultyRows = inchargeId ? [{ id: inchargeId }] : [];
    await Promise.all(facultyRows.map((faculty) => createNotification({
      req,
      userId: faculty.id,
      title: "New registration request",
      message: `${req.body.name.trim()} (${rollNumber}) is waiting for class incharge approval.`,
      type: "registration",
      linkPath: "/dashboard/registration-requests",
      metadata: { rollNumber, branch: req.body.branch, year: String(req.body.year), section: req.body.section }
    })));

    res.status(201).json({ message: "Student account created. Waiting for class incharge approval.", rollNumber });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: developmentMessage("Database error", error) });
  }
}

export async function facultySignup(req, res) {
  try {
    const missing = requiredFacultyFields.filter((field) => !String(req.body[field] || "").trim());
    if (missing.length) return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    if (req.body.password !== req.body.confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    const classes = Array.isArray(req.body.classes) && req.body.classes.length
      ? req.body.classes
      : [{ branch: req.body.branch, year: req.body.year, section: req.body.section, subject: req.body.subject }];
    const invalidClass = classes.find((item) => !item.branch || !item.year || !item.section || !item.subject);
    if (invalidClass) return res.status(400).json({ message: "Each class row needs branch, year, section and subject" });
    const classKeys = classes.map((item) => `${item.branch}|${String(item.year)}|${item.section}|${subjectCode(item.subject)}`);
    if (new Set(classKeys).size !== classKeys.length) return res.status(400).json({ message: "Duplicate class rows are not allowed" });

    const email = String(req.body.email).trim().toLowerCase();
    const facultyId = String(req.body.facultyId).trim().toUpperCase();
    const phone = String(req.body.phone).trim();
    const facultyType = req.body.facultyType === "incharge" ? "incharge" : "normal";
    const inchargeClass = req.body.inchargeClass || {};
    if (facultyType === "incharge" && (!inchargeClass.branch || !inchargeClass.year || !inchargeClass.section)) {
      return res.status(400).json({ message: "Class incharge branch, year and section are required" });
    }
    const profileClass = facultyType === "incharge" ? inchargeClass : classes[0];
    const existing = await query("SELECT id FROM users WHERE email = :email OR faculty_id = :facultyId OR phone = :phone OR mobile = :phone LIMIT 1", { email, facultyId, phone });
    if (existing.length) return res.status(409).json({ message: "Email, mobile or faculty ID already exists" });
    const hod = (await query("SELECT id FROM users WHERE role = 'hod' AND branch = :branch AND approval_status = 'approved' LIMIT 1", { branch: profileClass.branch }))[0];
    if (!hod) return res.status(400).json({ message: "No approved HOD exists for this branch. Contact Admin." });

    for (const item of classes) {
      const code = subjectCode(item.subject);
      const existingSubject = (await query(
        "SELECT * FROM subjects WHERE branch = :branch AND year = :year AND section = :section AND code = :code LIMIT 1",
        { branch: item.branch, year: String(item.year), section: item.section, code }
      ))[0];
      if (existingSubject) {
        const assigned = await query(
        "SELECT id FROM classes WHERE branch = :branch AND year = :year AND section = :section AND subject_id = :subjectId AND status = 'active' LIMIT 1",
          { branch: item.branch, year: String(item.year), section: item.section, subjectId: existingSubject.id }
        );
        if (assigned.length) return res.status(409).json({ message: "This subject is already assigned to another faculty for this class." });
      }
    }

    const password = await hashPassword(req.body.password);
    await transaction(async (connection) => {
      const [facultyResult] = await connection.execute(
        `INSERT INTO users (name, email, faculty_id, phone, mobile, password, role, branch, year, section, faculty_type, approval_status)
         VALUES (:name, :email, :facultyId, :phone, :phone, :password, 'faculty', :branch, :year, :section, :facultyType, 'pending')`,
        {
          name: req.body.name.trim(),
          email,
          facultyId,
          phone,
          password,
          facultyType,
          branch: profileClass.branch,
          year: String(profileClass.year),
          section: profileClass.section
        }
      );
      for (const item of classes) {
        const code = subjectCode(item.subject);
        const [subjectRows] = await connection.execute(
          "SELECT * FROM subjects WHERE branch = :branch AND year = :year AND section = :section AND code = :code LIMIT 1",
          { branch: item.branch, year: String(item.year), section: item.section, code }
        );
        let subjectId = subjectRows[0]?.id;
        if (!subjectId) {
          const [subjectResult] = await connection.execute(
            `INSERT INTO subjects (name, code, branch, year, section, faculty_id)
             VALUES (:subject, :code, :branch, :year, :section, :facultyId)`,
            { subject: item.subject.trim(), code, branch: item.branch, year: String(item.year), section: item.section, facultyId: facultyResult.insertId }
          );
          subjectId = subjectResult.insertId;
        }
        await connection.execute(
          `INSERT INTO classes (faculty_id, branch, year, section, subject_id, status)
           VALUES (:facultyId, :branch, :year, :section, :subjectId, 'active')`,
          { facultyId: facultyResult.insertId, branch: item.branch, year: String(item.year), section: item.section, subjectId }
        );
      }
      const [hodRows] = await connection.execute(
        "SELECT id FROM users WHERE role = 'hod' AND branch = :branch AND approval_status = 'approved' LIMIT 1",
        { branch: profileClass.branch }
      );
      const hodId = hodRows[0]?.id || null;
      await connection.execute(
        `INSERT INTO faculty_requests (faculty_id, hod_id, branch, status, message)
         VALUES (:facultyId, :hodId, :branch, 'pending', 'New faculty registration request.')`,
        { facultyId: facultyResult.insertId, hodId, branch: profileClass.branch }
      );
    });

    const hods = await query("SELECT id FROM users WHERE role = 'hod' AND branch = :branch AND approval_status = 'approved'", { branch: profileClass.branch });
    await Promise.all(hods.map((hod) => createNotification({
      req,
      userId: hod.id,
      title: "New faculty registration request",
      message: `${req.body.name.trim()} is waiting for HOD approval.`,
      type: "faculty_request",
      linkPath: "/dashboard/faculty-requests",
      metadata: { branch: profileClass.branch, facultyId }
    })));

    res.status(201).json({ message: "Faculty account created. Waiting for HOD approval." });
  } catch (error) {
    console.error("Faculty signup error:", error);
    res.status(500).json({ message: developmentMessage("Faculty signup failed", error) });
  }
}

export async function hodSignup(req, res) {
  try {
    const missing = requiredHodFields.filter((field) => !String(req.body[field] || "").trim());
    if (missing.length) return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    if (req.body.password !== req.body.confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const email = String(req.body.email).trim().toLowerCase();
    const mobile = String(req.body.mobile).trim();
    const branch = String(req.body.branch).trim();
    const existingHod = await query("SELECT id FROM users WHERE role = 'hod' AND branch = :branch AND approval_status IN ('pending','approved') LIMIT 1", { branch });
    if (existingHod.length) return res.status(409).json({ message: "HOD already exists for this branch." });
    const existing = await query("SELECT id FROM users WHERE email = :email OR phone = :mobile OR mobile = :mobile LIMIT 1", { email, mobile });
    if (existing.length) return res.status(409).json({ message: "Email or mobile already exists" });

    const password = await hashPassword(req.body.password);
    const result = await query(
      `INSERT INTO users (name, email, phone, mobile, password, role, branch, approval_status)
       VALUES (:name, :email, :mobile, :mobile, :password, 'hod', :branch, 'pending')`,
      { name: req.body.name.trim(), email, mobile, password, branch }
    );
    await query(
      `INSERT INTO hod_requests (hod_id, branch, status, message)
       VALUES (:hodId, :branch, 'pending', 'New HOD registration request.')`,
      { hodId: result.insertId, branch }
    );
    const admins = await query("SELECT id FROM users WHERE role = 'admin' AND approval_status = 'approved'");
    await Promise.all(admins.map((admin) => createNotification({
      req,
      userId: admin.id,
      title: "New HOD request",
      message: `${req.body.name.trim()} requested HOD approval for ${branch}.`,
      type: "hod_request",
      linkPath: "/dashboard/hod-requests",
      metadata: { hodId: result.insertId, branch }
    })));
    res.status(201).json({ message: "Your HOD account is waiting for Admin approval." });
  } catch (error) {
    console.error("HOD signup error:", error);
    res.status(500).json({ message: developmentMessage("HOD signup failed", error) });
  }
}

export async function login(req, res) {
  try {
    const { role, password } = req.body;
    let rows = [];

    if (role === "student") {
      if (!isMobileRequest(req)) return res.status(403).json({ message: "Student login is allowed only on mobile devices." });
      const rollNumber = String(req.body.rollNumber || req.body.identifier || "").trim().toUpperCase();
      rows = await query("SELECT * FROM users WHERE roll_number = :rollNumber AND role = 'student' LIMIT 1", { rollNumber });
    } else if (role === "faculty") {
      const identifier = String(req.body.identifier || "").trim();
      rows = await query(
        "SELECT * FROM users WHERE role = 'faculty' AND (faculty_id = :facultyId OR email = :email) LIMIT 1",
        { facultyId: identifier.toUpperCase(), email: identifier.toLowerCase() }
      );
    } else if (role === "hod") {
      const identifier = String(req.body.identifier || "").trim();
      rows = await query(
        "SELECT * FROM users WHERE role = 'hod' AND (email = :email OR mobile = :mobile OR phone = :mobile) LIMIT 1",
        { email: identifier.toLowerCase(), mobile: identifier }
      );
    } else if (role === "admin") {
      const email = String(req.body.email || req.body.identifier || "").trim().toLowerCase();
      rows = await query("SELECT * FROM users WHERE role = 'admin' AND email = :email LIMIT 1", { email });
    } else {
      return res.status(400).json({ message: "Invalid login role" });
    }

    const user = rows[0];
    if (!user || !(await comparePassword(password || "", user.password))) {
      return res.status(401).json({ message: role === "student" ? "Invalid roll number or password" : role === "hod" ? "Invalid HOD credentials" : role === "admin" ? "Invalid admin credentials" : "Invalid faculty credentials" });
    }

    const formatted = formatUser(user);
    res.json({ token: signToken(formatted), user: formatted });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: developmentMessage("Login failed", error) });
  }
}

export async function forgotPassword(req, res) {
  try {
    const identifier = String(req.body.identifier || "").trim();
    if (!identifier) return res.status(400).json({ message: "Email or roll number is required" });

    const rows = await query(
      "SELECT * FROM users WHERE email = :email OR roll_number = :rollNumber OR faculty_id = :facultyId OR mobile = :mobile OR phone = :mobile LIMIT 1",
      { email: identifier.toLowerCase(), rollNumber: identifier.toUpperCase(), facultyId: identifier.toUpperCase(), mobile: identifier }
    );
    const user = rows[0];
    const neutralMessage = "If the account exists, reset link has been sent to registered email.";
    if (!user || !user.email) return res.json({ message: neutralMessage });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await query(
      "INSERT INTO password_resets (user_id, reset_token, expires_at, used) VALUES (:userId, :resetToken, :expiresAt, 0)",
      { userId: user.id, resetToken, expiresAt }
    );

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5000"}/reset-password/${resetToken}`;
    let mailed = false;
    if (process.env.MAIL_HOST && process.env.MAIL_USER) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT || 587),
          secure: Number(process.env.MAIL_PORT || 587) === 465,
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.MAIL_USER,
          to: user.email,
          subject: "Sphoorthy Engineering College password reset",
          text: `Reset your password using this link: ${resetLink}`
        });
        mailed = true;
      } catch (mailError) {
        console.error("Password reset email failed:", mailError.message);
      }
    }
    if (process.env.NODE_ENV !== "production") console.log(`Sphoorthy Engineering College password reset link: ${resetLink}`);
    res.json({ message: neutralMessage, emailed: mailed, resetLink: process.env.NODE_ENV !== "production" ? resetLink : undefined });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: developmentMessage("Unable to create reset link", error) });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) return res.status(400).json({ message: "New password and confirm password are required" });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const rows = await query(
      "SELECT * FROM password_resets WHERE reset_token = :token AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      { token }
    );
    const reset = rows[0];
    if (!reset) return res.status(400).json({ message: "Invalid or expired reset token" });

    await transaction(async (connection) => {
      const hashed = await hashPassword(password);
      await connection.execute("UPDATE users SET password = :password WHERE id = :userId", { password: hashed, userId: reset.user_id });
      await connection.execute("UPDATE password_resets SET used = 1 WHERE id = :id", { id: reset.id });
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: developmentMessage("Password reset failed", error) });
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
