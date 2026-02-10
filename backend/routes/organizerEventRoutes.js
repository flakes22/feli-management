import express from "express";
import {
  getEventDetail,
  getParticipants,
  exportParticipantsCSV,
} from "../controllers/organizerEventController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/event/:eventId",
  protect,
  authorize("organizer"),
  getEventDetail
);

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