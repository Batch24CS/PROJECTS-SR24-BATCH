import { Router } from "express";
import { createConversation, listContacts, listConversations, listMessages, markMessagesRead, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/contacts", protect, listContacts);
router.get("/conversations", protect, listConversations);
router.get("/conversations/:id/messages", protect, listMessages);
router.post("/conversations", protect, createConversation);
router.post("/messages", protect, sendMessage);
router.put("/messages/read", protect, markMessagesRead);

export default router;
