import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js";
import participantRoutes from "./routes/participantRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import organizerEventRoutes from "./routes/organizerEventRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

const allowedOrigins = [
  "http://localhost:5173",                        // local dev
  "https://feli-management.vercel.app",             // your actual Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer/event", organizerEventRoutes); // Must be before /api/organizer
app.use("/api/organizer", organizerRoutes);
app.use("/api/participant", participantRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/discussions", discussionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Felicity Event Management API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});
