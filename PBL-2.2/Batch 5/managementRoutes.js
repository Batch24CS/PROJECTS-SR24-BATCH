import { Router } from "express";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { assignMentor, createAbsenceRequest, listAbsenceRequests, listFaculty, listHodRequests, listMentors, listUsersByRole, reviewAbsenceRequest, reviewHodRequest, reviewUserApproval } from "../controllers/managementController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/faculty", protect, allowRoles("hod"), listFaculty);
router.get("/users/:role", protect, allowRoles("admin"), listUsersByRole);
router.get("/hod-requests", protect, allowRoles("admin"), listHodRequests);
router.put("/hod-requests/:id/review", protect, allowRoles("admin"), reviewHodRequest);
router.put("/users/:id/review", protect, allowRoles("admin"), reviewUserApproval);
router.get("/mentors", protect, allowRoles("faculty", "hod", "admin"), listMentors);
router.post("/mentors", protect, allowRoles("hod", "admin"), assignMentor);
router.get("/absence-requests", protect, allowRoles("student", "faculty", "hod"), listAbsenceRequests);
router.post("/absence-requests", protect, allowRoles("student"), upload.single("proof"), createAbsenceRequest);
router.put("/absence-requests/:id/review", protect, allowRoles("faculty", "hod"), reviewAbsenceRequest);

export default router;
