import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import https from "https";

import Participant from "../models/Participant.js";
import Organizer from "../models/Organizer.js";
import Admin from "../models/Admin.js";

const normalizeInterests = (interests = []) => {
  if (!Array.isArray(interests)) return [];

  const seen = new Set();
  const normalized = [];
  for (const interest of interests) {
    const cleaned = String(interest || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(cleaned);
  }
  return normalized.slice(0, 20);
};

const verifyCaptcha = (token) => {
  return new Promise((resolve) => {
    if (!token) return resolve(false);
    const secret = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
    const data = `secret=${secret}&response=${token}`;

    const options = {
      hostname: "www.google.com",
      port: 443,
      path: "/recaptcha/api/siteverify",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    };

    const request = https.request(options, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.success === true);
        } catch (e) {
          resolve(false);
        }
      });
    });

    request.on("error", () => resolve(false));
    request.write(data);
    request.end();
  });
};

const generateToken = (user) => {
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
      interests,
      captchaToken,
    } = req.body;

    const isValidCaptcha = await verifyCaptcha(captchaToken);
    if (!isValidCaptcha) {
      return res.status(400).json({
        message: "Captcha verification failed. Please try again.",
      });
    }

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
      interests: normalizeInterests(interests),
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
    const { email, password, captchaToken } = req.body;

    const isValidCaptcha = await verifyCaptcha(captchaToken);
    if (!isValidCaptcha) {
      return res.status(400).json({
        message: "Captcha verification failed. Please try again.",
      });
    }

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
