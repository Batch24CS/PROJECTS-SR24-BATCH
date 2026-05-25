import "dotenv/config";
import { query } from "../config/db.js";
import { comparePassword, hashPassword } from "../utils/passwordUtils.js";

const ADMIN_EMAIL = "nvn@gmail.com";
const ADMIN_PASSWORD = "nvn-svcn-1";
const ADMIN_NAME = "Naveen Admin";

const hashed = await hashPassword(ADMIN_PASSWORD);
const existing = await query("SELECT id, email, password FROM users WHERE role = 'admin' LIMIT 1");

if (existing.length) {
  await query("UPDATE users SET name = :name, email = :email, password = :password, approval_status = 'approved' WHERE id = :id", {
    id: existing[0].id,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed
  });
  const ok = await comparePassword(ADMIN_PASSWORD, hashed);
  console.log(`Updated admin #${existing[0].id} (${ADMIN_EMAIL}). Password verify: ${ok}`);
} else {
  await query(
    `INSERT INTO users (name, email, password, role, approval_status)
     VALUES (:name, :email, :password, 'admin', 'approved')`,
    { name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed }
  );
  console.log(`Created admin (${ADMIN_EMAIL}).`);
}

console.log("\nLogin with:");
console.log(`  Email:    ${ADMIN_EMAIL}`);
console.log(`  Password: ${ADMIN_PASSWORD}`);
process.exit(0);
