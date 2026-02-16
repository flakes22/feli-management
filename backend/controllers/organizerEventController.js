import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Participant from "../models/Participant.js";
import { Parser } from "json2csv";

export const createEvent = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const eventData = { ...req.body, organizerId };

    // If no status provided, default to DRAFT
    if (!eventData.status) {
      eventData.status = "DRAFT";
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if form is locked (has registrations)
    const hasRegistrations = await Registration.countDocuments({
      eventId,
      status: { $ne: "CANCELLED" },
    });

    // Don't allow editing customFields if registrations exist
    if (hasRegistrations > 0 && req.body.customFields) {
      return res.status(400).json({
        message: "Cannot modify registration form after first registration",
      });
    }

    Object.assign(event, req.body);
    await event.save();

    res.json({ message: "Event updated successfully", event });
  } catch (err) {
    console.error("updateEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if has registrations
    const hasRegistrations = await Registration.countDocuments({
      eventId,
      status: { $ne: "CANCELLED" },
    });

    if (hasRegistrations > 0) {
      return res.status(400).json({
        message: "Cannot delete event with active registrations. Cancel the event instead.",
      });
    }

    await Event.deleteOne({ _id: eventId });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEventDetail = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registrations = await Registration.find({ eventId })
      .populate("participantId", "firstName lastName email contactNumber")
      .sort({ registeredAt: -1 });

    const totalRegistrations = registrations.filter(
      (r) => r.status !== "CANCELLED"
    ).length;

    res.json({ event, registrations, totalRegistrations });
  } catch (err) {
    console.error("getEventDetail error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOngoingEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({
      organizerId,
      status: "ONGOING",
    }).sort({ startDate: -1 });

    res.json(events);
  } catch (err) {
    console.error("getOngoingEvents error:", err);
    res.status(500).json({ message: "Server error" });
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
