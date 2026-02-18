import express from "express";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventDetail,
  getOngoingEvents,
  getParticipants,
  exportParticipantsCSV,
} from "../controllers/organizerEventController.js";

import {
  getMyEvents,
  getOrganizerProfile,
  updateOrganizerProfile,
  changePassword,
  getOrganizerStats,
} from "../controllers/organizerController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Event Management ──
router.post("/events", protect, authorize("organizer"), createEvent);
router.get("/events", protect, authorize("organizer"), getMyEvents);
router.get("/events/ongoing", protect, authorize("organizer"), getOngoingEvents);
router.get("/events/:eventId", protect, authorize("organizer"), getEventDetail);
router.put("/events/:eventId", protect, authorize("organizer"), updateEvent);
router.delete("/events/:eventId", protect, authorize("organizer"), deleteEvent);

// ── Participants ──
router.get("/events/:eventId/participants", protect, authorize("organizer"), getParticipants);
router.get("/events/:eventId/export", protect, authorize("organizer"), exportParticipantsCSV);

// ── Profile ──
router.get("/profile", protect, authorize("organizer"), getOrganizerProfile);
router.put("/profile", protect, authorize("organizer"), updateOrganizerProfile);
router.put("/change-password", protect, authorize("organizer"), changePassword);
router.get("/stats", protect, authorize("organizer"), getOrganizerStats);

export default router;
