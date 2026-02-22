import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { Parser } from "json2csv";
import AuditLog from "../models/AuditLog.js";

const parseQRPayload = (rawValue) => {
  if (!rawValue || typeof rawValue !== "string") return {};
  const trimmed = rawValue.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // Not JSON. Treat as direct ticket code.
  }
  return { ticketNumber: trimmed };
};

// Scan QR and mark attendance
export const scanAttendance = async (req, res) => {
  try {
    const { ticketId, ticketNumber, qrData, eventId: requestEventId } = req.body;
    const organizerId = req.user.id;

    const payload = parseQRPayload(qrData);
    const resolvedTicketNumber =
      (ticketNumber || "").trim() ||
      (ticketId || "").trim() ||
      (payload.ticketNumber || "").trim() ||
      (payload.ticketId || "").trim();

    if (!resolvedTicketNumber) {
      return res.status(400).json({ message: "Ticket ID required" });
    }

    const registration = await Registration.findOne({ ticketNumber: resolvedTicketNumber })
      .populate("participantId", "firstName lastName email")
      .populate("attendanceMarkedBy", "name");

    if (!registration) {
      return res.status(404).json({ message: "Invalid ticket" });
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found for this ticket" });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: "Not your event" });
    }

    const expectedEventId = requestEventId || payload.eventId;
    if (
      expectedEventId &&
      registration.eventId.toString() !== expectedEventId.toString()
    ) {
      return res.status(400).json({ message: "Ticket does not belong to this event" });
    }

    const alreadyMarked =
      registration.attendanceMarked ||
      registration.status === "ATTENDED" ||
      !!registration.attendanceTime;

    if (alreadyMarked) {
      await AuditLog.create({
        eventId: event._id,
        registrationId: registration._id,
        performedBy: organizerId,
        action: "QR_SCAN_DUPLICATE",
        metadata: {
          ticketNumber: resolvedTicketNumber,
          previousAttendanceTime: registration.attendanceTime,
        },
      });

      return res.status(409).json({
        message: "Attendance already marked",
        duplicate: true,
        attendanceTime: registration.attendanceTime,
        registrationId: registration._id,
        ticketNumber: registration.ticketNumber,
        participant: registration.participantId,
      });
    }

    registration.attendanceMarked = true;
    registration.attendanceTime = new Date();
    registration.attendanceMarkedBy = organizerId;
    registration.status = "ATTENDED";
    await registration.save();

    await AuditLog.create({
      eventId: event._id,
      registrationId: registration._id,
      performedBy: organizerId,
      action: "QR_SCAN_SUCCESS",
      metadata: {
        ticketNumber: registration.ticketNumber,
      },
    });

    return res.json({
      message: "Attendance marked successfully",
      attendanceTime: registration.attendanceTime,
      duplicate: false,
      registrationId: registration._id,
      ticketNumber: registration.ticketNumber,
      participant: registration.participantId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Live attendance stats
export const getAttendanceStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: "Not your event" });
    }

    const registrations = await Registration.find({
      eventId,
      status: { $ne: "CANCELLED" },
    })
      .populate("participantId", "firstName lastName email")
      .populate("attendanceMarkedBy", "name")
      .sort({ attendanceTime: -1, createdAt: -1 });

    const scannedParticipants = registrations
      .filter((r) => r.attendanceMarked || r.status === "ATTENDED" || r.attendanceTime)
      .map((r) => ({
        registrationId: r._id,
        participantId: r.participantId?._id,
        name: `${r.participantId?.firstName || ""} ${r.participantId?.lastName || ""}`.trim(),
        email: r.participantId?.email || "",
        ticketNumber: r.ticketNumber,
        attendanceTime: r.attendanceTime,
        markedBy: r.attendanceMarkedBy?.name || null,
      }));

    const pendingParticipants = registrations
      .filter((r) => !(r.attendanceMarked || r.status === "ATTENDED" || r.attendanceTime))
      .map((r) => ({
        registrationId: r._id,
        participantId: r.participantId?._id,
        name: `${r.participantId?.firstName || ""} ${r.participantId?.lastName || ""}`.trim(),
        email: r.participantId?.email || "",
        ticketNumber: r.ticketNumber,
      }));

    return res.json({
      eventId: event._id,
      eventName: event.name || event.title,
      total: registrations.length,
      attended: scannedParticipants.length,
      notAttended: pendingParticipants.length,
      scannedParticipants,
      pendingParticipants,
      updatedAt: new Date(),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// export attendance csv

export const exportAttendanceCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: "Not your event" });
    }

    const registrations = await Registration.find({ eventId, status: { $ne: "CANCELLED" } })
      .populate("participantId", "firstName lastName email")
      .populate("attendanceMarkedBy", "name");

    const data = registrations.map((r) => ({
      Name: `${r.participantId?.firstName || ""} ${r.participantId?.lastName || ""}`.trim(),
      Email: r.participantId?.email || "",
      TicketID: r.ticketNumber || "",
      Attendance:
        r.attendanceMarked || r.status === "ATTENDED" || r.attendanceTime ? "Yes" : "No",
      AttendanceTime: r.attendanceTime || "",
      MarkedBy: r.attendanceMarkedBy?.name || "",
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance-${eventId}.csv`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// override manual attendance

export const manualAttendanceOverride = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason = "" } = req.body;
    const organizerId = req.user.id;

    if (!reason.trim()) {
      return res.status(400).json({ message: "Override reason is required" });
    }

    const registration = await Registration.findById(registrationId).populate(
      "participantId",
      "firstName lastName email"
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: "Not your event" });
    }

    const alreadyMarked =
      registration.attendanceMarked ||
      registration.status === "ATTENDED" ||
      !!registration.attendanceTime;

    registration.attendanceMarked = true;
    registration.attendanceTime = registration.attendanceTime || new Date();
    registration.attendanceMarkedBy = organizerId;
    registration.status = "ATTENDED";
    await registration.save();

    await AuditLog.create({
      eventId: event._id,
      registrationId: registration._id,
      performedBy: organizerId,
      action: "MANUAL_OVERRIDE",
      metadata: {
        reason: reason.trim(),
        alreadyMarked,
        ticketNumber: registration.ticketNumber,
      },
    });

    return res.json({
      message: alreadyMarked
        ? "Attendance was already marked. Override logged."
        : "Manual attendance marked",
      registrationId: registration._id,
      ticketNumber: registration.ticketNumber,
      attendanceTime: registration.attendanceTime,
      participant: registration.participantId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
