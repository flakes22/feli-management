import express from "express";
import { registerParticipant, login} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerParticipant);
router.post("/login", login);

export default router;
