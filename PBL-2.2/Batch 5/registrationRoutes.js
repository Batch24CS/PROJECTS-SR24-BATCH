import { Router } from "express";
import { listFacultyRequests, listRegistrationRequests, reviewFacultyRequest, rerequestFacultyApproval, rerequestRegistration, reviewRegistrationRequest } from "../controllers/registrationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, allowRoles("faculty", "hod"), listRegistrationRequests);
router.get("/faculty", protect, allowRoles("hod"), listFacultyRequests);
router.post("/re-request", protect, allowRoles("student"), rerequestRegistration);
router.post("/faculty/re-request", protect, allowRoles("faculty"), rerequestFacultyApproval);
router.put("/faculty/:id/review", protect, allowRoles("hod"), reviewFacultyRequest);
router.put("/:id/review", protect, allowRoles("faculty", "hod"), reviewRegistrationRequest);

export default router;
