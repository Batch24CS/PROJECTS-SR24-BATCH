import "dotenv/config";
import fs from "fs/promises";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { campusZones } from "./config/campus.js";
import pool, { query } from "./config/db.js";
import { hashPassword } from "./utils/passwordUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSqlFile() {
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "sweety_smart_students"}\``);
  await bootstrap.end();

  const sql = await fs.readFile(path.join(__dirname, "database.sql"), "utf8");
  for (const statement of sql.split(";").map((item) => item.trim()).filter(Boolean)) {
    await pool.query(statement);
  }
}

await runSqlFile();

const adminPassword = await hashPassword("nvn-svcn-1");

await query(
  `INSERT INTO users (name, email, password, role, approval_status)
   VALUES ('Naveen Admin', 'nvn@gmail.com', :adminPassword, 'admin', 'approved')
   ON DUPLICATE KEY UPDATE
     name = VALUES(name),
     password = VALUES(password),
     approval_status = 'approved'`,
  { adminPassword }
);

const seededSubjects = [
  ...[
    ["SE", "Software Engineering"],
    ["BEFA", "Business Economics & Financial Analysis"],
    ["DM", "Discrete Mathematics"],
    ["CN", "Computer Networks"],
    ["OS", "Operating Systems"],
    ["COI", "Constitution of India"],
    ["RTRP", "RTRP"],
    ["NODE", "Node JS Lab"],
    ["CNL", "CN Lab"],
    ["OSL", "OS Lab"]
  ].map(([code, name]) => ({ code, name, branch: "CS Cyber Security", year: "2", section: "A", facultyId: null }))
];

for (const subject of seededSubjects) {
  await query(
    `INSERT INTO subjects (name, code, branch, year, section, faculty_id)
     VALUES (:name, :code, :branch, :year, :section, :facultyId)`,
    subject
  );
}

const subjects = await query("SELECT id, code, name FROM subjects WHERE branch = 'CS Cyber Security' AND year = '2' AND section = 'A'");
const subjectByCode = Object.fromEntries(subjects.map((subject) => [subject.code, subject]));
const times = {
  1: ["09:00:00", "10:00:00"],
  2: ["10:00:00", "10:50:00"],
  3: ["11:10:00", "11:50:00"],
  4: ["11:50:00", "12:40:00"],
  5: ["13:30:00", "14:20:00"],
  6: ["14:20:00", "15:10:00"],
  7: ["15:10:00", "16:00:00"]
};
const timetable = [
  ["MON", 1, "SE"], ["MON", 2, "BEFA"], ["MON", 3, "DM"], ["MON", 4, "CN"], ["MON", 5, "OS"], ["MON", 6, "COI"], ["MON", 7, "RTRP"],
  ["TUE", 1, "CN"], ["TUE", 2, "DM"], ["TUE", 3, "SE"], ["TUE", 4, "BEFA"], ["TUE", 5, "NODE"], ["TUE", 6, "NODE"], ["TUE", 7, "NODE"],
  ["WED", 1, "OS"], ["WED", 2, "CN"], ["WED", 3, "DM"], ["WED", 4, "SE"], ["WED", 5, "CNL"], ["WED", 6, "CNL"], ["WED", 7, "CNL"],
  ["THU", 1, "BEFA"], ["THU", 2, "OS"], ["THU", 3, "CN"], ["THU", 4, "DM"], ["THU", 5, "OSL"], ["THU", 6, "OSL"], ["THU", 7, "OSL"],
  ["FRI", 1, "SE"], ["FRI", 2, "CN"], ["FRI", 3, "OS"], ["FRI", 4, "BEFA"], ["FRI", 5, "DM"], ["FRI", 6, "COI"], ["FRI", 7, "RTRP"],
  ["SAT", 1, "RTRP"], ["SAT", 2, "COI"], ["SAT", 3, "SE"], ["SAT", 4, "OS"]
];

for (const [day, period, code] of timetable) {
  const subject = subjectByCode[code];
  if (!subject) continue;
  await query(
    `INSERT INTO timetable (branch, year, section, day_of_week, period_number, start_time, end_time, subject_id, subject_name, faculty_id, room)
     VALUES ('CS Cyber Security', '2', 'A', :day, :period, :startTime, :endTime, :subjectId, :subjectName, NULL, '309')`,
    { day, period, startTime: times[period][0], endTime: times[period][1], subjectId: subject.id, subjectName: subject.name }
  );
}

await query("DELETE FROM campus_zones");
for (const zone of campusZones) {
  await query(
    `INSERT INTO campus_zones (name, latitude, longitude, radius, description)
     VALUES (:name, :latitude, :longitude, :radius, :description)`,
    zone
  );
}

const userCount = (await query("SELECT COUNT(*) AS count FROM users"))[0].count;
console.log(`MySQL seed complete. User count: ${userCount}. Admin: nvn@gmail.com`);

await pool.end();
