import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Participant from "../models/Participant.js";
import { Parser } from "json2csv";

// Get event details 
export const getEventDetail = async (req, res) => {
    try {
      const { eventId } = req.params;
  
      const event = await Event.findById(eventId);
  
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      // Ownership check
      if (event.organizerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Not your event" });
  
      const registrations = await Registration.find({
        eventId,
      });
  
      const totalRegistrations = registrations.length;
  
      const revenue =
        totalRegistrations * (event.registrationFee || 0);
  
      const attendanceCount = registrations.filter(
        (r) => r.status === "COMPLETED"
      ).length;
  
      res.json({
        event,
        analytics: {
          totalRegistrations,
          revenue,
          attendanceCount,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Get participation list
export const getParticipants = async (req, res) => {
    try {
      const { eventId } = req.params;
      const { search, status } = req.query;
  
      const event = await Event.findById(eventId);
  
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      if (event.organizerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Not your event" });
  
      let filter = { eventId };
  
      if (status) {
        filter.status = status;
      }
  
      let registrations = await Registration.find(filter)
        .populate("participantId", "firstName lastName email")
        .sort({ createdAt: -1 });
  
      // Search by participant name/email
      if (search) {
        registrations = registrations.filter((r) => {
          const name =
            r.participantId.firstName +
            " " +
            r.participantId.lastName;
  
          return (
            name.toLowerCase().includes(search.toLowerCase()) ||
            r.participantId.email
              .toLowerCase()
              .includes(search.toLowerCase())
          );
        });
      }
  
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// export participants csv file
export const exportParticipantsCSV = async (req, res) => {
    try {
      const { eventId } = req.params;
  
      const event = await Event.findById(eventId);
  
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      if (event.organizerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Not your event" });
  
      const registrations = await Registration.find({
        eventId,
      }).populate("participantId", "firstName lastName email");
  
      const data = registrations.map((r) => ({
        Name:
          r.participantId.firstName +
          " " +
          r.participantId.lastName,
        Email: r.participantId.email,
        TicketID: r.ticketId,
        Status: r.status,
        RegisteredAt: r.createdAt,
      }));
  
      const parser = new Parser();
      const csv = parser.parse(data);
  
      res.header("Content-Type", "text/csv");
      res.attachment("participants.csv");
      return res.send(csv);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  