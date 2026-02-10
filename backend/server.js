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

app.use("/api/registration", registrationRoutes);


dotenv.config();

const app=express();
const PORT= process.env.PORT || 5001;

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizer", organizerEventRoutes);

app.use("/api/organizer", organizerRoutes);
app.use("/api/participant", participantRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
    res.send("Felicity Event Management Backend Running");
});

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
});