import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { registerSocketHandlers } from "./socket/index.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import managementRoutes from "./routes/managementRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../client/dist");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5000", credentials: true }
});

app.set("io", io);
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5000", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "Sphoorthy Engineering College API running" }));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/registration-requests", registrationRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/management", managementRoutes);

app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error("Server error:", error);
  res.status(error.status || 500).json({ message: process.env.NODE_ENV !== "production" ? error.message : "Server error" });
});

registerSocketHandlers(io);

const port = process.env.PORT || 5000;
connectDB()
  .then(() => server.listen(port, () => console.log(`Sphoorthy Engineering College app running at http://localhost:${port}`)))
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });

export default app;
