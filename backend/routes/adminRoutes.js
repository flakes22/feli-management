import express from "express";
import {
  createOrganizer,
  getAllOrganizers,
  toggleOrganizerStatus,
  getPasswordResetRequests,
  handlePasswordResetRequest,
} from "../controllers/adminController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only routes
router.post(
  "/create-organizer",
  protect,
  authorize("admin"),
  createOrganizer
);

router.get(
  "/organizers",
  protect,
  authorize("admin"),
  getAllOrganizers
);

router.patch(
  "/toggle-organizer/:id",
  protect,
  authorize("admin"),
  toggleOrganizerStatus
);

// ── Password Reset Requests ──
router.get("/password-requests", protect, authorize("admin"), getPasswordResetRequests);
router.patch(
  "/password-reset-requests/:organizerId/:requestId",
  protect,
  authorize("admin"),
  handlePasswordResetRequest
);

export default router;
