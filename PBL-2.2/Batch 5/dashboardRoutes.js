import { Router } from "express";
import { adminOverview, facultyOverview, hodOverview, studentOverview } from "../controllers/dashboardController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/student", protect, allowRoles("student"), studentOverview);
router.get("/faculty", protect, allowRoles("faculty"), facultyOverview);
router.get("/hod", protect, allowRoles("hod"), hodOverview);
router.get("/admin", protect, allowRoles("admin"), adminOverview);

export default router;
