import { Router } from "express";
import { createDocument, listDocuments } from "../controllers/documentController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.get("/", protect, listDocuments);
router.post("/", protect, allowRoles("faculty", "hod"), upload.single("file"), createDocument);

export default router;
