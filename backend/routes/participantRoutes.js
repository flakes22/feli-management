import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  browseEvents,
  getEventDetails,
  getTrendingEvents,
  getClubs,
  getClubDetails,
  toggleFollow,
  getProfile,
  updateProfile,
  changePassword,
  getEventRegistrationForm,
  registerForEvent,
} from "../controllers/participantController.js";

const router = express.Router();

router.get("/browse", protect, authorize("participant"), browseEvents);
router.get("/trending", protect, authorize("participant"), getTrendingEvents);
router.get("/event/:eventId", protect, authorize("participant"), getEventDetails);
router.get("/clubs", protect, authorize("participant"), getClubs);
router.get("/club/:organizerId", protect, authorize("participant"), getClubDetails);
router.post("/follow/:organizerId", protect, authorize("participant"), toggleFollow);
router.get("/profile", protect, authorize("participant"), getProfile);
router.put("/profile", protect, authorize("participant"), updateProfile);
router.put("/change-password", protect, authorize("participant"), changePassword);

// Get event registration form (includes custom form fields)
router.get(
  "/events/:eventId/registration-form",
  protect,
  authorize("participant"),
  getEventRegistrationForm
);

// Register for event
router.post(
  "/events/:eventId/register",
  protect,
  authorize("participant"),
  registerForEvent
);

export default router;