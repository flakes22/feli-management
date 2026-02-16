import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Organizer from "../models/Organizer.js";
import Participant from "../models/Participant.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on role
    let user;
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
    } else if (decoded.role === "organizer") {
      user = await Organizer.findById(decoded.id).select("-password");
    } else if (decoded.role === "participant") {
      user = await Participant.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = { ...user._doc, id: user._id, role: decoded.role };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
