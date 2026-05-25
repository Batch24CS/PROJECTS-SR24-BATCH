import { Router } from "express";
import { facultySignup, forgotPassword, hodSignup, login, me, resetPassword, signup } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.post("/signup", signup);
router.post("/faculty-signup", facultySignup);
router.post("/hod-signup", hodSignup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, me);

export default router;
