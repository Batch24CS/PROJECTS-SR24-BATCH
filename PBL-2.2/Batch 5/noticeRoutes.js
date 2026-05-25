import { Router } from "express";
import { createNotice, deleteNotice, listNotices, updateNotice } from "../controllers/noticeController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", protect, listNotices);
router.post("/", protect, allowRoles("faculty", "hod"), createNotice);
router.patch("/:id", protect, allowRoles("faculty", "hod"), updateNotice);
router.delete("/:id", protect, allowRoles("faculty", "hod"), deleteNotice);

export default router;
