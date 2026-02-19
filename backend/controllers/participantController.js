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

    res.json({
      event,
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
    const participant = await Participant.findById(req.user.id).select("interests");
    const participantInterests = normalizeInterests(participant?.interests || []);

    const events = await Event.find({
      status: "PUBLISHED",
      startDate: { $gte: new Date() },
    })
      .populate("organizerId", "name category")
      .sort({ registrationCount: -1 })
      .limit(50);

    const ranked = events
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
