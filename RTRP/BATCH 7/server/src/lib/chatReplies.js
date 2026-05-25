const { collegeData } = require("./collegeData");
const { readDb } = require("./store");

const INTENT_RULES = [
  {
    intent: "department_query",
    keywords: ["department", "departments", "branch", "branches", "cse", "aiml", "cyber", "data science", "ece", "mba"],
  },
  {
    intent: "faculty_query",
    keywords: ["faculty", "staff", "hod", "head of department", "principal", "director", "teacher", "professor", "lecturer"],
  },
  {
    intent: "academic_calendar",
    keywords: ["calendar", "academic calendar", "holiday", "holidays", "vacation", "induction", "mid exam", "end semester"],
  },
  {
    intent: "exam_query",
    keywords: ["exam", "exams", "eaxm", "schedule", "semester", "dates", "result", "hall ticket"],
  },
  {
    intent: "timetable_query",
    keywords: ["timetable", "time table", "class schedule", "periods", "daily schedule"],
  },
  {
    intent: "courses_query",
    keywords: ["course", "courses", "programme", "program", "programmes", "syllabus", "curriculum", "regulation", "credits"],
  },
  {
    intent: "admissions_query",
    keywords: ["admission", "admissions", "apply", "application", "eligibility", "eapcet", "counselling", "management quota", "b category"],
  },
  {
    intent: "fees_query",
    keywords: ["fee", "fees", "tuition", "cost", "payment", "scholarship", "reimbursement", "scholarships"],
  },
  {
    intent: "placements_query",
    keywords: ["placement", "placements", "recruiter", "recruiters", "job", "jobs", "offers", "training", "internship"],
  },
  {
    intent: "hostel_query",
    keywords: ["hostel", "campus", "library", "canteen", "cafeteria", "club", "clubs", "sports", "lab", "idea lab", "transport", "bus", "bus route", "facilities", "navigation", "where is"],
  },
  {
    intent: "complaint_query",
    keywords: ["complaint", "complain", "issue", "problem", "wifi problem", "lab issue", "classroom complaint", "transport complaint"],
  },
  {
    intent: "event_query",
    keywords: ["event", "events", "fest", "workshop", "seminar", "notification", "announcement"],
  },
  {
    intent: "contact_query",
    keywords: ["contact", "phone", "email", "address", "location", "map", "directions", "route", "whatsapp", "call", "office"],
  },
  {
    intent: "portal_query",
    keywords: ["login", "student login", "portal", "results portal", "results", "autonomous"],
  },
  {
    intent: "general_query",
    keywords: ["college", "about", "overview", "sphoorthy", "naac", "autonomous", "general"],
  },
];

const YEAR_MATCHERS = [
  { regex: /\b(1st year|first year|1 year|1st years|first years)\b/, key: "firstYear", label: "1st Year" },
  { regex: /\b(2nd year|second year|2 year|2nd years|second years)\b/, key: "secondYear", label: "2nd Year" },
  { regex: /\b(3rd year|third year|3 year|3rd years|third years)\b/, key: "thirdYear", label: "3rd Year" },
  { regex: /\b(4th year|fourth year|4 year|4th years|fourth years|final year)\b/, key: "fourthYear", label: "4th Year" },
];

const UNAVAILABLE_MESSAGE =
  "Sorry, I couldn’t find that information. Please visit the official college website for accurate details.";

const STRICT_INTENT_MAP = {
  academic_calendar: "academic_calendar",
  admissions_query: "admissions",
  courses_query: "departments",
  department_query: "departments",
  faculty_query: "departments",
  exam_query: "exams",
  timetable_query: "exams",
  greeting_query: "general",
  thanks_query: "general",
  placements_query: "placements",
  fees_query: "fees",
  timetable_query: "timetable",
  complaint_query: "complaints",
  event_query: "events",
  hostel_query: "campus",
  contact_query: "contact",
  portal_query: "portal",
  general_query: "general",
  faq_query: "faq",
  pdf_knowledge_query: "knowledge_base",
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "and",
  "any",
  "are",
  "can",
  "college",
  "details",
  "for",
  "from",
  "have",
  "help",
  "how",
  "i",
  "in",
  "info",
  "information",
  "is",
  "me",
  "more",
  "of",
  "on",
  "please",
  "show",
  "tell",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "with",
  "year",
  "years",
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\beaxms?\b/g, "exams")
    .replace(/\bexms?\b/g, "exams")
    .replace(/\btimings?\b/g, "timetable")
    .replace(/\baddmission\b/g, "admission")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));
}

function titleCase(text) {
  return String(text || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getKnowledgeBase() {
  const db = readDb();
  const quickActions = Array.isArray(db.knowledgeBase?.quickActions) && db.knowledgeBase.quickActions.length
    ? db.knowledgeBase.quickActions
    : collegeData.quickActions;

  return {
    db,
    academicCalendar: db.academicCalendar || {},
    quickActions,
    chatSettings: db.knowledgeBase?.chatSettings || {},
    facultyDirectory: db.knowledgeBase?.facultyDirectory || {},
    departmentNotes: db.knowledgeBase?.departmentNotes || {},
    scholarships: db.knowledgeBase?.scholarships || collegeData.admissions.scholarships,
    timetables: db.knowledgeBase?.timetables || {},
    pdfs: Array.isArray(db.pdfs) ? db.pdfs : [],
    chatbotFaqs: Array.isArray(db.chatbotFaqs) ? db.chatbotFaqs : [],
    notices: Array.isArray(db.notices) ? db.notices : [],
    placements: Array.isArray(db.placements) ? db.placements : [],
    events: Array.isArray(db.events) ? db.events : [],
  };
}

function getLastContext(userId) {
  if (!userId) return null;
  const db = readDb();
  return db.chatContexts?.[userId] || null;
}

function isFollowUp(message) {
  return /\b(more|details|detail|continue|same|that|this|what about|and what about|tell more|explain further|next)\b/.test(
    normalize(message)
  );
}

function isGreeting(message) {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|namaste|start|help)\b/.test(normalize(message));
}

function isThanks(message) {
  return /\b(thank you|thanks|thank u|ok thanks|okay thanks|got it)\b/.test(normalize(message));
}

function hasContextOnlyDetails(message, previousContext) {
  const normalizedMessage = normalize(message);
  const hasYear = YEAR_MATCHERS.some((matcher) => matcher.regex.test(normalizedMessage));
  const hasDepartment = Boolean(extractDepartment(message, previousContext));
  return Boolean(previousContext?.lastIntent && (hasYear || hasDepartment) && normalizedMessage.split(" ").length <= 5);
}

function detectIntent(message, previousContext) {
  const normalizedMessage = normalize(message);
  const previousIntent = previousContext?.lastIntent || null;

  if (isThanks(message)) {
    return "thanks_query";
  }

  if (isGreeting(message)) {
    return "greeting_query";
  }

  if (/\b(exam|exams|eaxm|schedule|semester|dates|hall ticket)\b/.test(normalizedMessage)) {
    return "exam_query";
  }

  if (/\b(results portal|student login|portal|result portal|student portal|login)\b/.test(normalizedMessage)) {
    return "portal_query";
  }

  if (/\b(map|directions|route|location|address|phone|email|contact|whatsapp|call)\b/.test(normalizedMessage)) {
    return "contact_query";
  }

  let bestIntent = previousIntent || "general_query";
  let bestScore = 0;

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (normalizedMessage.includes(keyword)) {
        score += keyword.includes(" ") ? 3 : 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = rule.intent;
    }
  }

  if (bestScore === 0 && previousIntent && (isFollowUp(message) || hasContextOnlyDetails(message, previousContext))) {
    return previousIntent;
  }

  return bestIntent || "general_query";
}

function extractYear(message, previousContext) {
  const normalizedMessage = normalize(message);
  for (const matcher of YEAR_MATCHERS) {
    if (matcher.regex.test(normalizedMessage)) {
      return { key: matcher.key, label: matcher.label };
    }
  }

  if (previousContext?.year && isFollowUp(message)) {
    return previousContext.year;
  }

  return null;
}

function findDepartmentByName(name) {
  if (!name) return null;
  return (
    collegeData.academics.departments.find((department) => normalize(department.name) === normalize(name)) || null
  );
}

function extractDepartment(message, previousContext) {
  const normalizedMessage = normalize(message);
  const directMatch = collegeData.academics.departments.find((department) =>
    department.aliases.some((alias) => normalizedMessage.includes(normalize(alias)))
  );

  if (directMatch) {
    return directMatch;
  }

  if (previousContext?.department) {
    const previousDepartment = findDepartmentByName(previousContext.department);
    if (
      previousDepartment &&
      (isFollowUp(message) || /\b(faculty|staff|hod|head|fees|placements|admission|courses|syllabus|calendar)\b/.test(normalizedMessage))
    ) {
      return previousDepartment;
    }
  }

  return null;
}

function extractFaculty(message, department) {
  const normalizedMessage = normalize(message);
  const directFaculty = collegeData.faculty.find(
    (entry) =>
      entry.aliases.some((alias) => normalizedMessage.includes(normalize(alias))) ||
      normalize(entry.name) === normalizedMessage
  );

  if (directFaculty) {
    return directFaculty;
  }

  if (department && /\b(hod|head|faculty|staff)\b/.test(normalizedMessage)) {
    return collegeData.faculty.find((entry) => normalize(entry.department) === normalize(department.name)) || null;
  }

  return null;
}

function getDefaultSuggestions(knowledgeBase) {
  const suggestions = knowledgeBase.chatSettings?.defaultSuggestions;
  return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
}

function getActionMap(knowledgeBase) {
  const actions = Array.isArray(knowledgeBase.quickActions) ? knowledgeBase.quickActions : [];
  return actions.reduce((map, action) => {
    map[action.label] = action;
    return map;
  }, {});
}

function pickActions(knowledgeBase, labels) {
  const actionMap = getActionMap(knowledgeBase);
  return labels.map((label) => actionMap[label]).filter(Boolean);
}

function buildBaseResponse({
  intent,
  title,
  message,
  sections = [],
  links = [],
  source = "Official Sphoorthy Engineering College website",
  suggestions = [],
  actions = [],
  context = {},
}) {
  return {
    intent,
    title,
    message,
    sections,
    links,
    source,
    suggestions,
    actions,
    context,
  };
}

function buildExamResponse(message, previousContext, knowledgeBase) {
  const year = extractYear(message, previousContext);
  if (!year) {
    return buildBaseResponse({
      intent: "exam_query",
      title: "Exam schedule",
      message: "Please mention the year, for example '2nd year exam dates' or '3rd year semester schedule'.",
      links: [{ label: "Academic Calendar PDF", url: collegeData.links.academicCalendarPdf }],
      source: "Official academic calendar PDF",
      suggestions: ["2nd year exam dates", "1st year mid exam dates", "Show academic calendar details"],
      actions: pickActions(knowledgeBase, ["Academic Calendar", "Student Login"]),
      context: { year: null },
    });
  }

  const schedule = knowledgeBase.academicCalendar?.[year.key];
  if (!schedule?.midExams && !schedule?.semesterExams) {
    return buildBaseResponse({
      intent: "exam_query",
      title: `${year.label} exam schedule`,
      message: `Exam schedule for ${year.label.toLowerCase()} is not available right now.`,
      links: [{ label: "Academic Calendar PDF", url: collegeData.links.academicCalendarPdf }],
      source: "Official academic calendar PDF currently loaded in project data",
      suggestions: ["Show academic calendar details", "How do admissions work?", "What courses are offered?"],
      actions: pickActions(knowledgeBase, ["Academic Calendar", "Student Login"]),
      context: { year },
    });
  }

  const scheduleItems = [];
  if (schedule.midExams) {
    scheduleItems.push(`Mid Exams: ${schedule.midExams}`);
  }
  if (schedule.semesterExams) {
    scheduleItems.push(`Semester Exams: ${schedule.semesterExams}`);
  }

  return buildBaseResponse({
    intent: "exam_query",
    title: `${year.label} exam schedule`,
    message: `${year.label} exam schedule is available below.`,
    sections: [{ heading: `${year.label} exam schedule`, items: scheduleItems }],
    links: [{ label: "Academic Calendar PDF", url: collegeData.links.academicCalendarPdf }],
    source: "Official academic calendar PDF",
    suggestions: ["Show academic calendar details", "What about hostel?", "Tell me about placements"],
    actions: pickActions(knowledgeBase, ["Academic Calendar", "Student Login"]),
    context: { year },
  });
}

function buildAcademicCalendarResponse(previousContext, knowledgeBase) {
  const year = previousContext?.year || null;
  const sections = [
    { heading: "Calendar highlights", items: collegeData.academicCalendarHighlights },
  ];

  if (year) {
    const schedule = knowledgeBase.academicCalendar?.[year.key];
    if (!schedule?.midExams && !schedule?.semesterExams) {
      return buildStrictFallbackResponse();
    }

    const yearItems = [];
    if (schedule.midExams) yearItems.push(`Mid Exams: ${schedule.midExams}`);
    if (schedule.semesterExams) yearItems.push(`Semester Exams: ${schedule.semesterExams}`);
    sections.unshift({ heading: `${year.label} key dates`, items: yearItems });
  }

  return buildBaseResponse({
    intent: "academic_calendar",
    title: "Academic calendar",
    message: "These academic calendar details are available from the official calendar currently loaded in the project.",
    sections,
    links: [{ label: "Academic Calendar PDF", url: collegeData.links.academicCalendarPdf }],
    source: "Official academic calendar PDF",
    suggestions: ["2nd year exam dates", "Tell me about admissions", "What courses are offered?"],
    actions: pickActions(knowledgeBase, ["Academic Calendar", "Student Login"]),
    context: year ? { year } : {},
  });
}

function buildDepartmentResponse(message, previousContext, knowledgeBase) {
  const department = extractDepartment(message, previousContext);
  if (!department) {
    return buildBaseResponse({
      intent: "department_query",
      title: "Departments",
      message: "I can help with department details if you mention a branch such as CSE, AIML, Data Science, Cyber Security, ECE, MBA, or Freshman Engineering.",
      sections: [
        {
          heading: "Available department topics",
          items: collegeData.academics.departments.map((entry) => entry.name),
        },
      ],
      links: [{ label: "Courses Offered", url: collegeData.links.coursesOffered }],
      source: "Official courses and department content currently loaded in the project",
      suggestions: ["Tell me about CSE department", "Show AIML details", "Data Science faculty"],
      actions: pickActions(knowledgeBase, ["Departments", "Apply Now"]),
    });
  }

  const profile = collegeData.academics.departmentProfiles[department.name] || {};
  const departmentItems = [department.overview];
  if (department.intake) {
    departmentItems.push(`Intake: ${department.intake}`);
  }
  if (department.since) {
    departmentItems.push(`Started / established reference: ${department.since}`);
  }
  if (department.status) {
    departmentItems.push(`Status: ${department.status}`);
  }
  const sections = [{ heading: "Department details", items: departmentItems }];

  if (Array.isArray(profile.focusAreas) && profile.focusAreas.length) {
    sections.push({ heading: "Focus areas", items: profile.focusAreas });
  }

  const kbNotes = knowledgeBase.departmentNotes?.[department.name];
  if (Array.isArray(kbNotes) && kbNotes.length) {
    sections.push({ heading: "Additional official notes", items: kbNotes });
  } else if (Array.isArray(profile.notes) && profile.notes.length) {
    sections.push({ heading: "Additional official notes", items: profile.notes });
  }

  if (Array.isArray(profile.facultyHeads) && profile.facultyHeads.length) {
    sections.push({ heading: "Department leadership", items: profile.facultyHeads });
  }

  const links = [{ label: "Courses Offered", url: collegeData.links.coursesOffered }];
  if (Array.isArray(profile.links)) {
    for (const url of profile.links) {
      if (!links.some((entry) => entry.url === url)) {
        links.push({ label: titleCase(url.split("/").pop()?.replace(/-/g, " ") || "Official link"), url });
      }
    }
  }

  return buildBaseResponse({
    intent: "department_query",
    title: department.name,
    message: `Here is the official department information currently loaded for ${department.name}.`,
    sections,
    links,
    source: department.source || "Official department page",
    suggestions: [`${department.shortName} faculty`, `${department.shortName} placements`, `${department.shortName} syllabus`],
    actions: pickActions(knowledgeBase, ["Departments", "Apply Now", "WhatsApp"]),
    context: { department: department.name },
  });
}

function buildFacultyResponse(message, previousContext, knowledgeBase) {
  const department = extractDepartment(message, previousContext);
  const faculty = extractFaculty(message, department);

  if (faculty) {
    const details = [faculty.bio];
    if (faculty.department) {
      details.push(`Department: ${faculty.department}`);
    }
    if (faculty.phone) {
      details.push(`Phone: ${faculty.phone}`);
    }
    if (faculty.email) {
      details.push(`Email: ${faculty.email}`);
    }

    return buildBaseResponse({
      intent: "faculty_query",
      title: faculty.name,
      message: `Here is the official faculty information currently loaded for ${faculty.name}.`,
      sections: [{ heading: faculty.role, items: details }],
      links: [{ label: "Academic Council", url: collegeData.links.academicCouncil }],
      source: faculty.source || "Official faculty information",
      suggestions: department ? [`${department.shortName} courses`, `${department.shortName} placements`, "How do admissions work?"] : ["Show CSE faculty", "Who is the principal?", "AIML faculty"],
      actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp"]),
      context: { department: faculty.department || department?.name || null, faculty: faculty.name },
    });
  }

  if (department) {
    const facultyDirectory = knowledgeBase.facultyDirectory?.[department.name];
    const items = Array.isArray(facultyDirectory) && facultyDirectory.length
      ? facultyDirectory
      : collegeData.faculty
          .filter((entry) => normalize(entry.department) === normalize(department.name))
          .map((entry) => `${entry.name} - ${entry.role}`);

    if (items.length) {
      return buildBaseResponse({
        intent: "faculty_query",
        title: `${department.name} faculty`,
        message: `These faculty details are currently loaded for ${department.name}.`,
        sections: [{ heading: "Faculty directory", items }],
        links: [{ label: "Academic Council", url: collegeData.links.academicCouncil }],
        source: "Official faculty content currently loaded in project data",
        suggestions: [`${department.shortName} syllabus`, `${department.shortName} placements`, `${department.shortName} admissions`],
        actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp"]),
        context: { department: department.name },
      });
    }
  }

  return buildBaseResponse({
    intent: "faculty_query",
    title: "Faculty and leadership",
    message: "I can help with principal, director, HOD, or department faculty information. Try asking for a department such as AIML, Data Science, Cyber Security, or Freshman Engineering.",
    sections: [
      {
        heading: "Leadership currently loaded",
        items: collegeData.faculty.map((entry) => `${entry.name} - ${entry.role}`),
      },
    ],
    links: [{ label: "Academic Council", url: collegeData.links.academicCouncil }],
    source: "Academic Council page and official department staff content",
    suggestions: ["Who is the principal?", "Show AIML faculty", "Who is HOD of Data Science?"],
    actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp"]),
  });
}

function buildTimetableResponse(previousContext, knowledgeBase) {
  const department = previousContext?.department ? findDepartmentByName(previousContext.department) : null;
  const year = previousContext?.year || null;
  const note = knowledgeBase.timetables?.[department?.name || "default"]?.note || knowledgeBase.timetables?.default?.note;
  const items = [note || "A public timetable was not found in the official data currently loaded for this project."];

  if (department) {
    items.push(`Current department context: ${department.name}`);
  }
  if (year?.label) {
    items.push(`Current year context: ${year.label}`);
  }

  return buildBaseResponse({
    intent: "timetable_query",
    title: "Timetable",
    message: "A public timetable is not available in the official data currently loaded, but I can still help with calendar dates, courses, faculty, and admissions.",
    sections: [{ heading: "Timetable status", items }],
    links: [{ label: "Academic Calendar PDF", url: collegeData.links.academicCalendarPdf }],
    source: "Current official data loaded in the project",
    suggestions: ["Show academic calendar details", "2nd year exam dates", "Tell me about departments"],
    actions: pickActions(knowledgeBase, ["Academic Calendar", "Student Login"]),
    context: {
      department: department?.name || null,
      year,
    },
  });
}

function buildCoursesResponse(message, previousContext, knowledgeBase) {
  const department = extractDepartment(message, previousContext);
  if (department) {
    const profile = collegeData.academics.departmentProfiles[department.name] || {};
    const syllabusItems = [collegeData.academics.syllabus.note];
    if (Array.isArray(profile.focusAreas)) {
      syllabusItems.unshift(...profile.focusAreas);
    }

    return buildBaseResponse({
      intent: "courses_query",
      title: `${department.name} courses and syllabus`,
      message: `Here is the course and syllabus context currently loaded for ${department.name}.`,
      sections: [
        { heading: "Programme summary", items: [department.overview] },
        { heading: "Syllabus and regulation notes", items: syllabusItems.slice(0, 4) },
      ],
      links: [
        { label: "Courses Offered", url: collegeData.links.coursesOffered },
        { label: "SR24 Regulations", url: collegeData.links.regulations },
      ],
      source: `${department.source || "Official department page"} and SR24 regulations PDF`,
      suggestions: [`${department.shortName} faculty`, `${department.shortName} placements`, `${department.shortName} admissions`],
      actions: pickActions(knowledgeBase, ["Departments", "Apply Now", "Download Brochure"]),
      context: { department: department.name },
    });
  }

  return buildBaseResponse({
    intent: "courses_query",
    title: "Courses and syllabus",
    message: "These course and regulation details are currently available from the official pages loaded in the project.",
    sections: [
      {
        heading: "Programmes",
        items: collegeData.academics.departments.map((departmentEntry) => departmentEntry.name),
      },
      {
        heading: "Academic regulations",
        items: collegeData.academics.regulations,
      },
      {
        heading: "Syllabus note",
        items: [collegeData.academics.syllabus.note],
      },
    ],
    links: [
      { label: "Courses Offered", url: collegeData.links.coursesOffered },
      { label: "SR24 Regulations", url: collegeData.links.regulations },
    ],
    source: "Official courses page and SR24 regulations PDF",
    suggestions: ["Tell me about CSE department", "Show AIML details", "How do admissions work?"],
    actions: pickActions(knowledgeBase, ["Departments", "Apply Now", "Download Brochure"]),
  });
}

function buildAdmissionsResponse(previousContext, knowledgeBase) {
  const department = previousContext?.department ? findDepartmentByName(previousContext.department) : null;
  const sections = [
    { heading: "Admissions process", items: collegeData.admissions.process },
    { heading: "Eligibility", items: collegeData.admissions.eligibility },
    {
      heading: "Support",
      items: [collegeData.admissions.supportHours],
    },
  ];

  if (department) {
    sections.unshift({
      heading: "Department context",
      items: [`Current conversation context: ${department.name}`],
    });
  }

  return buildBaseResponse({
    intent: "admissions_query",
    title: "Admissions and eligibility",
    message: "These admissions details come from the official admissions pages and regulations currently loaded in the project.",
    sections,
    links: [
      { label: "Admissions Procedure", url: collegeData.links.admissions },
      { label: "Eligibility Conditions", url: collegeData.links.eligibility },
      { label: "B-Category Notice", url: collegeData.links.bCategoryNotice },
    ],
    source: "Official admissions procedure page, eligibility conditions page, and SR24 regulations PDF",
    suggestions: ["What fees are available?", "Tell me about placements", "Show CSE department details"],
    actions: pickActions(knowledgeBase, ["Apply Now", "Call Admissions", "WhatsApp", "Download Brochure"]),
    context: department ? { department: department.name } : {},
  });
}

function buildFeesResponse(previousContext, knowledgeBase) {
  const department = previousContext?.department ? findDepartmentByName(previousContext.department) : null;
  const sections = [
    { heading: "Official fee note", items: [collegeData.admissions.fees.note] },
    { heading: "Scholarship note", items: [knowledgeBase.scholarships.note || collegeData.admissions.scholarships.note] },
  ];

  if (department) {
    sections.unshift({
      heading: "Department context",
      items: [`Current conversation context: ${department.name}`],
    });
  }

  return buildBaseResponse({
    intent: "fees_query",
    title: "Fees and scholarships",
    message: "Here is the fee and scholarship information currently available from the official data loaded in the project.",
    sections,
    links: [
      { label: "Exam Fee Page", url: collegeData.links.examFees },
      { label: "Admissions Procedure", url: collegeData.links.admissions },
    ],
    source: "Official exam fee page and admissions content currently loaded in the project",
    suggestions: ["How do admissions work?", "Tell me about scholarships", "What courses are offered?"],
    actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp", "Apply Now"]),
    context: department ? { department: department.name } : {},
  });
}

function buildPlacementsResponse(previousContext, knowledgeBase) {
  const department = previousContext?.department ? findDepartmentByName(previousContext.department) : null;
  const sections = [
    {
      heading: "Year-wise offers",
      items: collegeData.placements.yearWiseOffers.map((entry) => `${entry.academicYear} - ${entry.offers}`),
    },
    {
      heading: "Recent recruiters",
      items: collegeData.placements.recentRecruiters.slice(0, 10),
    },
    {
      heading: "Placement support",
      items: [...collegeData.placements.trainingHighlights, collegeData.placements.note],
    },
  ];

  if (knowledgeBase.placements.length) {
    sections.unshift({
      heading: "Latest placement circulars",
      items: knowledgeBase.placements.slice(-4).reverse().map((entry) => `${entry.title}${entry.company ? ` - ${entry.company}` : ""}${entry.driveDate ? ` (${entry.driveDate})` : ""}`),
    });
  }

  if (department) {
    sections.unshift({
      heading: "Department context",
      items: [`Current conversation context: ${department.name}`],
    });
  }

  return buildBaseResponse({
    intent: "placements_query",
    title: "Placements",
    message: "These placement details come from the official year-wise placement and placement circular pages currently loaded in the project.",
    sections,
    links: [
      { label: "Year Wise Placement", url: collegeData.links.yearWisePlacement },
      { label: "Placement Circulars", url: collegeData.links.placementCirculars },
    ],
    source: "Official year-wise placement page and placement circulars page",
    suggestions: ["Show CSE department details", "How do admissions work?", "What is the contact information?"],
    actions: pickActions(knowledgeBase, ["Apply Now", "WhatsApp", "Download Brochure"]),
    context: department ? { department: department.name } : {},
  });
}

function buildComplaintHelpResponse() {
  return buildBaseResponse({
    intent: "complaint_query",
    title: "Complaint support",
    message: "Students can submit lab, classroom, WiFi, and transport complaints from the student dashboard.",
    sections: [
      {
        heading: "Available categories",
        items: ["Lab issues", "Classroom complaints", "WiFi problems", "Transport complaints"],
      },
    ],
    links: [{ label: "Open Student Dashboard", url: "/dashboard" }],
    source: "EduReach student portal",
    suggestions: ["Submit a WiFi complaint", "Transport complaint", "Lab issue"],
  });
}

function buildEventResponse(knowledgeBase) {
  const eventItems = knowledgeBase.events.length
    ? knowledgeBase.events.slice(-5).reverse().map((entry) => `${entry.title}${entry.startsAt ? ` - ${entry.startsAt}` : ""}${entry.venue ? ` at ${entry.venue}` : ""}`)
    : ["No new events have been uploaded by the admin team yet."];
  const noticeItems = knowledgeBase.notices.length
    ? knowledgeBase.notices.slice(-4).reverse().map((entry) => `${entry.title}: ${entry.body}`)
    : ["No current public notices are uploaded in the portal yet."];

  return buildBaseResponse({
    intent: "event_query",
    title: "Events and announcements",
    message: "Here are the latest portal updates available to students.",
    sections: [
      { heading: "Events", items: eventItems },
      { heading: "Notices", items: noticeItems },
    ],
    source: "Admin uploaded notices and events",
    suggestions: ["Placement drives", "Exam schedules", "Student dashboard"],
  });
}

function searchUploadedKnowledge(message, knowledgeBase) {
  const tokens = tokenize(message);
  if (!tokens.length) return null;

  const faq = knowledgeBase.chatbotFaqs
    .map((entry) => ({
      entry,
      score: tokens.reduce((sum, token) => sum + (normalize(`${entry.question} ${entry.answer}`).includes(token) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (faq?.score >= 2) {
    return buildBaseResponse({
      intent: "faq_query",
      title: faq.entry.question,
      message: faq.entry.answer,
      source: "Admin-managed chatbot FAQ",
      suggestions: getDefaultSuggestions(knowledgeBase),
    });
  }

  const pdf = knowledgeBase.pdfs
    .flatMap((document) =>
      (document.chunks || []).map((chunk) => ({
        document,
        chunk,
        score: tokens.reduce((sum, token) => sum + (chunk.text?.includes(token) ? 1 : 0), 0),
      }))
    )
    .sort((a, b) => b.score - a.score)[0];

  if (pdf?.score >= 3) {
    return buildBaseResponse({
      intent: "pdf_knowledge_query",
      title: pdf.document.title,
      message: "I found a matching section in the uploaded knowledge base.",
      sections: [{ heading: pdf.document.category || "PDF match", items: [pdf.chunk.text.slice(0, 420)] }],
      source: `Uploaded PDF: ${pdf.document.originalName || pdf.document.title}`,
      suggestions: ["Syllabus PDFs", "Scholarship information", "Exam schedules"],
    });
  }

  return null;
}

function buildHostelResponse(knowledgeBase) {
  return buildBaseResponse({
    intent: "hostel_query",
    title: "Hostel and campus facilities",
    message: "These campus and hostel details come from the official infrastructure-related pages currently loaded in the project.",
    sections: [
      { heading: "Girls hostel", items: [collegeData.hostel.summary, ...collegeData.hostel.highlights] },
      {
        heading: "Campus facilities",
        items: [
          collegeData.campus.library,
          collegeData.campus.cafeteria,
          ...collegeData.campus.features.map((entry) => `${entry.title}: ${entry.description}`),
        ],
      },
    ],
    links: [
      { label: "Girls Hostel", url: collegeData.links.girlsHostel },
      { label: "Library", url: collegeData.links.library },
      { label: "Cafeteria", url: collegeData.links.cafeteria },
    ],
    source: "Official hostel, library, cafeteria, and campus information pages",
    suggestions: ["Tell me about placements", "What is the contact information?", "Show academic calendar details"],
    actions: pickActions(knowledgeBase, ["WhatsApp", "Call Admissions", "Download Brochure"]),
  });
}

function buildContactResponse(message, knowledgeBase) {
  const normalizedMessage = normalize(message);
  const routingMatch = collegeData.contactRouting.find((entry) => normalizedMessage.includes(normalize(entry.topic)));
  const contactItems = [
    collegeData.contact.address,
    `Phone: ${collegeData.contact.phone}`,
    `Phone: ${collegeData.contact.general}`,
    `Email: ${collegeData.contact.email}`,
    collegeData.admissions.supportHours,
  ];

  if (routingMatch) {
    contactItems.unshift(`${routingMatch.label}: ${routingMatch.phone}${routingMatch.email ? `, ${routingMatch.email}` : ""}`);
  }

  return buildBaseResponse({
    intent: "contact_query",
    title: "Contact information",
    message: "These are the official contact details currently loaded for the college.",
    sections: [{ heading: "Contact", items: contactItems }],
    links: [{ label: "Official Website", url: collegeData.links.website }],
    source: "Official contact information published on Sphoorthy pages",
    suggestions: ["Student login portal", "How do admissions work?", "Tell me about departments"],
    actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp", "Student Login"]),
  });
}

function buildPortalResponse(knowledgeBase) {
  return buildBaseResponse({
    intent: "portal_query",
    title: "Student portal and results access",
    message: "You can use the official student login and results portal from the link below.",
    sections: [
      {
        heading: "Portal access",
        items: [
          "Student Login portal: sphoorthyautonomous.in",
          "The exam fee page is also available on the official Sphoorthy website.",
        ],
      },
    ],
    links: [
      { label: "Student Login", url: collegeData.links.studentLogin },
      { label: "Exam Fee Page", url: collegeData.links.examFees },
    ],
    source: "Official Sphoorthy student portal and exam fee page",
    suggestions: ["2nd year exam dates", "What is the contact information?", "How do admissions work?"],
    actions: pickActions(knowledgeBase, ["Student Login", "Academic Calendar", "Call Admissions"]),
  });
}

function buildGeneralResponse(knowledgeBase) {
  return buildBaseResponse({
    intent: "general_query",
    title: "General college information",
    message: "Here is a summary from the official Sphoorthy Engineering College information currently loaded in the project.",
    sections: [
      {
        heading: "Overview",
        items: [
          collegeData.identity.name,
          collegeData.identity.statusLine,
          collegeData.contact.location,
          collegeData.contact.address,
          collegeData.identity.officialQuotes[0].text,
        ],
      },
    ],
    links: [{ label: "Official Website", url: collegeData.links.website }],
    source: "Official Sphoorthy Engineering College website",
    suggestions: getDefaultSuggestions(knowledgeBase),
    actions: pickActions(knowledgeBase, ["Apply Now", "Student Login", "Download Brochure"]),
  });
}

function buildGreetingResponse(knowledgeBase) {
  return buildBaseResponse({
    intent: "greeting_query",
    title: "Sphoorthy Assistant",
    message:
      "Hi! Ask me about academic calendar, admissions, departments, or exams.",
    sections: [
      {
        heading: "Popular questions",
        items: [
          "Give academic calendar for 1st year",
          "How do admissions work?",
          "2nd year exam dates",
          "Who is the HOD of AIML?",
        ],
      },
    ],
    links: [{ label: "Official Website", url: collegeData.links.website }],
    source: "Official Sphoorthy Engineering College data loaded in the assistant",
    suggestions: getDefaultSuggestions(knowledgeBase),
    actions: pickActions(knowledgeBase, ["Apply Now", "Student Login", "Academic Calendar", "WhatsApp"]),
  });
}

function buildThanksResponse(knowledgeBase) {
  return buildBaseResponse({
    intent: "thanks_query",
    title: "Happy to help",
    message: "You are welcome. I can continue with another college question whenever you need it.",
    source: "Sphoorthy assistant conversation",
    suggestions: ["Show academic calendar details", "What courses are offered?", "Contact admissions"],
    actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp", "Official Website"]),
  });
}

function buildFallbackResponse(knowledgeBase) {
  return buildBaseResponse({
    intent: "fallback",
    title: "Information not available",
    message: UNAVAILABLE_MESSAGE,
    source: "",
  });
}

function buildStrictFallbackResponse() {
  return buildBaseResponse({
    intent: "general",
    title: "Information not available",
    message: UNAVAILABLE_MESSAGE,
    source: "",
  });
}

function responseHasUnavailableInfo(response) {
  const text = normalize(
    [
      response?.message,
      ...(response?.sections || []).flatMap((section) => [section.heading, ...(section.items || [])]),
    ].join(" ")
  );

  return /\b(not available|not found|not currently loaded|not publicly listed|not clearly published|missing)\b/.test(text);
}

function keepAnswerShort(response) {
  const sections = Array.isArray(response.sections)
    ? response.sections.slice(0, 2).map((section) => ({
        heading: section.heading,
        items: Array.isArray(section.items) ? section.items.slice(0, 4) : [],
      }))
    : [];

  return {
    ...response,
    sections,
    links: [],
    suggestions: [],
    actions: [],
    source: "",
  };
}

function applyStrictIntentRules(response) {
  const strictIntent = STRICT_INTENT_MAP[response?.intent];

  if (!strictIntent || responseHasUnavailableInfo(response)) {
    return buildStrictFallbackResponse();
  }

  return keepAnswerShort({
    ...response,
    intent: strictIntent,
  });
}

function searchKnowledgeBase(message, previousContext, knowledgeBase) {
  const normalizedMessage = normalize(message);
  const tokens = tokenize(message);

  const searchableEntries = [
    {
      title: "Library",
      text: collegeData.campus.library,
      intent: "hostel_query",
      links: [{ label: "Library", url: collegeData.links.library }],
      source: "Official library page",
      suggestions: ["Tell me about hostel", "Show academic calendar details", "What courses are offered?"],
      actions: pickActions(knowledgeBase, ["Download Brochure", "WhatsApp"]),
    },
    {
      title: "Cafeteria",
      text: collegeData.campus.cafeteria,
      intent: "hostel_query",
      links: [{ label: "Cafeteria", url: collegeData.links.cafeteria }],
      source: "Official cafeteria page",
      suggestions: ["Tell me about hostel", "What is the contact information?", "How do admissions work?"],
      actions: pickActions(knowledgeBase, ["Download Brochure", "WhatsApp"]),
    },
    {
      title: "Hostel",
      text: [collegeData.hostel.summary, ...collegeData.hostel.highlights].join(" "),
      intent: "hostel_query",
      links: [{ label: "Girls Hostel", url: collegeData.links.girlsHostel }],
      source: "Official girls hostel page",
      suggestions: ["Tell me about placements", "What is the contact information?", "Show academic calendar details"],
      actions: pickActions(knowledgeBase, ["Call Admissions", "WhatsApp"]),
    },
    {
      title: "Student Clubs",
      text: collegeData.campus.features.find((entry) => entry.title === "Student Clubs")?.description || "",
      intent: "hostel_query",
      links: [{ label: "Official Website", url: collegeData.links.website }],
      source: "Official campus and student activity content",
      suggestions: ["Tell me about campus", "What is the contact information?", "Show departments"],
      actions: pickActions(knowledgeBase, ["Download Brochure", "WhatsApp"]),
    },
    {
      title: "AICTE Idea Lab",
      text: collegeData.campus.features.find((entry) => entry.title === "AICTE Idea Lab")?.description || "",
      intent: "general_query",
      links: [{ label: "Official Website", url: collegeData.links.website }],
      source: "Official campus feature content",
      suggestions: ["Tell me about departments", "Show placements", "How do admissions work?"],
      actions: pickActions(knowledgeBase, ["Download Brochure", "Apply Now"]),
    },
  ];

  const department = extractDepartment(message, previousContext);
  if (department && !/\b(course|courses|syllabus|faculty|placement|placements|admission|fees|exam|calendar)\b/.test(normalizedMessage)) {
    return buildDepartmentResponse(message, previousContext, knowledgeBase);
  }

  let bestMatch = null;
  let bestScore = 0;
  for (const entry of searchableEntries) {
    let score = 0;
    const entryText = normalize(`${entry.title} ${entry.text}`);
    for (const token of tokens) {
      if (entryText.includes(token)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (!bestMatch || bestScore < 2) {
    return null;
  }

  return buildBaseResponse({
    intent: bestMatch.intent,
    title: bestMatch.title,
    message: bestMatch.text,
    links: bestMatch.links,
    source: bestMatch.source,
    suggestions: bestMatch.suggestions,
    actions: bestMatch.actions,
    context: department ? { department: department.name } : {},
  });
}

async function tryOpenAIResponse(message, localResponse, context) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const prompt = [
      "Answer only from the provided official Sphoorthy Engineering College data.",
      "Do not invent facts. If exact information is missing, say that clearly.",
      `User question: ${message}`,
      `Current structured answer draft: ${JSON.stringify(localResponse)}`,
      `Conversation context: ${JSON.stringify(context)}`,
      `Structured college data: ${JSON.stringify(collegeData)}`,
      "Return JSON with keys: title, message, sections, links, suggestions.",
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (!json.output_text) {
      return null;
    }

    const parsed = JSON.parse(json.output_text);
    return buildBaseResponse({
      intent: localResponse.intent,
      title: parsed.title || localResponse.title,
      message: parsed.message || localResponse.message,
      sections: Array.isArray(parsed.sections) ? parsed.sections : localResponse.sections,
      links: Array.isArray(parsed.links) ? parsed.links : localResponse.links,
      source: localResponse.source,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : localResponse.suggestions,
      actions: localResponse.actions,
      context: localResponse.context,
    });
  } catch {
    return null;
  }
}

async function buildChatResponse(message, options = {}) {
  const knowledgeBase = getKnowledgeBase();
  const previousContext = getLastContext(options.userId);
  const department = extractDepartment(message, previousContext);
  const year = extractYear(message, previousContext);
  const intent = detectIntent(message, previousContext);

  let response;
  const uploadedKnowledgeResponse = searchUploadedKnowledge(message, knowledgeBase);
  if (uploadedKnowledgeResponse) {
    response = uploadedKnowledgeResponse;
  }

  if (!response) switch (intent) {
    case "greeting_query":
      response = buildGreetingResponse(knowledgeBase);
      break;
    case "thanks_query":
      response = buildThanksResponse(knowledgeBase);
      break;
    case "department_query":
      response = buildDepartmentResponse(message, previousContext, knowledgeBase);
      break;
    case "faculty_query":
      response = buildFacultyResponse(message, previousContext, knowledgeBase);
      break;
    case "exam_query":
      response = buildExamResponse(message, previousContext, knowledgeBase);
      break;
    case "academic_calendar":
      response = buildAcademicCalendarResponse({ ...previousContext, year }, knowledgeBase);
      break;
    case "timetable_query":
      response = buildTimetableResponse({ ...previousContext, department: department?.name || previousContext?.department, year }, knowledgeBase);
      break;
    case "courses_query":
      response = buildCoursesResponse(message, previousContext, knowledgeBase);
      break;
    case "admissions_query":
      response = buildAdmissionsResponse({ ...previousContext, department: department?.name || previousContext?.department }, knowledgeBase);
      break;
    case "fees_query":
      response = buildFeesResponse({ ...previousContext, department: department?.name || previousContext?.department }, knowledgeBase);
      break;
    case "placements_query":
      response = buildPlacementsResponse({ ...previousContext, department: department?.name || previousContext?.department }, knowledgeBase);
      break;
    case "complaint_query":
      response = buildComplaintHelpResponse();
      break;
    case "event_query":
      response = buildEventResponse(knowledgeBase);
      break;
    case "hostel_query":
      response = buildHostelResponse(knowledgeBase);
      break;
    case "contact_query":
      response = buildContactResponse(message, knowledgeBase);
      break;
    case "portal_query":
      response = buildPortalResponse(knowledgeBase);
      break;
    case "general_query":
    default:
      response = searchKnowledgeBase(message, previousContext, knowledgeBase) || buildGeneralResponse(knowledgeBase);
      break;
  }

  if (response.intent === "general_query" || response.intent === "fallback") {
    const aiResponse = await tryOpenAIResponse(message, response, {
      previousContext,
      department: department?.name || previousContext?.department || null,
      year: year?.label || previousContext?.year?.label || null,
    });
    if (aiResponse) {
      response = aiResponse;
    }
  }

  response = applyStrictIntentRules(response);

  const resolvedContext = {
    lastIntent: response.intent,
    department: response.context?.department || department?.name || previousContext?.department || null,
    faculty: response.context?.faculty || previousContext?.faculty || null,
    year: response.context?.year || year || previousContext?.year || null,
    updatedAt: new Date().toISOString(),
  };

  if (!response || !response.message) {
    response = buildFallbackResponse(knowledgeBase);
  }

  return {
    ...response,
    context: resolvedContext,
  };
}

module.exports = { buildChatResponse };
