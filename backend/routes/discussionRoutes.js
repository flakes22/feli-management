import express from "express";
import {
  getMessages,
  createMessage,
  deleteMessage,
  pinMessage,
  reactToMessage,
} from "../controllers/discussionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:eventId", protect, getMessages);
router.post("/", protect, createMessage);
router.delete("/:id", protect, deleteMessage);
router.patch("/:id/pin", protect, pinMessage);
router.patch("/:id/react", protect, reactToMessage);

export default router;
