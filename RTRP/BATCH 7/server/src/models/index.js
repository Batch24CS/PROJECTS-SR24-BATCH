const mongoose = require("mongoose");

const baseOptions = { timestamps: true };

const studentSchema = new mongoose.Schema(
  {
    userId: String,
    rollNo: { type: String, index: true },
    name: String,
    email: { type: String, index: true },
    department: String,
    year: String,
    phone: String,
    guardianPhone: String,
  },
  baseOptions
);

const facultySchema = new mongoose.Schema(
  {
    name: String,
    department: String,
    role: String,
    email: String,
    phone: String,
    office: String,
  },
  baseOptions
);

const attendanceSchema = new mongoose.Schema(
  {
    studentId: String,
    rollNo: String,
    subject: String,
    percentage: Number,
    present: Number,
    total: Number,
    month: String,
  },
  baseOptions
);

const placementSchema = new mongoose.Schema(
  {
    title: String,
    company: String,
    eligibility: String,
    driveDate: String,
    package: String,
    status: { type: String, default: "open" },
    attachmentUrl: String,
  },
  baseOptions
);

const noticeSchema = new mongoose.Schema(
  {
    title: String,
    body: String,
    category: { type: String, default: "general" },
    audience: { type: String, default: "all" },
    attachmentUrl: String,
    published: { type: Boolean, default: true },
  },
  baseOptions
);

const complaintSchema = new mongoose.Schema(
  {
    studentId: String,
    rollNo: String,
    category: { type: String, enum: ["lab", "classroom", "wifi", "transport", "other"], default: "other" },
    title: String,
    description: String,
    location: String,
    status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
    adminNote: String,
  },
  baseOptions
);

const chatbotLogSchema = new mongoose.Schema(
  {
    userId: String,
    question: String,
    intent: String,
    language: { type: String, default: "en" },
    answerPreview: String,
  },
  baseOptions
);

const eventSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    startsAt: String,
    venue: String,
    audience: { type: String, default: "all" },
  },
  baseOptions
);

const pdfSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    originalName: String,
    filePath: String,
    text: String,
    chunks: [{ text: String, keywords: [String] }],
  },
  baseOptions
);

module.exports = {
  Student: mongoose.models.Student || mongoose.model("Student", studentSchema),
  Faculty: mongoose.models.Faculty || mongoose.model("Faculty", facultySchema),
  Attendance: mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema),
  Placement: mongoose.models.Placement || mongoose.model("Placement", placementSchema),
  Notice: mongoose.models.Notice || mongoose.model("Notice", noticeSchema),
  Complaint: mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema),
  ChatbotLog: mongoose.models.ChatbotLog || mongoose.model("ChatbotLog", chatbotLogSchema),
  Event: mongoose.models.Event || mongoose.model("Event", eventSchema),
  PdfDocument: mongoose.models.PdfDocument || mongoose.model("PdfDocument", pdfSchema),
};
