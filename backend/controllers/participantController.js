import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import Participant from "../models/Participant.js";
import Registration from "../models/Registration.js";
import bcrypt from "bcryptjs";

export const browseEvents = async (req, res) => {
  try {
    const { search, type, category } = req.query;

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

    const events = await Event.find(query)
      .populate("organizerId", "name category")
      .sort({ startDate: 1 });

    // Filter by organizer category if provided
    let filteredEvents = events;
    if (category) {
      filteredEvents = events.filter(
        (e) => e.organizerId?.category === category
      );
    }

    res.json(filteredEvents);
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
    const events = await Event.find({
      status: "PUBLISHED",
      startDate: { $gte: new Date() },
    })
      .populate("organizerId", "name category")
      .sort({ registrationCount: -1 })
      .limit(10);

    res.json(events);
  } catch (err) {
    console.error("getTrendingEvents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getClubs = async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    const clubs = await Organizer.find(query).select(
      "-password -generatedPassword -passwordResetRequest"
    );

    // Get event counts for each club
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        const totalEvents = await Event.countDocuments({
          organizerId: club._id,
        });

        const upcomingEvents = await Event.countDocuments({
          organizerId: club._id,
          status: { $in: ["PUBLISHED", "ONGOING"] },
          startDate: { $gte: new Date() },
        });

        return {
          ...club.toObject(),
          totalEvents,
          upcomingEvents,
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

    const index = participant.followedOrganizers.indexOf(organizerId);

    if (index > -1) {
      // Unfollow
      participant.followedOrganizers.splice(index, 1);
      await participant.save();
      res.json({ message: "Unfollowed successfully", isFollowing: false });
    } else {
      // Follow
      participant.followedOrganizers.push(organizerId);
      await participant.save();
      res.json({ message: "Followed successfully", isFollowing: true });
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
    const { firstName, lastName, contactNumber, department, year } = req.body;

    const participant = await Participant.findById(req.user.id);

    if (!participant) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (firstName !== undefined) participant.firstName = firstName;
    if (lastName !== undefined) participant.lastName = lastName;
    if (contactNumber !== undefined) participant.contactNumber = contactNumber;
    if (department !== undefined) participant.department = department;
    if (year !== undefined) participant.year = year;

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

