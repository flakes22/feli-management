import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import QRCode from "qrcode";
import Participant from "../models/Participant.js";
import { sendTicketEmail } from "../utils/mailer.js";

// Normal event registration

export const registerForEvent = async (req, res) => {
  try {
    const { eventId, formResponses } = req.body;
    const participantId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID required" });
    }

    const event = await Event.findById(eventId);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Ensure it is NORMAL event
    if (event.type !== "NORMAL")
      return res.status(400).json({
        message: "This is not a normal event",
      });

    if (event.status !== "PUBLISHED")
      return res.status(400).json({ message: "Event not open" });

    if (
      event.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline)
    )
      return res.status(400).json({ message: "Deadline passed" });

    // Check duplicate registration
    const existing = await Registration.findOne({
      participantId,
      eventId,
    });

    if (existing)
      return res.status(400).json({
        message: "Already registered",
      });

    // Check registration limit
    const totalRegs = await Registration.countDocuments({
      eventId,
    });

    if (
      event.registrationLimit &&
      totalRegs >= event.registrationLimit
    )
      return res.status(400).json({
        message: "Registration limit reached",
      });

    // Generate ticket ID
    const ticketId =
      "TICKET-" +
      Date.now() +
      "-" +
      Math.floor(Math.random() * 1000);

    // Generate QR
    const qrData = {
      ticketId,
      eventId,
      participantId,
    };

    const qrCode = await QRCode.toDataURL(
      JSON.stringify(qrData)
    );

    const registration = await Registration.create({
      participantId,
      eventId,
      ticketId,
      qrCode,
      formResponses,
    });

    // Send Email (SAFE WRAPPED)
    try {
      const participant = await Participant.findById(
        participantId
      );

      if (participant?.email) {
        await sendTicketEmail({
          to: participant.email,
          eventName: event.name,
          ticketId,
          qrCode,
        });
      }
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    res.status(201).json({
      message: "Registered successfully",
      registration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Merch Registration
export const purchaseMerch = async (req, res) => {
  try {
    const { eventId } = req.body;
    const participantId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID required" });
    }

    const event = await Event.findById(eventId);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.type !== "MERCH")
      return res.status(400).json({
        message: "Not a merchandise event",
      });

    if (event.status !== "PUBLISHED")
      return res.status(400).json({
        message: "Event not open",
      });

    if (!event.stock || event.stock <= 0)
      return res.status(400).json({
        message: "Out of stock",
      });

    // Check purchase limit
    const purchaseCount = await Registration.countDocuments({
      participantId,
      eventId,
    });

    if (
      event.purchaseLimit &&
      purchaseCount >= event.purchaseLimit
    )
      return res.status(400).json({
        message: "Purchase limit reached",
      });

    // Decrement stock safely
    event.stock -= 1;
    await event.save();

    const ticketId =
      "MERCH-" +
      Date.now() +
      "-" +
      Math.floor(Math.random() * 1000);

    const qrCode = await QRCode.toDataURL(
      JSON.stringify({ ticketId, eventId })
    );

    const registration = await Registration.create({
      participantId,
      eventId,
      ticketId,
      qrCode,
    });

    // Send Email (SAFE WRAPPED)
    try {
      const participant = await Participant.findById(
        participantId
      );

      if (participant?.email) {
        await sendTicketEmail({
          to: participant.email,
          eventName: event.name,
          ticketId,
          qrCode,
        });
      }
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    res.status(201).json({
      message: "Purchase successful",
      registration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Participation History


export const myRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participantId: req.user.id,
    })
      .populate("eventId")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
