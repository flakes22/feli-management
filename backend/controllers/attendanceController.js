import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { Parser } from "json2csv";
import AuditLog from "../models/AuditLog.js";

// Scan QR and mark attendance
export const scanAttendance = async (req, res) => {
    try {
      const { ticketId } = req.body;
      const organizerId = req.user.id;
  
      if (!ticketId) {
        return res.status(400).json({ message: "Ticket ID required" });
      }
  
      const registration = await Registration.findOne({ ticketId });
  
      if (!registration)
        return res.status(404).json({ message: "Invalid ticket" });
  
      const event = await Event.findById(registration.eventId);
  
      if (event.organizerId.toString() !== organizerId)
        return res.status(403).json({ message: "Not your event" });
  
      // Duplicate scan
      if (registration.attendanceMarked) {
        await AuditLog.create({
          eventId: event._id,
          registrationId: registration._id,
          performedBy: organizerId,
          action: "QR_SCAN_DUPLICATE",
          metadata: {
            previousAttendanceTime: registration.attendanceTime,
          },
        });
  
        return res.status(400).json({
          message: "Attendance already marked",
          attendanceTime: registration.attendanceTime,
        });
      }
  
      registration.attendanceMarked = true;
      registration.attendanceTime = new Date();
      registration.attendanceMarkedBy = organizerId;
      registration.status = "COMPLETED";
  
      await registration.save();
  
      await AuditLog.create({
        eventId: event._id,
        registrationId: registration._id,
        performedBy: organizerId,
        action: "QR_SCAN_SUCCESS",
      });
  
      res.json({
        message: "Attendance marked successfully",
        attendanceTime: registration.attendanceTime,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
// Live attendance stats
export const getAttendanceStats = async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user.id;
  
      const event = await Event.findById(eventId);
  
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      if (event.organizerId.toString() !== organizerId)
        return res.status(403).json({ message: "Not your event" });
  
      const total = await Registration.countDocuments({ eventId });
  
      const attended = await Registration.countDocuments({
        eventId,
        attendanceMarked: true,
      });
  
      const notAttended = total - attended;
  
      res.json({
        total,
        attended,
        notAttended,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
// export attendance csv

export const exportAttendanceCSV = async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user.id;
  
      const registrations = await Registration.find({ eventId })
        .populate("participantId", "firstName lastName email");
  
      const data = registrations.map((r) => ({
        Name:
          r.participantId.firstName +
          " " +
          r.participantId.lastName,
        Email: r.participantId.email,
        TicketID: r.ticketId,
        Attendance: r.attendanceMarked ? "Yes" : "No",
        AttendanceTime: r.attendanceTime || "",
      }));
  
      const parser = new Parser();
      const csv = parser.parse(data);
  
      res.header("Content-Type", "text/csv");
      res.attachment("attendance.csv");
      return res.send(csv);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // override manual attendance

  export const manualAttendanceOverride = async (req, res) => {
    try {
      const { registrationId } = req.params;
      const organizerId = req.user.id;
  
      const registration = await Registration.findById(registrationId);
  
      if (!registration)
        return res.status(404).json({ message: "Not found" });
  
      const event = await Event.findById(registration.eventId);
  
      if (event.organizerId.toString() !== organizerId)
        return res.status(403).json({ message: "Not your event" });
  
      registration.attendanceMarked = true;
      registration.attendanceTime = new Date();
      registration.attendanceMarkedBy = organizerId;
      registration.status = "COMPLETED";
  
      await registration.save();
  
      await AuditLog.create({
        eventId: event._id,
        registrationId: registration._id,
        performedBy: organizerId,
        action: "MANUAL_OVERRIDE",
      });
  
      res.json({ message: "Manual attendance marked" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  