import express from "express";
import {createOrganizer,getAllOrganizers,toggleOrganizerStatus} from "../controllers/adminController.js";

import {protect,authorize} from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only routes
router.post(
  "/create-organizer",
  protect,
  authorize("admin"),
  createOrganizer
);

router.get(
  "/organizers",
  protect,
  authorize("admin"),
  getAllOrganizers
);

router.patch(
  "/toggle-organizer/:id",
  protect,
  authorize("admin"),
  toggleOrganizerStatus
);

export default router;
