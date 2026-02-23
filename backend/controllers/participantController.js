import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import Participant from "../models/Participant.js";
import Registration from "../models/Registration.js";
import bcrypt from "bcryptjs";

const normalizeInterests = (interests = []) => {
  if (!Array.isArray(interests)) return [];

  const seen = new Set();
  const normalized = [];
  for (const interest of interests) {
    const cleaned = String(interest || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(cleaned);
  }
  return normalized.slice(0, 20);
};

const getInterestScore = (event, normalizedInterests = []) => {
  if (!normalizedInterests.length) return 0;

  const textPool = [
    event?.name,
    event?.description,
    event?.eligibility,
    event?.organizerId?.name,
    event?.organizerId?.category,
    ...(Array.isArray(event?.tags) ? event.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const interest of normalizedInterests) {
    if (textPool.includes(interest.toLowerCase())) score += 1;
  }
  return score;
};

const isEventOpenForRegistration = (status) => {
  const normalized = String(status || "").toUpperCase();
  return normalized === "PUBLISHED" || normalized === "ONGOING";
};

const normalizeFieldType = (type = "text") => {
  return String(type || "text").toLowerCase();
};

const getRegistrationFields = (event) => {
  if (Array.isArray(event?.customForm?.fields) && event.customForm.fields.length > 0) {
    return event.customForm.fields.map((field, index) => ({
      id: String(field?._id || `custom-${index}`),
      label: String(field?.label || "").trim(),
      type: normalizeFieldType(field?.type || field?.fieldType),
      required: Boolean(field?.required),
      options: Array.isArray(field?.options) ? field.options : [],
      enabled: field?.enabled !== false,
      placeholder: field?.placeholder || "",
      description: field?.description || "",
    }));
  }

  const fallbackFields =
    (Array.isArray(event?.customFields) && event.customFields.length > 0
      ? event.customFields
      : event?.customFormFields) || [];

  return fallbackFields.map((field, index) => ({
    id: String(field?._id || `legacy-${index}`),
    label: String(field?.label || "").trim(),
    type: normalizeFieldType(field?.type || field?.fieldType),
    required: Boolean(field?.required),
    options: Array.isArray(field?.options) ? field.options : [],
    enabled: true,
    placeholder: "",
    description: "",
  }));
};

const isMissingFieldValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export const browseEvents = async (req, res) => {
  try {
    const { search, type, category, eligibility, startDate, endDate, followedOnly } = req.query;

    let query = { status: "PUBLISHED" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (type) {
      query.type = type;
    }

    const participant = await Participant.findById(req.user.id).select("interests followedOrganizers");
    const followedOrgIds = new Set(
      (participant?.followedOrganizers || []).map((id) => id.toString())
    );
    const participantInterests = normalizeInterests(participant?.interests || []);

    const events = await Event.find(query)
      .populate("organizerId", "name category")
      .sort({ startDate: 1, createdAt: -1 });

    // Filter by organizer category if provided
    let filteredEvents = events;
    if (category) {
      filteredEvents = events.filter(
        (e) => e.organizerId?.category === category
      );
    }

    if (eligibility) {
      const elig = eligibility.toLowerCase();
      filteredEvents = filteredEvents.filter((e) =>
        (e.eligibility || "").toLowerCase().includes(elig)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredEvents = filteredEvents.filter((e) => !e.startDate || new Date(e.startDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredEvents = filteredEvents.filter((e) => !e.startDate || new Date(e.startDate) <= end);
    }

    if (String(followedOnly) === "true") {
      filteredEvents = filteredEvents.filter(
        (e) => e.organizerId?._id && followedOrgIds.has(e.organizerId._id.toString())
      );
    }

    const rankedEvents = filteredEvents
      .map((event) => ({
        event,
        score: getInterestScore(event, participantInterests),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.event.startDate || 0) - new Date(b.event.startDate || 0);
      })
      .map((item) => item.event);

    res.json(rankedEvents);
  } catch (err) {
    console.error("browseEvents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate(
      "organizerId",
      "name category description email contactPhone website socialMedia"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get registration stats
    const totalRegs = await Registration.countDocuments({
      eventId,
      status: { $ne: "CANCELLED" },
    });

    const isDeadlinePassed =
      event.registrationDeadline && new Date(event.registrationDeadline) < new Date();

    const isLimitReached =
      event.registrationLimit && totalRegs >= event.registrationLimit;

    const eventObj = event.toObject();
    if (!eventObj.customFields || eventObj.customFields.length === 0) {
      const sourceFields =
        (Array.isArray(eventObj.customForm?.fields) && eventObj.customForm.fields.length > 0
          ? eventObj.customForm.fields
          : eventObj.customFormFields) || [];

      eventObj.customFields = sourceFields
        .filter((f) => f?.enabled !== false)
        .map((f) => ({
          label: f.label,
          fieldType: f.fieldType || f.type || "TEXT",
          required: Boolean(f.required),
          options: Array.isArray(f.options) ? f.options : [],
        }));
    }

    res.json({
      event: eventObj,
      stats: {
        totalRegs,
        isDeadlinePassed,
        isLimitReached,
      },
    });
  } catch (err) {
    console.error("getEventDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTrendingEvents = async (req, res) => {
  try {
    const { search, type, category, eligibility, startDate, endDate, followedOnly } = req.query;

    const participant = await Participant.findById(req.user.id).select("interests followedOrganizers");
    const participantInterests = normalizeInterests(participant?.interests || []);
    const followedOrgIds = new Set(
      (participant?.followedOrganizers || []).map((id) => id.toString())
    );

    let query = {
      status: "PUBLISHED",
      startDate: { $gte: new Date() },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.type = type;

    const events = await Event.find(query)
      .populate("organizerId", "name category")
      .sort({ registrationCount: -1 })
      .limit(50);

    let filteredEvents = events;
    if (category) {
      filteredEvents = events.filter((e) => e.organizerId?.category === category);
    }
    if (eligibility) {
      const elig = eligibility.toLowerCase();
      filteredEvents = filteredEvents.filter((e) =>
        (e.eligibility || "").toLowerCase().includes(elig)
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      filteredEvents = filteredEvents.filter((e) => !e.startDate || new Date(e.startDate) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filteredEvents = filteredEvents.filter((e) => !e.startDate || new Date(e.startDate) <= end);
    }
    if (String(followedOnly) === "true") {
      filteredEvents = filteredEvents.filter(
        (e) => e.organizerId?._id && followedOrgIds.has(e.organizerId._id.toString())
      );
    }

    const ranked = filteredEvents
      .map((event) => {
        const interestScore = getInterestScore(event, participantInterests);
        const popularity = Number(event.registrationCount || 0);
        return {
          event,
          score: interestScore * 3 + popularity / 100,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => item.event);

    res.json(ranked);
  } catch (err) {
    console.error("getTrendingEvents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getClubs = async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id);

    const clubs = await Organizer.find({ isActive: true }).select(
      "-password -generatedPassword -passwordResetRequest"
    );

    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {

        const isFollowing = participant.followedOrganizers
          .map(id => id.toString())
          .includes(club._id.toString());

        return {
          ...club.toObject(),
          isFollowing
        };
      })
    );

    res.json(clubsWithStats);

  } catch (err) {
    console.error("getClubs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getClubDetails = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const club = await Organizer.findById(organizerId).select(
      "-password -generatedPassword -passwordResetRequest"
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Get club's events
    const events = await Event.find({
      organizerId,
      status: "PUBLISHED",
    }).sort({ startDate: -1 });

    // Get stats
    const totalEvents = await Event.countDocuments({ organizerId });

    const upcomingEvents = await Event.countDocuments({
      organizerId,
      status: { $in: ["PUBLISHED", "ONGOING"] },
      startDate: { $gte: new Date() },
    });

    const completedEvents = await Event.countDocuments({
      organizerId,
      status: "COMPLETED",
    });

    const eventIds = await Event.find({ organizerId }).distinct("_id");

    const totalParticipants = await Registration.countDocuments({
      eventId: { $in: eventIds },
      status: { $ne: "CANCELLED" },
    });

    const followers = await Participant.countDocuments({
      followedOrganizers: organizerId,
    });

    res.json({
      club,
      events,
      stats: {
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalParticipants,
        followers,
      },
    });
  } catch (err) {
    console.error("getClubDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const participantId = req.user.id;

    const participant = await Participant.findById(participantId);
    const organizer = await Organizer.findById(organizerId);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (!participant.followedOrganizers) {
      participant.followedOrganizers = [];
    }

    const index = participant.followedOrganizers.findIndex(
      (id) => id.toString() === organizerId
    );

    if (index > -1) {
      // Unfollow
      participant.followedOrganizers.splice(index, 1);
      await participant.save();

      return res.json({
        message: "Unfollowed successfully",
        isFollowing: false,
      });
    } else {
      // Follow
      participant.followedOrganizers.push(organizerId);
      await participant.save();

      return res.json({
        message: "Followed successfully",
        isFollowing: true,
      });
    }
  } catch (err) {
    console.error("toggleFollow error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id)
      .select("-password")
      .populate("followedOrganizers", "name category");

    if (!participant) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Get registration stats
    const totalRegistrations = await Registration.countDocuments({
      participantId: req.user.id,
      status: { $ne: "CANCELLED" },
    });

    const upcomingEvents = await Registration.countDocuments({
      participantId: req.user.id,
      status: "REGISTERED",
    });

    const attendedEvents = await Registration.countDocuments({
      participantId: req.user.id,
      status: "ATTENDED",
    });

    res.json({
      participant,
      stats: {
        totalRegistrations,
        upcomingEvents,
        attendedEvents,
        followingCount: participant.followedOrganizers?.length || 0,
      },
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      contactNumber,
      collegeName,
      interests,
    } = req.body;

    const participant = await Participant.findById(req.user.id);

    if (!participant) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (firstName !== undefined) participant.firstName = firstName;
    if (lastName !== undefined) participant.lastName = lastName;
    if (contactNumber !== undefined) participant.contactNumber = contactNumber;
    if (collegeName !== undefined) participant.collegeName = collegeName;
    if (interests !== undefined) participant.interests = normalizeInterests(interests);
    await participant.save();

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const participant = await Participant.findById(req.user.id);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, participant.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    participant.password = await bcrypt.hash(newPassword, salt);

    await participant.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get event details for registration (includes custom form)
// @route   GET /api/participant/events/:eventId/registration-form
// @access  Private (participant)
export const getEventRegistrationForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select(
      "name description startDate registrationDeadline registrationLimit customForm customFields customFormFields status"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!isEventOpenForRegistration(event.status)) {
      return res.status(400).json({ message: "Event is not open for registration" });
    }

    const fields = getRegistrationFields(event).filter((field) => field.enabled);

    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        title: event.name,
        name: event.name,
        description: event.description,
        date: event.startDate,
        startDate: event.startDate,
        registrationDeadline: event.registrationDeadline,
        registrationLimit: event.registrationLimit,
        customForm: { fields },
        status: event.status,
      },
    });
  } catch (error) {
    console.error("getEventRegistrationForm error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Register participant for an event
// @route   POST /api/participant/events/:eventId/register
// @access  Private (participant)
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { formResponses = [] } = req.body; // custom form answers

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!isEventOpenForRegistration(event.status)) {
      return res.status(400).json({ message: "Event is not open for registration" });
    }

    // Check deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    // Check capacity
    const existingCount = await Registration.countDocuments({
      eventId,
      status: { $ne: "CANCELLED" },
    });
    if (event.registrationLimit && existingCount >= event.registrationLimit) {
      return res.status(400).json({ message: "Event is fully booked" });
    }

    // Check duplicate
    const duplicate = await Registration.findOne({
      eventId,
      participantId: req.user.id,
      status: { $in: ["REGISTERED", "ATTENDED"] },
    });
    if (duplicate) {
      return res.status(400).json({ message: "You are already registered for this event" });
    }

    // Validate required custom form fields
    const registrationFields = getRegistrationFields(event).filter((f) => f.enabled);
    if (registrationFields.length > 0) {
      const requiredFields = registrationFields.filter((f) => f.required);
      for (const field of requiredFields) {
        const response = formResponses.find(
          (r) =>
            String(r?.fieldId || "") === String(field.id) ||
            String(r?.label || "").trim() === field.label
        );
        if (!response || isMissingFieldValue(response.value)) {
          return res.status(400).json({ message: `Field "${field.label}" is required` });
        }
      }
    }

    const normalizedFormResponses = formResponses.map((r) => ({
      fieldId: String(r?.fieldId || ""),
      label: String(r?.label || ""),
      value: r?.value,
    }));

    const customFieldResponses = normalizedFormResponses.map((r) => ({
      fieldLabel: r.label,
      fieldType:
        registrationFields.find((f) => f.id === r.fieldId || f.label === r.label)?.type || "text",
      response: r.value,
    }));

    const registration = await Registration.create({
      eventId,
      participantId: req.user.id,
      formResponses: normalizedFormResponses,
      customFieldResponses,
      status: "REGISTERED",
    });

    res.status(201).json({ success: true, message: "Registered successfully", registration });
  } catch (error) {
    console.error("registerForEvent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
