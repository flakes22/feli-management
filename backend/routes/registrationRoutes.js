import express from "express";
import {
  registerForEvent,
  purchaseMerch,
  myRegistrations,
} from "../controllers/registrationController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  protect,
  authorize("participant"),
  registerForEvent
);

router.post(
  "/purchase",
  protect,
  authorize("participant"),
  purchaseMerch
);

router.get(
  "/my-registrations",
  protect,
  authorize("participant"),
  myRegistrations
);

export default router;
