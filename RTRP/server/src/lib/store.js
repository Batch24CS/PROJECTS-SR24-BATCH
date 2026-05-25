const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "data", "db.json");

const defaultDb = {
  users: [],
  students: [],
  faculty: [],
  attendance: [],
  marks: [],
  results: [],
  fees: [],
  notifications: [],
  timetables: [],
  notices: [],
  placements: [],
  complaints: [],
  events: [],
  pdfs: [],
  chatbotFaqs: [],
  callRequests: [],
  academicCalendar: {
    firstYear: {
      midExams: "04 Nov 2024 - 09 Nov 2024",
      semesterExams: "25 Jan 2025 - 03 Feb 2025",
    },
    secondYear: {},
    thirdYear: {},
    fourthYear: {},
  },
  chatLogs: [],
  chatContexts: {},
  knowledgeBase: {
    chatSettings: {
      defaultSuggestions: [
        "Show CSE department details",
        "Who is the HOD of AIML?",
        "2nd year exam dates",
        "How do admissions work?",
        "Tell me about placements",
        "Submit a WiFi complaint",
        "Scholarship information",
      ],
    },
    scholarships: {
      note: "Scholarship or tuition reimbursement details are not clearly published in the currently loaded official data.",
    },
    timetables: {
      default: {
        note: "A public timetable was not found in the official data currently loaded for this project.",
      },
    },
    quickActions: [],
    facultyDirectory: {},
    departmentNotes: {},
  },
};

function ensureDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

function mergeDefaults(data) {
  const input = data || {};
  return {
    ...defaultDb,
    ...input,
    academicCalendar: {
      ...defaultDb.academicCalendar,
      ...(input.academicCalendar || {}),
    },
    chatLogs: Array.isArray(input.chatLogs) ? input.chatLogs : defaultDb.chatLogs,
    callRequests: Array.isArray(input.callRequests) ? input.callRequests : defaultDb.callRequests,
    users: Array.isArray(input.users) ? input.users : defaultDb.users,
    students: Array.isArray(input.students) ? input.students : defaultDb.students,
    faculty: Array.isArray(input.faculty) ? input.faculty : defaultDb.faculty,
    attendance: Array.isArray(input.attendance) ? input.attendance : defaultDb.attendance,
    marks: Array.isArray(input.marks) ? input.marks : defaultDb.marks,
    results: Array.isArray(input.results) ? input.results : defaultDb.results,
    fees: Array.isArray(input.fees) ? input.fees : defaultDb.fees,
    notifications: Array.isArray(input.notifications) ? input.notifications : defaultDb.notifications,
    timetables: Array.isArray(input.timetables) ? input.timetables : defaultDb.timetables,
    notices: Array.isArray(input.notices) ? input.notices : defaultDb.notices,
    placements: Array.isArray(input.placements) ? input.placements : defaultDb.placements,
    complaints: Array.isArray(input.complaints) ? input.complaints : defaultDb.complaints,
    events: Array.isArray(input.events) ? input.events : defaultDb.events,
    pdfs: Array.isArray(input.pdfs) ? input.pdfs : defaultDb.pdfs,
    chatbotFaqs: Array.isArray(input.chatbotFaqs) ? input.chatbotFaqs : defaultDb.chatbotFaqs,
    chatContexts: input.chatContexts && typeof input.chatContexts === "object" ? input.chatContexts : {},
    knowledgeBase: {
      ...defaultDb.knowledgeBase,
      ...(input.knowledgeBase || {}),
      chatSettings: {
        ...defaultDb.knowledgeBase.chatSettings,
        ...(input.knowledgeBase?.chatSettings || {}),
      },
      scholarships: {
        ...defaultDb.knowledgeBase.scholarships,
        ...(input.knowledgeBase?.scholarships || {}),
      },
      timetables: {
        ...defaultDb.knowledgeBase.timetables,
        ...(input.knowledgeBase?.timetables || {}),
      },
      facultyDirectory:
        input.knowledgeBase?.facultyDirectory && typeof input.knowledgeBase.facultyDirectory === "object"
          ? input.knowledgeBase.facultyDirectory
          : defaultDb.knowledgeBase.facultyDirectory,
      departmentNotes:
        input.knowledgeBase?.departmentNotes && typeof input.knowledgeBase.departmentNotes === "object"
          ? input.knowledgeBase.departmentNotes
          : defaultDb.knowledgeBase.departmentNotes,
      quickActions: Array.isArray(input.knowledgeBase?.quickActions)
        ? input.knowledgeBase.quickActions
        : defaultDb.knowledgeBase.quickActions,
    },
  };
}

function readDb() {
  ensureDb();
  const contents = fs.readFileSync(dbPath, "utf8");
  return mergeDefaults(JSON.parse(contents));
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(mergeDefaults(data), null, 2), "utf8");
}

module.exports = { readDb, writeDb };
