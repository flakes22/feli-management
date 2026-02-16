import express from "express";
import {
  createEvent,
  publishEvent,
  editEvent,
  getMyEvents,
  getDashboard,
  getProfile,
  updateProfile,
  requestPasswordReset,
} from "../controllers/organizerController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-event",
  protect,
  authorize("organizer"),
  createEvent
);

router.patch(
  "/publish-event/:id",
  protect,
  authorize("organizer"),
  publishEvent
);

router.patch(
  "/edit-event/:id",
  protect,
  authorize("organizer"),
  editEvent
);

router.get(
  "/my-events",
  protect,
  authorize("organizer"),
  getMyEvents
);

router.get("/dashboard", protect, authorize("organizer"), getDashboard);
router.get("/profile", protect, authorize("organizer"), getProfile);
router.put("/profile", protect, authorize("organizer"), updateProfile);
router.post("/request-password-reset", protect, authorize("organizer"), requestPasswordReset);

export default router;
