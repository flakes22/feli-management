import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import Registration from "../models/Registration.js";
import bcrypt from "bcryptjs";

const normalizeCustomFieldsInput = (fields = []) =>
  (fields || []).map((f) => ({
    label: f.label,
    fieldType: f.fieldType || f.type || "TEXT",
    required: Boolean(f.required),
    options: Array.isArray(f.options) ? f.options : [],
  }));

// ── Create Event (Draft) ──
export const createEvent = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const payload = { ...req.body, organizerId, status: "DRAFT" };

    const incomingCustomFields = payload.customFields || payload.customFormFields;
    if (incomingCustomFields !== undefined) {
      payload.customFields = normalizeCustomFieldsInput(incomingCustomFields);
    }

    const event = await Event.create(payload);
    res.status(201).json({ message: "Event created in Draft mode", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get All Events for Organizer ──
export const getMyEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const events = await Event.find({ organizerId }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Ongoing Events for Organizer ──
export const getOngoingEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const now = new Date();

    const events = await Event.find({
      organizerId,
      status: { $in: ["PUBLISHED", "ONGOING"] },
    }).sort({ startDate: 1, createdAt: -1 });

    const toOngoingIds = [];
    const toClosedIds = [];
    const ongoingEvents = [];

    for (const event of events) {
      const hasStarted = !event.startDate || new Date(event.startDate) <= now;
      const hasEnded = !!event.endDate && new Date(event.endDate) < now;
      const isWithinWindow = hasStarted && !hasEnded;

      if (event.status === "ONGOING" && hasEnded) {
        toClosedIds.push(event._id);
        continue;
      }

      if (event.status === "PUBLISHED" && isWithinWindow) {
        toOngoingIds.push(event._id);
      }

      if (event.status === "ONGOING" || isWithinWindow) {
        ongoingEvents.push(event);
      }
    }

    if (toOngoingIds.length > 0) {
      await Event.updateMany(
        { _id: { $in: toOngoingIds } },
        { $set: { status: "ONGOING" } }
      );
    }

    if (toClosedIds.length > 0) {
      await Event.updateMany(
        { _id: { $in: toClosedIds } },
        { $set: { status: "CLOSED" } }
      );
    }

    const normalized = ongoingEvents.map((e) => ({
      ...e.toObject(),
      status:
        toOngoingIds.some((id) => id.toString() === e._id.toString())
          ? "ONGOING"
          : e.status,
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Single Event Detail ──
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

// ── Update Event ──
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { status } = event;

    if (status === "ONGOING" || status === "COMPLETED") {
      const { status: newStatus } = req.body;
      if (!newStatus)
        return res.status(400).json({ message: "Only status changes allowed for ongoing/completed events." });
      event.status = newStatus;
      await event.save();
      return res.json({ message: "Status updated", event });
    }

    if (status === "PUBLISHED") {
      const { description, registrationDeadline, maxParticipants, status: newStatus } = req.body;
      if (newStatus) event.status = newStatus;
      if (description !== undefined) event.description = description;
      if (registrationDeadline) {
        if (new Date(registrationDeadline) < new Date(event.registrationDeadline))
          return res.status(400).json({ message: "Cannot shorten registration deadline." });
        event.registrationDeadline = registrationDeadline;
      }
      if (maxParticipants !== undefined) {
        if (Number(maxParticipants) < (event.maxParticipants || 0))
          return res.status(400).json({ message: "Cannot decrease participant limit." });
        event.maxParticipants = Number(maxParticipants);
      }
      await event.save();
      return res.json({ message: "Event updated", event });
    }

    if (status === "DRAFT") {
      const hasRegistrations = await Registration.countDocuments({
        eventId, status: { $ne: "CANCELLED" },
      });
      const { customFields, customFormFields, ...otherUpdates } = req.body;
      Object.assign(event, otherUpdates);
      const incomingCustomFields = customFields ?? customFormFields;
      if (incomingCustomFields !== undefined) {
        if (hasRegistrations > 0)
          return res.status(400).json({ message: "Cannot modify form fields after registrations received." });
        event.customFields = normalizeCustomFieldsInput(incomingCustomFields);
      }
      await event.save();
      return res.json({ message: "Event updated", event });
    }

    res.status(400).json({ message: "Cannot edit this event." });
  } catch (error) {
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

// ── Delete Event ──
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

// ── Get Organizer Profile ──
export const getOrganizerProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id)
      .select("-password -passwordResetRequests");
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
        upcomingEvents: allEvents.filter(
          (e) => new Date(e.startDate) > now && e.status === "PUBLISHED"
        ).length,
        completedEvents: allEvents.filter((e) => new Date(e.endDate) < now).length,
        totalParticipants,
        followers: organizer.followers?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Organizer Profile ──
export const updateOrganizerProfile = async (req, res) => {
  try {
    const {
      description, establishedYear, memberCount,
      contactPhone, website, socialMedia,
    } = req.body;
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

// ── Request Password Reset ──
export const requestPasswordReset = async (req, res) => {
  try {
    const { reason, currentPassword, newPassword } = req.body;

    if (!reason?.trim())
      return res.status(400).json({ message: "Reason is required." });
    if (!currentPassword)
      return res.status(400).json({ message: "Current password is required." });
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    // ✅ Use findById — do NOT call .save() on this doc yet
    const organizer = await Organizer.findById(req.user.id);
    if (!organizer) return res.status(404).json({ message: "Organizer not found." });

    // ✅ Check if organizer is active
    if (organizer.isActive === false)
      return res.status(403).json({ message: "Your account has been disabled." });

    // ✅ Verify current password against stored hash
    const isMatch = await bcrypt.compare(currentPassword, organizer.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect." });

    // Check no PENDING request already exists
    const hasPending = organizer.passwordResetRequests.some(
      (r) => r.status === "PENDING"
    );
    if (hasPending)
      return res.status(400).json({
        message: "You already have a pending password reset request.",
      });

    // ✅ Hash the new password here (plain text → hash stored in request)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // ✅ Use $push with updateOne to avoid triggering pre('save') on password field
    await Organizer.updateOne(
      { _id: req.user.id },
      {
        $push: {
          passwordResetRequests: {
            reason,
            newPasswordHash,
            status: "PENDING",
            appliedByOrganizer: false,
            requestedAt: new Date(),
          },
        },
      }
    );

    res.json({
      message: "Password reset request submitted. Admin will review it.",
    });
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Get Password Reset Status for this organizer ──
export const getMyPasswordResetStatus = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id).select(
      "passwordResetRequests"
    );
    if (!organizer) return res.status(404).json({ message: "Organizer not found." });

    // Return the latest request that hasn't been fully applied
    const activeRequest = organizer.passwordResetRequests
      .filter((r) => !r.appliedByOrganizer)
      .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))[0] || null;

    res.json({ request: activeRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Apply Approved Password ──
export const applyApprovedPassword = async (req, res) => {
  try {
    const { requestId } = req.params;

    const organizer = await Organizer.findById(req.user.id);
    if (!organizer) return res.status(404).json({ message: "Organizer not found." });

    const request = organizer.passwordResetRequests.id(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.status !== "APPROVED")
      return res.status(400).json({ message: "This request has not been approved yet." });
    if (request.appliedByOrganizer)
      return res.status(400).json({ message: "Password already applied." });

    // ✅ Use updateOne to set the new (already-hashed) password directly
    //    bypassing pre('save') so it does NOT get double-hashed
    await Organizer.updateOne(
      { _id: req.user.id },
      {
        $set: {
          password: request.newPasswordHash,          // already bcrypt hash — set directly
          "passwordResetRequests.$[elem].appliedByOrganizer": true,
          "passwordResetRequests.$[elem].resolvedAt": new Date(),
        },
      },
      { arrayFilters: [{ "elem._id": request._id }] }
    );

    res.json({
      message:
        "Password changed successfully! Please log in again with your new password.",
    });
  } catch (error) {
    console.error("applyApprovedPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Get Stats ──
export const getOrganizerStats = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id });
    const eventIds = events.map((e) => e._id);
    const registrations = await Registration.find({
      eventId: { $in: eventIds },
      status: { $ne: "CANCELLED" },
    });
    const totalRevenue = events.reduce((sum, evt) => {
      const count = registrations.filter(
        (r) => r.eventId.toString() === evt._id.toString()
      ).length;
      return sum + count * (evt.registrationFee || 0);
    }, 0);
    res.json({
      totalEvents: events.length,
      totalRegistrations: registrations.length,
      totalRevenue,
    });
  } catch (error) {
    res.status (500).json({ message: error.message });
  }
};
