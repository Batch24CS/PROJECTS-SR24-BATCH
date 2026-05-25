import { Router } from "express";
import { createClass, deleteClass, deleteTimetable, listClasses, listSubjects, listTimetable, updateClassStatus, upsertTimetable } from "../controllers/academicController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/subjects", protect, listSubjects);
router.get("/timetable", protect, listTimetable);
router.post("/timetable", protect, allowRoles("faculty", "hod"), upsertTimetable);
router.delete("/timetable/:id", protect, allowRoles("faculty", "hod"), deleteTimetable);
router.get("/classes", protect, allowRoles("faculty", "hod"), listClasses);
router.post("/classes", protect, allowRoles("faculty", "hod"), createClass);
router.put("/classes/:id/status", protect, allowRoles("faculty", "hod"), updateClassStatus);
router.delete("/classes/:id", protect, allowRoles("faculty", "hod"), deleteClass);

export default router;
