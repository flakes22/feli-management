import express from "express";
import {
  browseEvents,
  trendingEvents,
  getEventDetails,
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getAllClubs,
  getClubDetails,
  followOrganizer,
  unfollowOrganizer,
  getMyProfile,
  updateMyProfile,
  changePassword,
} from "../controllers/participantController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Browse and trending events
router.get("/browse", protect, authorize("participant"), browseEvents);
router.get("/trending", protect, authorize("participant"), trendingEvents);

// Event details and registration
router.get("/event/:eventId", protect, authorize("participant"), getEventDetails);
router.post("/register/:eventId", protect, authorize("participant"), registerForEvent);
router.get("/registrations", protect, authorize("participant"), getMyRegistrations);
router.patch("/cancel/:registrationId", protect, authorize("participant"), cancelRegistration);

// Clubs/Organizers
router.get("/clubs", protect, authorize("participant"), getAllClubs);
router.get("/club/:organizerId", protect, authorize("participant"), getClubDetails);
router.post("/follow/:organizerId", protect, authorize("participant"), followOrganizer);
router.delete("/unfollow/:organizerId", protect, authorize("participant"), unfollowOrganizer);

// Profile management
router.get("/profile", protect, authorize("participant"), getMyProfile);
router.put("/profile", protect, authorize("participant"), updateMyProfile);
router.put("/change-password", protect, authorize("participant"), changePassword);

export default router;