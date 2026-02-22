import express from "express";
import {
  createEvent,
  getMyEvents,
  getOngoingEvents,
  getEventDetail,
  updateEvent,
  publishEvent,
  deleteEvent,
  getOrganizerProfile,
  updateOrganizerProfile,
  getOrganizerStats,
  requestPasswordReset,
  getMyPasswordResetStatus,
  applyApprovedPassword,
} from "../controllers/organizerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Events ──
router.post("/events", protect, authorize("organizer"), createEvent);
router.get("/events", protect, authorize("organizer"), getMyEvents);
router.get("/ongoing-events", protect, authorize("organizer"), getOngoingEvents);
router.get("/ongoing", protect, authorize("organizer"), getOngoingEvents);
router.get("/events/:eventId", protect, authorize("organizer"), getEventDetail);
router.put("/events/:eventId", protect, authorize("organizer"), updateEvent);
router.patch("/events/:eventId/publish", protect, authorize("organizer"), publishEvent);
router.delete("/events/:eventId", protect, authorize("organizer"), deleteEvent);

// ── Profile ──
router.get("/profile", protect, authorize("organizer"), getOrganizerProfile);
router.put("/profile", protect, authorize("organizer"), updateOrganizerProfile);
router.get("/stats", protect, authorize("organizer"), getOrganizerStats);

// ── Password Reset ──
router.post("/request-password-reset", protect, authorize("organizer"), requestPasswordReset);
router.get("/password-reset-status", protect, authorize("organizer"), getMyPasswordResetStatus);
router.patch("/apply-password/:requestId", protect, authorize("organizer"), applyApprovedPassword);

export default router;
