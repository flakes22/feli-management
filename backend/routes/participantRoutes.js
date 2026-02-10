import express from "express";
import {
  browseEvents,
  trendingEvents,
} from "../controllers/participantController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/browse",
  protect,
  authorize("participant"),
  browseEvents
);

router.get(
  "/trending",
  protect,
  authorize("participant"),
  trendingEvents
);

export default router;
