import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  registerForEvent,
  purchaseMerch,
  getParticipantDashboard,
  cancelRegistration,
} from "../controllers/registrationController.js";

const router = express.Router();

router.post("/register", protect, authorize("participant"), registerForEvent);
router.post("/merch", protect, authorize("participant"), purchaseMerch);
router.get("/dashboard", protect, authorize("participant"), getParticipantDashboard);
router.delete("/:registrationId", protect, authorize("participant"), cancelRegistration);

export default router;
