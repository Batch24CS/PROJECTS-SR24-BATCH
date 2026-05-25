import { Router } from "express";
import {
  createAttendanceSession,
  createSmartAttendance,
  deleteAttendance,
  deleteSmartAttendance,
  getAttendanceSession,
  getSmartAttendance,
  listAttendance,
  listAttendanceRoster,
  listSmartAttendance,
  updateAttendanceRecord,
  updateSmartAttendance
} from "../controllers/attendanceController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", protect, listAttendance);
router.get("/roster", protect, allowRoles("faculty", "hod"), listAttendanceRoster);
router.get("/smart", protect, allowRoles("faculty", "hod"), listSmartAttendance);
router.get("/smart/:id", protect, allowRoles("faculty", "hod"), getSmartAttendance);
router.get("/sessions/:id", protect, allowRoles("faculty", "hod"), getAttendanceSession);
router.post("/smart", protect, allowRoles("faculty", "hod"), createSmartAttendance);
router.put("/smart/:id", protect, allowRoles("faculty", "hod"), updateSmartAttendance);
router.delete("/smart/:id", protect, allowRoles("faculty", "hod"), deleteSmartAttendance);
router.post("/", protect, allowRoles("faculty", "hod"), createAttendanceSession);
router.put("/records/:id", protect, allowRoles("faculty", "hod"), updateAttendanceRecord);
router.delete("/:id", protect, allowRoles("faculty", "hod"), deleteAttendance);

export default router;
