const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const { connectMongo } = require("./config/mongo");
require("./models");
const { readDb, writeDb } = require("./lib/store");
const { buildChatResponse } = require("./lib/chatReplies");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "sphoorthy-dev-secret";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@sphoorthy.edu").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
const uploadDir = path.join(__dirname, "..", "uploads");

connectMongo();

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF uploads are supported"));
  },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role || "student" }, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role || "student",
    rollNo: user.rollNo,
    department: user.department,
    year: user.year,
    created_at: user.created_at
  };
}

function ensureAdminUser(db) {
  if (db.users.some((user) => user.email?.toLowerCase() === ADMIN_EMAIL)) return;
  db.users.push({
    id: "admin",
    name: "College Admin",
    email: ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    phone: "",
    role: "admin",
    created_at: new Date().toISOString(),
  });
}

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = readDb();
    const user = db.users.find((entry) => entry.id === payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = user;
    req.user.role = user.role || "student";
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

function getStudentSnapshot(user) {
  const db = readDb();
  const student =
    db.students.find((entry) => entry.userId === user.id || entry.email === user.email) || {
      userId: user.id,
      name: user.name,
      email: user.email,
      rollNo: user.rollNo || "SEC24CSE001",
      department: user.department || "Computer Science and Engineering",
      year: user.year || "2nd Year",
    };

  const rollNo = student.rollNo;
  return {
    profile: student,
    attendance: db.attendance.filter((entry) => entry.rollNo === rollNo || entry.studentId === user.id),
    marks: db.marks.filter((entry) => entry.rollNo === rollNo || entry.studentId === user.id),
    results: db.results.filter((entry) => entry.rollNo === rollNo || entry.studentId === user.id),
    fees: db.fees.filter((entry) => entry.rollNo === rollNo || entry.studentId === user.id),
    notifications: db.notifications.slice(-8).reverse(),
    timetable: db.timetables.filter((entry) => !entry.department || entry.department === student.department),
    complaints: db.complaints.filter((entry) => entry.studentId === user.id || entry.rollNo === rollNo).reverse(),
  };
}

function seedStudentPortalData(db, user) {
  const rollNo = user.rollNo || "SEC24CSE001";
  if (!db.students.some((entry) => entry.userId === user.id || entry.email === user.email)) {
    db.students.push({
      id: crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      email: user.email,
      rollNo,
      department: user.department || "Computer Science and Engineering",
      year: user.year || "2nd Year",
      phone: user.phone || "",
      created_at: new Date().toISOString(),
    });
  }
  if (!db.attendance.some((entry) => entry.rollNo === rollNo)) {
    db.attendance.push(
      { id: crypto.randomUUID(), rollNo, subject: "Data Structures", percentage: 86, present: 43, total: 50, month: "Current Semester" },
      { id: crypto.randomUUID(), rollNo, subject: "DBMS", percentage: 91, present: 46, total: 50, month: "Current Semester" },
      { id: crypto.randomUUID(), rollNo, subject: "Operating Systems", percentage: 78, present: 39, total: 50, month: "Current Semester" }
    );
  }
  if (!db.marks.some((entry) => entry.rollNo === rollNo)) {
    db.marks.push(
      { id: crypto.randomUUID(), rollNo, subject: "Data Structures", internal1: 24, internal2: 27, max: 30 },
      { id: crypto.randomUUID(), rollNo, subject: "DBMS", internal1: 26, internal2: 28, max: 30 }
    );
  }
  if (!db.results.some((entry) => entry.rollNo === rollNo)) {
    db.results.push({ id: crypto.randomUUID(), rollNo, semester: "III Semester", sgpa: 8.4, status: "Pass" });
  }
  if (!db.fees.some((entry) => entry.rollNo === rollNo)) {
    db.fees.push({ id: crypto.randomUUID(), rollNo, type: "Tuition Fee", amount: 75000, paid: 50000, status: "Partially Paid", dueDate: "2026-06-15" });
  }
  if (!db.timetables.length) {
    db.timetables.push(
      { id: crypto.randomUUID(), day: "Monday", department: "Computer Science and Engineering", periods: ["DBMS", "Data Structures Lab", "Aptitude", "Library"] },
      { id: crypto.randomUUID(), day: "Tuesday", department: "Computer Science and Engineering", periods: ["Operating Systems", "Maths", "Mini Project", "Sports"] }
    );
  }
  if (!db.notifications.length) {
    db.notifications.push(
      { id: crypto.randomUUID(), title: "Internal exams", body: "Internal assessment schedule will be published by the exam cell.", type: "exam", created_at: new Date().toISOString() },
      { id: crypto.randomUUID(), title: "Placement prep", body: "Aptitude and resume clinic sessions are available this week.", type: "placement", created_at: new Date().toISOString() }
    );
  }
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Sphoorthy API is running" });
});

app.post(
  "/api/auth/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  validate,
  async (req, res) => {
  const { name, email, password, phone, rollNo, department, year } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
  }

  const db = readDb();
  ensureAdminUser(db);
  const normalizedEmail = String(email).trim().toLowerCase();

  if (db.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? String(phone).trim() : undefined,
    rollNo: rollNo ? String(rollNo).trim().toUpperCase() : undefined,
    department: department ? String(department).trim() : undefined,
    year: year ? String(year).trim() : undefined,
    role: "student",
    created_at: new Date().toISOString()
  };

  db.users.push(user);
  seedStudentPortalData(db, user);
  writeDb(db);

  const token = signToken(user);
  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
});

app.post("/api/auth/login", [body("email").isEmail().withMessage("Valid email is required")], validate, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const db = readDb();
  ensureAdminUser(db);
  writeDb(db);
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(String(password), user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  seedStudentPortalData(db, user);
  writeDb(db);

  const token = signToken(user);
  res.json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: sanitizeUser(req.user)
    }
  });
});

app.get("/api/student/dashboard", authMiddleware, (req, res) => {
  const db = readDb();
  seedStudentPortalData(db, req.user);
  writeDb(db);
  res.json({ success: true, data: getStudentSnapshot(req.user) });
});

app.post(
  "/api/student/complaints",
  authMiddleware,
  [
    body("category").isIn(["lab", "classroom", "wifi", "transport", "other"]).withMessage("Select a valid complaint category"),
    body("title").trim().isLength({ min: 3 }).withMessage("Complaint title is required"),
    body("description").trim().isLength({ min: 10 }).withMessage("Please add more details"),
  ],
  validate,
  (req, res) => {
    const db = readDb();
    const snapshot = getStudentSnapshot(req.user);
    const complaint = {
      id: crypto.randomUUID(),
      studentId: req.user.id,
      rollNo: snapshot.profile.rollNo,
      category: req.body.category,
      title: String(req.body.title).trim(),
      description: String(req.body.description).trim(),
      location: req.body.location ? String(req.body.location).trim() : "",
      status: "open",
      created_at: new Date().toISOString(),
    };
    db.complaints.push(complaint);
    db.notifications.push({
      id: crypto.randomUUID(),
      title: "Complaint submitted",
      body: `${complaint.title} has been sent to the admin team.`,
      type: "complaint",
      created_at: new Date().toISOString(),
    });
    writeDb(db);
    res.status(201).json({ success: true, data: { complaint } });
  }
);

app.get("/api/public/portal-feed", (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: {
      notices: db.notices.filter((entry) => entry.published !== false).slice(-6).reverse(),
      placements: db.placements.slice(-6).reverse(),
      events: db.events.slice(-6).reverse(),
    },
  });
});

app.post("/api/chat/message", authMiddleware, async (req, res) => {
  const { message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  const question = String(message).trim();
  const response = await buildChatResponse(question, { userId: req.user.id });
  const db = readDb();
  if (!Array.isArray(db.chatLogs)) {
    db.chatLogs = [];
  }
  if (!db.chatContexts || typeof db.chatContexts !== "object") {
    db.chatContexts = {};
  }
  db.chatLogs.push({
    id: crypto.randomUUID(),
    userId: req.user.id,
    question,
    intent: response.intent,
    department: response.context?.department || undefined,
    year: response.context?.year?.label || undefined,
    created_at: new Date().toISOString()
  });
  db.chatContexts[req.user.id] = response.context || {};
  writeDb(db);

  await new Promise((resolve) => setTimeout(resolve, 500));

  res.json({
    success: true,
    data: {
      message: response.message,
      response
    }
  });
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ reply: "Message is required" });
  }

  const response = await buildChatResponse(String(message).trim(), { userId: req.body?.userId });
  res.json({ reply: response.message, response });
});

app.get("/api/admin/summary", authMiddleware, adminMiddleware, (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: {
      counts: {
        students: db.students.length,
        notices: db.notices.length,
        placements: db.placements.length,
        complaints: db.complaints.length,
        chatbotLogs: db.chatLogs.length,
        pdfs: db.pdfs.length,
      },
      complaints: db.complaints.slice(-8).reverse(),
      chatLogs: db.chatLogs.slice(-8).reverse(),
    },
  });
});

app.post(
  "/api/admin/notices",
  authMiddleware,
  adminMiddleware,
  [body("title").trim().isLength({ min: 3 }).withMessage("Notice title is required"), body("body").trim().isLength({ min: 5 }).withMessage("Notice body is required")],
  validate,
  (req, res) => {
    const db = readDb();
    const notice = {
      id: crypto.randomUUID(),
      title: String(req.body.title).trim(),
      body: String(req.body.body).trim(),
      category: req.body.category || "general",
      audience: req.body.audience || "all",
      published: req.body.published !== false,
      created_at: new Date().toISOString(),
    };
    db.notices.push(notice);
    db.notifications.push({ id: crypto.randomUUID(), title: notice.title, body: notice.body, type: "notice", created_at: notice.created_at });
    writeDb(db);
    res.status(201).json({ success: true, data: { notice } });
  }
);

app.post(
  "/api/admin/placements",
  authMiddleware,
  adminMiddleware,
  [body("title").trim().isLength({ min: 3 }).withMessage("Placement title is required")],
  validate,
  (req, res) => {
    const db = readDb();
    const placement = {
      id: crypto.randomUUID(),
      title: String(req.body.title).trim(),
      company: req.body.company || "",
      eligibility: req.body.eligibility || "",
      driveDate: req.body.driveDate || "",
      package: req.body.package || "",
      status: req.body.status || "open",
      created_at: new Date().toISOString(),
    };
    db.placements.push(placement);
    writeDb(db);
    res.status(201).json({ success: true, data: { placement } });
  }
);

app.post(
  "/api/admin/faqs",
  authMiddleware,
  adminMiddleware,
  [body("question").trim().isLength({ min: 3 }).withMessage("FAQ question is required"), body("answer").trim().isLength({ min: 5 }).withMessage("FAQ answer is required")],
  validate,
  (req, res) => {
    const db = readDb();
    const faq = {
      id: crypto.randomUUID(),
      question: String(req.body.question).trim(),
      answer: String(req.body.answer).trim(),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      created_at: new Date().toISOString(),
    };
    db.chatbotFaqs.push(faq);
    writeDb(db);
    res.status(201).json({ success: true, data: { faq } });
  }
);

app.patch("/api/admin/complaints/:id", authMiddleware, adminMiddleware, (req, res) => {
  const db = readDb();
  const complaint = db.complaints.find((entry) => entry.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  complaint.status = req.body.status || complaint.status;
  complaint.adminNote = req.body.adminNote || complaint.adminNote;
  complaint.updated_at = new Date().toISOString();
  writeDb(db);
  res.json({ success: true, data: { complaint } });
});

app.post("/api/admin/pdfs", authMiddleware, adminMiddleware, upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "PDF file is required" });
  }
  const buffer = fs.readFileSync(req.file.path);
  const parsed = await pdfParse(buffer);
  const text = parsed.text || "";
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let index = 0; index < words.length; index += 120) {
    const slice = words.slice(index, index + 120);
    chunks.push({ text: slice.join(" "), keywords: Array.from(new Set(slice)).slice(0, 30) });
  }
  const db = readDb();
  const pdf = {
    id: crypto.randomUUID(),
    title: req.body.title || req.file.originalname,
    category: req.body.category || "knowledge-base",
    originalName: req.file.originalname,
    filePath: req.file.path,
    text,
    chunks,
    created_at: new Date().toISOString(),
  };
  db.pdfs.push(pdf);
  writeDb(db);
  res.status(201).json({ success: true, data: { pdf: { ...pdf, text: undefined, chunks: chunks.length } } });
});

app.post("/api/vapi/call", authMiddleware, (req, res) => {
  const { phoneNumber, preferredCourse } = req.body;

  if (!phoneNumber || !preferredCourse) {
    return res.status(400).json({ success: false, message: "Phone number and preferred course are required" });
  }

  const db = readDb();
  db.callRequests.push({
    id: crypto.randomUUID(),
    userId: req.user.id,
    name: req.user.name,
    email: req.user.email,
    phoneNumber: String(phoneNumber).trim(),
    preferredCourse: String(preferredCourse).trim(),
    created_at: new Date().toISOString(),
    status: "queued"
  });
  writeDb(db);

  res.json({
    success: true,
    message: "Call request submitted successfully",
    data: {
      phoneNumber: String(phoneNumber).trim(),
      preferredCourse: String(preferredCourse).trim()
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Sphoorthy API running at http://localhost:${PORT}`);
});
