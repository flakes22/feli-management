import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import Registration from "../models/Registration.js";
import bcrypt from "bcryptjs";

// ── Create Event (Draft) ──
export const createEvent = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const event = await Event.create({ ...req.body, organizerId, status: "DRAFT" });
    res.status(201).json({ message: "Event created in Draft mode", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get All Events for Organizer (Dashboard) ──
export const getMyEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const events = await Event.find({ organizerId }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Single Event Detail with Registrations ──
export const getEventDetail = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registrations = await Registration.find({ eventId })
      .populate("participantId", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({ event, registrations, totalRegistrations: registrations.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Event with Status-based Rules ──
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { status } = event;

    // ONGOING / COMPLETED → only status change allowed
    if (status === "ONGOING" || status === "COMPLETED") {
      const { status: newStatus } = req.body;
      if (!newStatus)
        return res.status(400).json({ message: "Only status changes allowed for ongoing/completed events." });

      event.status = newStatus;
      await event.save();
      return res.json({ message: "Status updated", event });
    }

    // PUBLISHED → restricted edits
    if (status === "PUBLISHED") {
      const { description, registrationDeadline, maxParticipants, status: newStatus } = req.body;

      if (newStatus) event.status = newStatus;
      if (description !== undefined) event.description = description;

      // Can only EXTEND deadline
      if (registrationDeadline) {
        if (new Date(registrationDeadline) < new Date(event.registrationDeadline)) {
          return res.status(400).json({ message: "Cannot shorten registration deadline for a published event." });
        }
        event.registrationDeadline = registrationDeadline;
      }

      // Can only INCREASE limit
      if (maxParticipants !== undefined) {
        if (Number(maxParticipants) < (event.maxParticipants || 0)) {
          return res.status(400).json({ message: "Cannot decrease participant limit for a published event." });
        }
        event.maxParticipants = Number(maxParticipants);
      }

      await event.save();
      return res.json({ message: "Event updated", event });
    }

    // DRAFT → free edits, check if form is locked
    if (status === "DRAFT") {
      const hasRegistrations = await Registration.countDocuments({
        eventId,
        status: { $ne: "CANCELLED" },
      });

      // Lock customFields if registrations exist
      const { customFields, ...otherUpdates } = req.body;
      Object.assign(event, otherUpdates);

      if (customFields !== undefined) {
        if (hasRegistrations > 0) {
          return res.status(400).json({
            message: "Cannot modify form fields after registrations are received.",
          });
        }
        event.customFields = customFields;
      }

      await event.save();
      return res.json({ message: "Event updated", event });
    }

    res.status(400).json({ message: "Cannot edit this event." });
  } catch (error) {
    console.error("updateEvent error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Publish Event ──
export const publishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "DRAFT")
      return res.status(400).json({ message: "Only draft events can be published." });

    event.status = "PUBLISHED";
    await event.save();
    res.json({ message: "Event published successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Delete Event (Draft only) ──
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "DRAFT")
      return res.status(400).json({ message: "Only draft events can be deleted." });

    await Event.deleteOne({ _id: eventId });
    await Registration.deleteMany({ eventId });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Organizer Profile ──
export const getOrganizerProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id).select("-password");
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });

    const allEvents = await Event.find({ organizerId: req.user.id });
    const now = new Date();
    const eventIds = allEvents.map((e) => e._id);

    const totalParticipants = await Registration.countDocuments({
      eventId: { $in: eventIds },
      status: { $ne: "CANCELLED" },
    });

    res.json({
      organizer,
      stats: {
        totalEvents: allEvents.length,
        upcomingEvents: allEvents.filter((e) => new Date(e.startDate) > now && e.status === "PUBLISHED").length,
        completedEvents: allEvents.filter((e) => new Date(e.endDate) < now).length,
        totalParticipants,
        followers: organizer.followers?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrganizerProfile = async (req, res) => {
  try {
    const { description, establishedYear, memberCount, contactPhone, website, socialMedia } = req.body;
    const organizer = await Organizer.findByIdAndUpdate(
      req.user.id,
      { description, establishedYear, memberCount, contactPhone, website, socialMedia },
      { new: true }
    ).select("-password");
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });
    res.json({ message: "Profile updated", organizer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const organizer = await Organizer.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, organizer.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    organizer.password = await bcrypt.hash(newPassword, 10);
    await organizer.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrganizerStats = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id });
    const eventIds = events.map((e) => e._id);
    const registrations = await Registration.find({ eventId: { $in: eventIds }, status: { $ne: "CANCELLED" } });
    const totalRevenue = events.reduce((sum, evt) => {
      const count = registrations.filter((r) => r.eventId.toString() === evt._id.toString()).length;
      return sum + count * (evt.registrationFee || 0);
    }, 0);
    res.json({ totalEvents: events.length, totalRegistrations: registrations.length, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};