import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventDetail,
  getOngoingEvents,
  getParticipants,
  exportParticipantsCSV,
} from "../controllers/organizerEventController.js";

const router = express.Router();

router.post("/event", protect, authorize("organizer"), createEvent);
router.put("/event/:eventId", protect, authorize("organizer"), updateEvent);
router.delete("/event/:eventId", protect, authorize("organizer"), deleteEvent);
router.get("/event/:eventId", protect, authorize("organizer"), getEventDetail);
router.get("/ongoing", protect, authorize("organizer"), getOngoingEvents);
router.get(
  "/event/:eventId/participants",
  protect,
  authorize("organizer"),
  getParticipants
);
router.get(
  "/event/:eventId/export",
  protect,
  authorize("organizer"),
  exportParticipantsCSV
);

export default router;