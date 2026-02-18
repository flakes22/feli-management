import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js";
import participantRoutes from "./routes/participantRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import organizerEventRoutes from "./routes/organizerEventRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";


dotenv.config();

const app=express();
const PORT= process.env.PORT || 5001;

connectDB();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend-domain.vercel.app"
  ],
  credentials: true
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

app.get("/", (req, res) => {
    res.json({ message: "Felicity Event Management API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
});