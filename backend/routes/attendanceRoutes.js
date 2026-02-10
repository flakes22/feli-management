import express from "express";
import {
  scanAttendance,
  getAttendanceStats,
  exportAttendanceCSV,
  manualAttendanceOverride,
} from "../controllers/attendanceController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/scan",
  protect,
  authorize("organizer"),
  scanAttendance
);

router.get(
  "/stats/:eventId",
  protect,
  authorize("organizer"),
  getAttendanceStats
);

router.get(
  "/export/:eventId",
  protect,
  authorize("organizer"),
  exportAttendanceCSV
);

router.patch(
  "/manual/:registrationId",
  protect,
  authorize("organizer"),
  manualAttendanceOverride
);

export default router;
