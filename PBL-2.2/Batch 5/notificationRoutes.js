import { Router } from "express";
import { listNotifications, markAllNotificationsRead, markNotificationRead, markRelatedNotificationsRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, listNotifications);
router.put("/read-all", protect, markAllNotificationsRead);
router.put("/read-related", protect, markRelatedNotificationsRead);
router.put("/:id/read", protect, markNotificationRead);

export default router;
