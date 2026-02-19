import Event from "../models/Event.js";
import Participant from "../models/Participant.js";
import Registration from "../models/Registration.js";
import QRCode from "qrcode";
import { sendTicketEmail } from "../utils/sendEmail.js";

const handleRegistrationDuplicateError = (err, res, action = "register") => {
  if (err?.code !== 11000) return false;

  const duplicateField = Object.keys(err?.keyPattern || {})[0] || "unknown";
  console.error(`Duplicate key while trying to ${action}:`, {
    duplicateField,
    keyValue: err?.keyValue,
  });

  if (duplicateField === "participantId" || duplicateField === "eventId") {
    return res.status(500).json({
      message:
        "Registration index conflict in database. Please contact admin to refresh registration indexes.",
    });
  }

  return res.status(400).json({
    message: "Duplicate registration data detected. Please try again.",
  });
};

// ── Normal Event Registration ──
export const registerForEvent = async (req, res) => {
  try {
    const { eventId, customFieldResponses } = req.body;
    const participantId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status !== "PUBLISHED")
      return res.status(400).json({ message: "Event is not open for registration" });

    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())
      return res.status(400).json({ message: "Registration deadline has passed" });

    const totalRegs = await Registration.countDocuments({
      eventId,
      status: { $ne: "CANCELLED" },
    });
    if (event.registrationLimit && totalRegs >= event.registrationLimit)
      return res.status(400).json({ message: "Registration limit reached" });

    // ✅ Only block if there's already an ACTIVE registration
    // (CANCELLED ones are fine — allows re-registration after cancellation)
    const existing = await Registration.findOne({
      participantId,
      eventId,
      status: { $in: ["REGISTERED", "ATTENDED"] }, // ← was $ne: "CANCELLED", same effect but explicit
    });
    if (existing)
      return res.status(400).json({ message: "Already registered for this event" });

    // Validate custom fields
    if (event.customFields && event.customFields.length > 0) {
      for (const field of event.customFields) {
        if (field.required) {
          const response = customFieldResponses?.find((r) => r.fieldLabel === field.label);
          if (!response || !response.response)
            return res.status(400).json({ message: `${field.label} is required` });
        }
      }
    }

    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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

    event.registrationCount = (event.registrationCount || 0) + 1;
    await event.save();

    // ── Send ticket email (non-blocking — don't fail registration if email fails) ──
    try {
      const participant = await Participant.findById(participantId).select(
        "firstName lastName email"
      );

      if (participant?.email) {
        const eventDate = event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "TBA";

        await sendTicketEmail({
          toEmail: participant.email,
          participantName: `${participant.firstName} ${participant.lastName}`,
          eventName: event.title || event.name,
          eventDate,
          eventVenue: event.venue || event.location || "",
          ticketNumber,
          qrCodeDataUrl: qrCode,
        });
      }
    } catch (emailErr) {
      // Log but do NOT fail the registration
      console.error("Ticket email failed (registration still successful):", emailErr.message);
    }

    res.status(201).json({
      message: "Registration successful! A confirmation email with your ticket has been sent.",
      registration: {
        _id: registration._id,
        ticketNumber,
        qrCode,
        status: registration.status,
      },
    });
  } catch (err) {
    if (handleRegistrationDuplicateError(err, res, "register for event")) return;
    console.error("registerForEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Merch Purchase ──
export const purchaseMerch = async (req, res) => {
  try {
    const { eventId, customFieldResponses } = req.body;
    const participantId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.type !== "MERCH")
      return res.status(404).json({ message: "Merchandise not found" });

    if (event.status !== "PUBLISHED")
      return res.status(400).json({ message: "Merchandise not available" });

    if (event.stock !== undefined && event.stock <= 0)
      return res.status(400).json({ message: "Out of stock" });

    const existing = await Registration.findOne({
      participantId,
      eventId,
      status: { $ne: "CANCELLED" },
    });
    if (existing)
      return res.status(400).json({ message: "Already purchased this item" });

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

    if (event.stock !== undefined) event.stock -= 1;
    event.registrationCount = (event.registrationCount || 0) + 1;
    await event.save();

    // ── Send purchase confirmation email ──
    try {
      const participant = await Participant.findById(participantId).select(
        "firstName lastName email"
      );

      if (participant?.email) {
        await sendTicketEmail({
          toEmail: participant.email,
          participantName: `${participant.firstName} ${participant.lastName}`,
          eventName: event.title || event.name,
          eventDate: "N/A (Merchandise)",
          eventVenue: "",
          ticketNumber,
          qrCodeDataUrl: qrCode,
        });
      }
    } catch (emailErr) {
      console.error("Merch email failed (purchase still successful):", emailErr.message);
    }

    res.status(201).json({
      message: "Purchase successful! A confirmation email has been sent.",
      registration: {
        _id: registration._id,
        ticketNumber,
        qrCode,
        status: registration.status,
      },
    });
  } catch (err) {
    if (handleRegistrationDuplicateError(err, res, "purchase merch")) return;
    console.error("purchaseMerch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Participation History (unchanged) ──
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

// ── Cancel Registration (unchanged) ──
export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const participantId = req.user.id;

    const registration = await Registration.findOne({ _id: registrationId, participantId });
    if (!registration)
      return res.status(404).json({ message: "Registration not found" });

    if (registration.status === "CANCELLED")
      return res.status(400).json({ message: "Already cancelled" });

    if (registration.status === "ATTENDED")
      return res.status(400).json({ message: "Cannot cancel after attendance" });

    registration.status = "CANCELLED";
    await registration.save();

    const event = await Event.findById(registration.eventId);
    if (event) {
      event.registrationCount = Math.max(0, (event.registrationCount || 1) - 1);
      if (event.type === "MERCH" && event.stock !== undefined) event.stock += 1;
      await event.save();
    }

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("cancelRegistration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
