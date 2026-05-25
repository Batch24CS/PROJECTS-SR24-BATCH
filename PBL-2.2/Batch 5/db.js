import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env first, then root .env
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database:
    process.env.DB_NAME || "sweety_smart_students",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Needed for :namedParams in SQL
  namedPlaceholders: true,
});

// Verify connection
export async function connectDB() {
  try {
    const connection = await pool.getConnection();

    await connection.ping();

    connection.release();

    console.log(
      `MySQL connected: ${
        process.env.DB_NAME ||
        "sweety_smart_students"
      }`
    );
  } catch (error) {
    console.error(
      "Database connection error:",
      error.message
    );

    throw error;
  }
}

// Execute query helper
export async function query(
  sql,
  params = {}
) {
  const [rows] =
    await pool.execute(sql, params);

  return rows;
}

// Transaction helper
export async function transaction(work) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result =
      await work(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

// IMPORTANT: export pool for seed.js
export { pool };

export default pool;
