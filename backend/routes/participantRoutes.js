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

export default router;