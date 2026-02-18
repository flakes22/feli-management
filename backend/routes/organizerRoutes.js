import express from "express";
import {
  createEvent,
  getMyEvents,
  getEventDetail,
  updateEvent,
  publishEvent,
  deleteEvent,
  getOrganizerProfile,
  updateOrganizerProfile,
  changePassword,
  getOrganizerStats,
} from "../controllers/organizerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Events ──
router.post("/events", protect, authorize("organizer"), createEvent);
router.get("/events", protect, authorize("organizer"), getMyEvents);
router.get("/events/:eventId", protect, authorize("organizer"), getEventDetail);
router.put("/events/:eventId", protect, authorize("organizer"), updateEvent);
router.patch("/events/:eventId/publish", protect, authorize("organizer"), publishEvent);
router.delete("/events/:eventId", protect, authorize("organizer"), deleteEvent);

// ── Profile ──
router.get("/profile", protect, authorize("organizer"), getOrganizerProfile);
router.put("/profile", protect, authorize("organizer"), updateOrganizerProfile);
router.put("/change-password", protect, authorize("organizer"), changePassword);
router.get("/stats", protect, authorize("organizer"), getOrganizerStats);

export default router;
