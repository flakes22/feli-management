import express from "express";
import {
  createEvent,
  publishEvent,
  editEvent,
  getMyEvents,
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

export default router;
