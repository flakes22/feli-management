import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Participant from "../models/Participant.js";
import Organizer from "../models/Organizer.js";
import Admin from "../models/Admin.js";

const generateToken=(user)=>{
    return jwt.sign({
        id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
    );
};

// Participant registration

export const registerParticipant = async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        participantType,
        collegeName,
        contactNumber,
      } = req.body;
  
      if (
        participantType === "IIIT" &&
        !email.endsWith("@students.iiit.ac.in" || "@research.iiit.ac.in")
      ) {
        return res.status(400).json({
          message: "IIIT participants must use IIIT email",
        });
      }
  
      const existing = await Participant.findOne({ email });
      if (existing) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const participant = await Participant.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        participantType,
        collegeName,
        contactNumber,
      });
  
      const token = generateToken(participant);
  
      res.status(201).json({
        message: "Registration successful",
        token,
        role: participant.role,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Login
  export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      let user = await Participant.findOne({ email });
  
      if (!user) {
        user = await Organizer.findOne({
          $or: [{ loginEmail: email }, { email }],
        });
      }
  
      if (!user) {
        user = await Admin.findOne({ email });
      }
  
      if (!user) {
        return res.status(400).json({
          message: "Invalid credentials",
        });
      }
  
      if (user.role === "organizer" && !user.isActive) {
        return res.status(403).json({
          message: "Organizer account disabled",
        });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid credentials",
        });
      }
  
      const token = generateToken(user);
  
      res.json({
        message: "Login successful",
        token,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
