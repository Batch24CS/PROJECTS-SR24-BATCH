import { Router } from "express";
import { createEvent, deleteEvent, listEvents, updateEvent } from "../controllers/eventController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.get("/", protect, listEvents);
router.post("/", protect, allowRoles("faculty", "hod"), upload.single("poster"), createEvent);
router.patch("/:id", protect, allowRoles("faculty", "hod"), updateEvent);
router.delete("/:id", protect, allowRoles("faculty", "hod"), deleteEvent);

export default router;
