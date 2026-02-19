import crypto from "crypto";

import Organizer from "../models/Organizer.js";
import Participant from "../models/Participant.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

// Create an organizer
export const createOrganizer = async (req, res) => {
    try {
      const { name, category, description, contactEmail } = req.body;
  
      if (!name || !contactEmail) {
        return res.status(400).json({
          message: "Name and Contact Email are required",
        });
      }
  
      // Auto-generate login email
      const loginEmail =
        name.toLowerCase().replace(/\s+/g, "") + "@felicity.com";
  
      const existing = await Organizer.findOne({
        $or: [{ email: contactEmail }, { loginEmail }],
      });
      if (existing) {
        return res.status(400).json({
          message: "Organizer already exists (email or login email in use)",
        });
      }
  
      // Generate random password
      const plainPassword = crypto
        .randomBytes(6)
        .toString("hex");
  
      const organizer = await Organizer.create({
        name,
        category,
        description,
        email: contactEmail,
        loginEmail,
        // Keep plain here; Organizer pre-save hook hashes once.
        password: plainPassword,
      });
  
      res.status(201).json({
        message: "Organizer created successfully",
        organizer: {
          id: organizer._id,
          name: organizer.name,
          loginEmail: organizer.loginEmail,
          generatedPassword: plainPassword, // Admin shares this
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Get all the organizers
export const getAllOrganizers = async (req, res) => {
    try {
      const organizers = await Organizer.find().select(
        "-password"
      );
      res.json(organizers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// Disable organizer

export const toggleOrganizerStatus = async (req, res) => {
    try {
      const { id } = req.params;
  
      const organizer = await Organizer.findById(id);
  
      if (!organizer) {
        return res.status(404).json({
          message: "Organizer not found",
        });
      }
      organizer.isActive = !organizer.isActive;
      await organizer.save();
  
      res.json({
        message: `Organizer ${
          organizer.isActive ? "Enabled" : "Disabled"
        } successfully`,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// ── Get All Password Reset Requests ──
export const getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query;

    // ✅ Must explicitly select passwordResetRequests — not excluded by default now
    const organizers = await Organizer.find({
      "passwordResetRequests.0": { $exists: true },
    }).select("name email category passwordResetRequests");

    const requests = [];
    organizers.forEach((org) => {
      org.passwordResetRequests.forEach((r) => {
        if (status && status !== "all" && r.status !== status) return;
        requests.push({
          requestId: r._id,
          organizerId: org._id,
          organizerName: org.name,
          organizerEmail: org.email,
          organizerCategory: org.category,
          reason: r.reason,
          status: r.status,
          adminNote: r.adminNote,
          appliedByOrganizer: r.appliedByOrganizer,
          requestedAt: r.requestedAt,
          resolvedAt: r.resolvedAt,
        });
      });
    });

    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    res.json({ requests });
  } catch (error) {
    console.error("getPasswordResetRequests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Approve / Reject Password Reset Request ──
export const handlePasswordResetRequest = async (req, res) => {
  try {
    const { organizerId, requestId } = req.params;
    const { action, adminNote } = req.body;

    if (!["APPROVE", "REJECT"].includes(action))
      return res.status(400).json({ message: "Action must be APPROVE or REJECT." });

    const organizer = await Organizer.findById(organizerId);
    if (!organizer)
      return res.status(404).json({ message: "Organizer not found." });

    const request = organizer.passwordResetRequests.id(requestId);
    if (!request)
      return res.status(404).json({ message: "Request not found." });
    if (request.status !== "PENDING")
      return res.status(400).json({ message: "This request has already been resolved." });

    // ✅ Use updateOne with arrayFilters — avoids triggering pre('save') on password
    await Organizer.updateOne(
      { _id: organizerId, "passwordResetRequests._id": requestId },
      {
        $set: {
          "passwordResetRequests.$.status": action === "APPROVE" ? "APPROVED" : "REJECTED",
          "passwordResetRequests.$.adminNote": adminNote || "",
          "passwordResetRequests.$.resolvedAt": new Date(),
        },
      }
    );

    res.json({
      message: `Request ${action === "APPROVE" ? "approved" : "rejected"} successfully.`,
    });
  } catch (error) {
    console.error("handlePasswordResetRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};
