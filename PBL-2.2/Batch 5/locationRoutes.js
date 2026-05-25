import { Router } from "express";
import { listCampusZones, liveBranchLocations, updateLocation } from "../controllers/locationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/zones", protect, listCampusZones);
router.get("/live", protect, liveBranchLocations);
router.post("/update", protect, allowRoles("student"), updateLocation);

export default router;
