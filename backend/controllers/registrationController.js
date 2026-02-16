import Event from "../models/Event.js";
import Participant from "../models/Participant.js";
import Registration from "../models/Registration.js";
import QRCode from "qrcode";

// Normal event registration

export const registerForEvent = async (req, res) => {
  try {
    const { eventId, customFieldResponses } = req.body;
    const participantId = req.user.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event is published
    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Event is not open for registration" });
    }

    // Check deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    // Check registration limit
    const totalRegs = await Registration.countDocuments({
      eventId,
      status: { $ne: "CANCELLED" },
    });

    if (event.registrationLimit && totalRegs >= event.registrationLimit) {
      return res.status(400).json({ message: "Registration limit reached" });
    }

    // Check if already registered
    const existing = await Registration.findOne({
      participantId,
      eventId,
      status: { $ne: "CANCELLED" },
    });

    if (existing) {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    // Validate custom fields
    if (event.customFields && event.customFields.length > 0) {
      for (const field of event.customFields) {
        if (field.required) {
          const response = customFieldResponses?.find(
            (r) => r.fieldLabel === field.label
          );
          if (!response || !response.response) {
            return res.status(400).json({
              message: `${field.label} is required`,
            });
          }
        }
      }
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Generate QR code
    const qrData = JSON.stringify({ eventId, participantId, ticketNumber });
    const qrCode = await QRCode.toDataURL(qrData);

    // Create registration
    const registration = new Registration({
      participantId,
      eventId,
      status: "REGISTERED",
      ticketNumber,
      qrCode,
      customFieldResponses: customFieldResponses || [],
    });

    await registration.save();

    // Update event registration count
    event.registrationCount = (event.registrationCount || 0) + 1;
    await event.save();

    res.status(201).json({
      message: "Registration successful",
      registration: {
        _id: registration._id,
        ticketNumber,
        qrCode,
        status: registration.status,
      },
    });
  } catch (err) {
    console.error("registerForEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Merch Registration
export const purchaseMerch = async (req, res) => {
  try {
    const { eventId, customFieldResponses } = req.body;
    const participantId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.type !== "MERCH") {
      return res.status(404).json({ message: "Merchandise not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Merchandise not available" });
    }

    // Check stock
    if (event.stock !== undefined && event.stock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    // Check if already purchased
    const existing = await Registration.findOne({
      participantId,
      eventId,
      status: { $ne: "CANCELLED" },
    });

    if (existing) {
      return res.status(400).json({ message: "Already purchased this item" });
    }

    const ticketNumber = `MERCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrData = JSON.stringify({ eventId, participantId, ticketNumber });
    const qrCode = await QRCode.toDataURL(qrData);

    const registration = new Registration({
      participantId,
      eventId,
      status: "REGISTERED",
      ticketNumber,
      qrCode,
      customFieldResponses: customFieldResponses || [],
    });

    await registration.save();

    // Decrement stock
    if (event.stock !== undefined) {
      event.stock -= 1;
    }
    event.registrationCount = (event.registrationCount || 0) + 1;
    await event.save();

    res.status(201).json({
      message: "Purchase successful",
      registration: {
        _id: registration._id,
        ticketNumber,
        qrCode,
        status: registration.status,
      },
    });
  } catch (err) {
    console.error("purchaseMerch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Participation History

export const getParticipantDashboard = async (req, res) => {
  try {
    const participantId = req.user.id;

    const registrations = await Registration.find({ participantId })
      .populate({
        path: "eventId",
        populate: { path: "organizerId", select: "name category" },
      })
      .sort({ registeredAt: -1 });

    const upcoming = registrations.filter(
      (reg) =>
        reg.eventId &&
        reg.status === "REGISTERED" &&
        new Date(reg.eventId.startDate) >= new Date()
    );

    const past = registrations.filter(
      (reg) =>
        reg.eventId &&
        (reg.status === "ATTENDED" || new Date(reg.eventId.endDate) < new Date())
    );

    res.json({ upcoming, past });
  } catch (err) {
    console.error("getParticipantDashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const participantId = req.user.id;

    const registration = await Registration.findOne({
      _id: registrationId,
      participantId,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    if (registration.status === "ATTENDED") {
      return res.status(400).json({ message: "Cannot cancel after attendance" });
    }

    registration.status = "CANCELLED";
    await registration.save();

    // Update event count
    const event = await Event.findById(registration.eventId);
    if (event) {
      event.registrationCount = Math.max(0, (event.registrationCount || 1) - 1);
      if (event.type === "MERCH" && event.stock !== undefined) {
        event.stock += 1;
      }
      await event.save();
    }

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("cancelRegistration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
