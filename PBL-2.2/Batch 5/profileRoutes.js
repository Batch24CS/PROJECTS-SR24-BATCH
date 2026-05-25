import { Router } from "express";
import { facultyScope, searchStudents } from "../controllers/profileController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/faculty-scope", protect, allowRoles("faculty", "hod"), facultyScope);
router.get("/students/search", protect, allowRoles("faculty", "hod"), searchStudents);

export default router;
