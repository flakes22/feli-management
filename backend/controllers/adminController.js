import bcrypt from "bcrypt";
import crypto from "crypto";

import Organizer from "../models/Organizer.js";

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
  
      const existing = await Organizer.findOne({ loginEmail });
      if (existing) {
        return res.status(400).json({
          message: "Organizer already exists",
        });
      }
  
      // Generate random password
      const plainPassword = crypto
        .randomBytes(6)
        .toString("hex");
  
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
      const organizer = await Organizer.create({
        name,
        category,
        description,
        contactEmail,
        loginEmail,
        password: hashedPassword,
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
  