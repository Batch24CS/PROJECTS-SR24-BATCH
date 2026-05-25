const links = {
  website: "https://www.sphoorthyengg.ac.in/",
  coursesOffered: "https://www.sphoorthyengg.ac.in/courses-offered",
  admissions: "https://www.sphoorthyengg.ac.in/admission-procedure",
  eligibility: "https://www.sphoorthyengg.ac.in/eligibility-conditions",
  bCategoryNotice: "https://www.sphoorthyengg.ac.in/announcement/b-category-application-form-for-2025-26",
  academicCalendarPdf: "https://www.sphoorthyengg.ac.in/public/assets/uploads/calendars/10-calendar-1730196807.pdf",
  regulations: "https://www.sphoorthyengg.ac.in/public/assets/uploads/regulations/4-regulation-1739527932.pdf",
  yearWisePlacement: "https://www.sphoorthyengg.ac.in/year-wise-placement",
  placementCirculars: "https://www.sphoorthyengg.ac.in/placement-circulars",
  girlsHostel: "https://www.sphoorthyengg.ac.in/girls-hostel",
  library: "https://www.sphoorthyengg.ac.in/library-and-information-center",
  cafeteria: "https://sphoorthyengg.ac.in/college-canteen",
  examFees: "https://www.sphoorthyengg.ac.in/examination-registration-fee-payment",
  academicCouncil: "https://www.sphoorthyengg.ac.in/academic-council",
  brochure: "https://www.sphoorthyengg.ac.in/contact-us//1000",
  studentLogin: "https://sphoorthyautonomous.in/",
};

const collegeData = {
  identity: {
    name: "Sphoorthy Engineering College",
    shortName: "Sphoorthy",
    statusLine: "Autonomous Institution - Accredited by NAAC with A Grade",
    established: "2004",
    officialQuotes: [
      {
        text: "'Sphoorthy' is the embodiment of inspiration and the fundamental objective of our institution.",
        source: "Official website",
      },
      {
        text: "Our aim is to provide a stimulating atmosphere for young minds to reform and recreate their potentials to break the barrier of success.",
        source: "Official website",
      },
    ],
  },
  links,
  contact: {
    email: "admissions@sphoorthyengg.ac.in",
    phone: "+91 9392 11 9392",
    general: "+91 99 666 31091",
    address: "Sphoorthy Engineering College, Nadargul Village, Saroornagar Mandal, Hyderabad, Telangana - 501510, India",
    location: "Nadargul, Hyderabad",
  },
  quickActions: [
    { label: "Apply Now", type: "link", value: links.admissions },
    { label: "Student Login", type: "link", value: links.studentLogin },
    { label: "Academic Calendar", type: "link", value: links.academicCalendarPdf },
    { label: "Departments", type: "link", value: links.coursesOffered },
    { label: "Download Brochure", type: "link", value: links.brochure },
    { label: "Call Admissions", type: "link", value: "tel:+919392119392" },
    {
      label: "WhatsApp",
      type: "link",
      value: "https://wa.me/919392119392?text=Hi%2C%20I%20have%20a%20question%20about%20Sphoorthy%20Engineering%20College.",
    },
  ],
  academics: {
    regulations: [
      "SR24 B.Tech academic regulations are in effect from the academic year 2024-25.",
      "The B.Tech program is 4 academic years with 8 semesters under CBCS.",
      "Students must complete 160 credits for award of the B.Tech degree as per SR24 regulations.",
      "The medium of instruction for the entire undergraduate program is English only.",
    ],
    departments: [
      {
        name: "Computer Science and Engineering",
        shortName: "CSE",
        aliases: ["cse", "computer science", "computer science engineering", "computer science and engineering"],
        status: "Active undergraduate programme",
        overview:
          "The Freshman Engineering HOD message says Computer Science Engineering is one of the undergraduate programmes currently offered.",
        source: "Freshman Engineering HOD message",
      },
      {
        name: "CSE - Artificial Intelligence and Machine Learning",
        shortName: "AIML",
        aliases: [
          "aiml",
          "ai ml",
          "ai and ml",
          "artificial intelligence",
          "artificial intelligence and machine learning",
          "cse aiml",
        ],
        status: "Active undergraduate programme",
        overview:
          "The Freshman Engineering HOD message and the AIML teaching staff page show this programme as one of the current undergraduate offerings.",
        source: "Freshman Engineering HOD message and AIML teaching staff page",
      },
      {
        name: "CSE - Cyber Security",
        shortName: "Cyber Security",
        aliases: ["cyber", "cyber security", "cse cyber security", "computer security"],
        status: "Active undergraduate programme",
        overview:
          "The Cyber Security department page says the department focuses on ethical hacking, digital forensics, and cryptography.",
        source: "Cyber Security department page",
      },
      {
        name: "CSE - Data Science",
        shortName: "Data Science",
        aliases: ["data science", "ds", "cse data science", "cse ds"],
        status: "Active undergraduate programme",
        overview:
          "The Data Science department page says the programme started in 2020 with an intake of 180 students.",
        intake: 180,
        since: "2020",
        source: "Data Science department page",
      },
      {
        name: "Freshman Engineering",
        shortName: "Freshman",
        aliases: ["freshman", "freshman engineering", "first year", "1st year department"],
        status: "Foundation department",
        overview:
          "The Freshman Engineering HOD message says the department was established in 2004 and now has intake of 600 students.",
        intake: 600,
        since: "2004",
        source: "Freshman Engineering HOD message",
      },
      {
        name: "School of Computing",
        shortName: "School of Computing",
        aliases: ["school of computing"],
        status: "School",
        overview: "The School of Computing is visible in the official site menu under Departments.",
        source: "Official website navigation",
      },
      {
        name: "ECE",
        shortName: "ECE",
        aliases: ["ece", "electronics", "electronics and communication"],
        status: "Department requested often",
        overview:
          "Detailed ECE page data is not currently loaded in this project. Please use the official website for the latest ECE-specific academic information.",
        source: "Current project data scope",
      },
      {
        name: "MBA",
        shortName: "MBA",
        aliases: ["mba", "management", "master of business administration"],
        status: "Programme requested often",
        overview:
          "Detailed MBA page data is not currently loaded in this project. Please use the official website for the latest MBA-specific academic information.",
        source: "Current project data scope",
      },
    ],
    departmentProfiles: {
      "Computer Science and Engineering": {
        focusAreas: [
          "Undergraduate programme listed in official Freshman Engineering information.",
          "Academic Council page lists a HoD for CSE.",
        ],
        facultyHeads: ["Mr. G. Prasad - HoD of CSE"],
        notes: [
          "The department is part of the currently offered undergraduate programmes referenced on the official site.",
        ],
        links: [links.coursesOffered, links.academicCouncil],
      },
      "CSE - Artificial Intelligence and Machine Learning": {
        focusAreas: [
          "Teaching staff page lists AIML faculty and a Head of Department.",
          "Official staff content indicates the programme is supported by dedicated faculty members.",
        ],
        facultyHeads: ["Mrs. S. Indhumathi - HoD of AIML"],
        notes: [
          "Official AIML teaching staff content lists multiple assistant professors and one associate professor.",
        ],
        links: [links.coursesOffered, links.academicCouncil],
      },
      "CSE - Cyber Security": {
        focusAreas: [
          "The department page mentions ethical hacking, digital forensics, and cryptography.",
          "The department contact page publishes department contact details.",
        ],
        facultyHeads: ["Mrs. P. Sandhya Rani - Head of Cyber Security"],
        notes: [
          "The Cyber Security page says the curriculum and department activities are designed to build strong technical and managerial skills.",
        ],
        links: [links.coursesOffered],
      },
      "CSE - Data Science": {
        focusAreas: [
          "The programme started in 2020 with intake of 180 students.",
          "The department page mentions project-based learning, internships, and domain-specific MOUs.",
        ],
        facultyHeads: ["Dr. K. Ramesh Rao - HoD of Data Science"],
        notes: [
          "The department page says Data Science applies to areas such as predictive analytics, recommendation systems, logistics, healthcare, computer vision, and speech recognition.",
        ],
        links: [links.coursesOffered],
      },
      "Freshman Engineering": {
        focusAreas: [
          "Established in 2004.",
          "Supports first-year engineering foundations for undergraduate programmes.",
        ],
        facultyHeads: ["Dr. P. Gayatri Pavani - HoD, Freshman Engineering"],
        notes: [
          "The Freshman Engineering page says the department now has intake of 600 students.",
        ],
        links: [links.academicCouncil],
      },
      ECE: {
        focusAreas: [
          "Detailed department highlights are not currently loaded in the project data.",
        ],
        facultyHeads: [],
        notes: [
          "Use the official website for the latest ECE-specific course, faculty, and facility details.",
        ],
        links: [links.website],
      },
      MBA: {
        focusAreas: [
          "Detailed programme highlights are not currently loaded in the project data.",
        ],
        facultyHeads: [],
        notes: [
          "Use the official website for the latest MBA-specific admission and curriculum details.",
        ],
        links: [links.website],
      },
    },
    syllabus: {
      note:
        "The current project data includes the SR24 regulations PDF. A separate detailed syllabus page is not currently loaded in this project.",
      source: "SR24 regulations PDF",
    },
  },
  faculty: [
    {
      name: "Dr. V. S. Giridhar Akula",
      aliases: ["giridhar akula", "v s giridhar akula", "principal"],
      role: "Principal",
      department: "Administration",
      bio: "Listed on the official Academic Council page as Principal and Chairman of the Academic Council.",
      source: "Academic Council page",
    },
    {
      name: "Dr. M. V. S. Ram Prasad",
      aliases: ["ram prasad", "m v s ram prasad", "director"],
      role: "Director",
      department: "Administration",
      bio: "Listed on the official Academic Council page as Director and Member Secretary.",
      source: "Academic Council page",
    },
    {
      name: "Sri. S. Jagan Mohan Reddy",
      aliases: ["jagan mohan reddy", "s jagan mohan reddy", "secretary", "correspondent"],
      role: "Secretary / Correspondent",
      department: "Administration",
      bio: "Listed on the official governing body information as Secretary / Correspondent.",
      source: "Official governing body content",
    },
    {
      name: "Dr. P. Gayatri Pavani",
      aliases: ["gayatri pavani", "p gayatri pavani", "gayathri pavani"],
      role: "HoD, Freshman Engineering",
      department: "Freshman Engineering",
      phone: "9392118525",
      email: "hodhns@sphoorthyengg.ac.in",
      bio: "The official HOD message says Freshman Engineering was established in 2004 and now has intake of 600 students.",
      source: "Freshman Engineering HOD message",
    },
    {
      name: "Mr. G. Prasad",
      aliases: ["g prasad", "prasad"],
      role: "HoD, CSE",
      department: "Computer Science and Engineering",
      bio: "Listed on the Academic Council page as HoD of CSE.",
      source: "Academic Council page",
    },
    {
      name: "Mrs. S. Indhumathi",
      aliases: ["s indhumathi", "indhumathi"],
      role: "HoD, AIML",
      department: "CSE - Artificial Intelligence and Machine Learning",
      bio: "Listed on the Academic Council page as HoD of AIML. The AIML teaching staff page also lists her as Head of Department.",
      source: "Academic Council page and AIML teaching staff page",
    },
    {
      name: "Dr. K. Ramesh Rao",
      aliases: ["k ramesh rao", "ramesh rao"],
      role: "HoD, Data Science",
      department: "CSE - Data Science",
      bio: "Listed on the Academic Council page as HoD of Data Science.",
      source: "Academic Council page",
    },
    {
      name: "Mrs. P. Sandhya Rani",
      aliases: ["p sandhya rani", "sandhya rani"],
      role: "Head, Cyber Security",
      department: "CSE - Cyber Security",
      phone: "701399909",
      email: "hodcs@sphoorthyengg.ac.in",
      bio: "The official department contact page lists her as Head of the Department of Cyber Security.",
      source: "Cyber Security department contact page",
    },
  ],
  admissions: {
    supportHours: "College remains open on Sundays also from 9:00 AM to 5:00 PM for Admissions.",
    process: [
      "Admission to the undergraduate program is based on the merit rank obtained in TG EAPCET or any other order of merit approved by the University.",
      "The medium of instruction for the entire undergraduate program in Engineering and Technology is English only.",
      "A B-Category application form for 2025-26 is published on the official announcements page for B.Tech I Year admissions.",
      "The B.Tech program follows a 4-year, 8-semester CBCS structure.",
      "Students must complete 160 credits for award of the B.Tech degree as per SR24 regulations.",
    ],
    eligibility: [
      "Admissions follow merit rank obtained in the entrance test conducted by the Telangana State Government or University-approved order of merit.",
      "Admissions are subject to reservations prescribed by the government and the affiliating framework.",
      "Use the official eligibility conditions page for the exact latest category-wise requirements.",
    ],
    fees: {
      note:
        "Admission tuition fee details were not publicly listed on the official pages currently loaded in this project. The official website does publish an Exam Registration and Fee Payment page.",
      pageLabel: "Exam Registration and Fee Payment",
    },
    scholarships: {
      note:
        "Scholarship or tuition reimbursement details were not clearly published on the official pages currently loaded in this project.",
    },
    documents: {
      note:
        "A detailed official documents checklist is not currently loaded in this project. Please use the admissions office or the official admissions pages for the latest document requirements.",
    },
  },
  academicCalendarHighlights: [
    "19 Aug 2024 - 28 Aug 2024 - Induction Program",
    "29 Aug 2024 - 04 Nov 2024 - First Spell of Instructions",
    "07 Oct 2024 - 11 Oct 2024 - Dussehra Holidays",
    "04 Nov 2024 - 09 Nov 2024 - First Mid Exams",
    "25 Jan 2025 - 03 Feb 2025 - End Semester Exams",
    "07 Jul 2025 - 16 Jul 2025 - End Semester Exams (Second Semester)",
  ],
  placements: {
    yearWiseOffers: [
      { academicYear: "2022 - 2023", offers: "600+ offers till date, still counting" },
      { academicYear: "2021 - 2022", offers: "754" },
      { academicYear: "2020 - 2021", offers: "235" },
      { academicYear: "2019 - 2020", offers: "480" },
    ],
    recentRecruiters: [
      "KPR Techno Software Solutions",
      "Humming Bird Technologies",
      "24/7",
      "Sutherland",
      "LYROS",
      "EDU CASE",
      "T-HOME",
      "Tech Mahindra",
      "Sun Axis Systems",
      "iCube Solutions",
      "Cogninode",
      "Omega Health Care",
      "Grab",
      "Knowvation Learnings",
      "Cogent",
      "Savantis",
      "Smarted",
      "Writer Information Business Solutions",
    ],
    trainingHighlights: [
      "The official placement circulars page lists on-campus drives and training events.",
      "Recent official notices mention AI workshop, Salesforce with AI program, and multiple company drives.",
    ],
    note:
      "The official year-wise placement page publishes total offers by academic year. Exact highest-package and average-package figures were not publicly available on the currently loaded pages.",
  },
  hostel: {
    summary: "Sphoorthy Engineering College has hostel facility exclusively for girls within the campus.",
    highlights: [
      "The official girls hostel page says it provides a safe and congenial atmosphere for students.",
      "The hostel has a full-time resident warden, gymnasium, yoga studio, indoor and outdoor games, and female faculty supervision.",
      "The hostel assures a ragging-free environment.",
    ],
  },
  campus: {
    library:
      "The official library page says the library covers 16,000 sq. ft over three floors with more than 46,000 volumes and access to more than 5000 e-journals through INDEST, DELNET, NDL and NPTEL lectures.",
    cafeteria:
      "The official cafeteria page says the campus has a cafeteria and a separate canteen facility for girls hostel with emphasis on cleanliness, hygiene, and nutritious food.",
    features: [
      {
        title: "25 Acre Campus",
        description:
          "The official site describes the college as a 25 acre campus with academic and student support facilities.",
      },
      {
        title: "Student Clubs",
        description:
          "The official site lists student clubs including AI Fusion Club, Coders Club, Creators Club, Cultural Club, Multimedia Club, NSS Club, Radio Club, and Sports Club.",
      },
      {
        title: "AICTE Idea Lab",
        description:
          "The official site says AICTE New Delhi sanctioned an Idea Lab to the college to encourage creative work and problem solving.",
      },
    ],
  },
  contactRouting: [
    { topic: "admissions", label: "Admissions Office", phone: "+91 9392 11 9392", email: "admissions@sphoorthyengg.ac.in" },
    { topic: "general", label: "General Enquiry", phone: "+91 99 666 31091", email: "admissions@sphoorthyengg.ac.in" },
    { topic: "cyber security", label: "Cyber Security Department", phone: "701399909", email: "hodcs@sphoorthyengg.ac.in" },
    { topic: "freshman", label: "Freshman Engineering", phone: "9392118525", email: "hodhns@sphoorthyengg.ac.in" },
  ],
};

module.exports = { collegeData };
