import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Participant from "../models/Participant.js";
import Organizer from "../models/Organizer.js";
import bcrypt from "bcrypt";

// Browse Events
export const browseEvents = async (req, res) => {
  try {
    const {
      search,
      type,
      eligibility,
      startDate,
      endDate,
      followedOnly,
    } = req.query;

    let filter = {
      status: "PUBLISHED",
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (type) {
      filter.type = type;
    }

    if (eligibility) {
      filter.eligibility = eligibility;
    }

    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (followedOnly === "true") {
      const participant = await Participant.findById(req.user.id);
      filter.organizerId = { $in: participant.followedClubs };
    }

    const events = await Event.find(filter).populate(
      "organizerId",
      "name category"
    );

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Trending Events
export const trendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "PUBLISHED",
    })
      .sort({ registeredCount: -1 })
      .limit(10)
      .populate("organizerId", "name category");

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Event Details
export const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const participantId = req.user.id;

    const event = await Event.findById(eventId).populate(
      "organizerId",
      "name category description contactEmail"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registration = await Registration.findOne({
      eventId,
      participantId,
      status: { $ne: "cancelled" },
    });

    res.json({
      ...event._doc,
      isRegistered: !!registration,
      registrationId: registration?._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register for Event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const participantId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Event is not open for registration" });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }

    const existingRegistration = await Registration.findOne({
      eventId,
      participantId,
      status: { $ne: "cancelled" },
    });

    if (existingRegistration) {
      return res.status(400).json({ message: "Already registered" });
    }

    const registration = await Registration.create({
      eventId,
      participantId,
      status: "confirmed",
    });

    await Event.findByIdAndUpdate(eventId, {
      $inc: { registeredCount: 1 },
    });

    res.status(201).json({ message: "Registered successfully", registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get My Registrations
export const getMyRegistrations = async (req, res) => {
  try {
    const participantId = req.user.id;

    const registrations = await Registration.find({
      participantId,
      status: { $ne: "cancelled" },
    }).populate({
      path: "eventId",
      populate: {
        path: "organizerId",
        select: "name category",
      },
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel Registration
export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const participantId = req.user.id;

    const registration = await Registration.findOne({
      _id: registrationId,
      participantId,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    registration.status = "cancelled";
    await registration.save();

    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { registeredCount: -1 },
    });

    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all clubs/organizers with follow status
export const getAllClubs = async (req, res) => {
  try {
    const participantId = req.user.id;

    const organizers = await Organizer.find({ isActive: true }).select(
      "name category description contactEmail"
    );

    const participant = await Participant.findById(participantId).select(
      "followedClubs"
    );

    const clubsWithFollowStatus = await Promise.all(
      organizers.map(async (org) => {
        const upcomingEvents = await Event.countDocuments({
          organizerId: org._id,
          status: "PUBLISHED",
        });

        return {
          _id: org._id,
          name: org.name,
          category: org.category,
          description: org.description,
          contactEmail: org.contactEmail,
          upcomingEvents,
          isFollowing: participant.followedClubs.some(
            (id) => id.toString() === org._id.toString()
          ),
        };
      })
    );

    res.json(clubsWithFollowStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get club/organizer details
export const getClubDetails = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const participantId = req.user.id;

    const organizer = await Organizer.findById(organizerId).select(
      "name category description contactEmail"
    );

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const events = await Event.find({
      organizerId,
      status: "PUBLISHED",
    }).sort({ startDate: 1 });

    const participant = await Participant.findById(participantId).select(
      "followedClubs"
    );

    res.json({
      ...organizer._doc,
      events,
      isFollowing: participant.followedClubs.some(
        (id) => id.toString() === organizerId
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Follow organizer
export const followOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const participantId = req.user.id;

    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const participant = await Participant.findById(participantId);

    if (participant.followedClubs.some((id) => id.toString() === organizerId)) {
      return res.status(400).json({ message: "Already following" });
    }

    participant.followedClubs.push(organizerId);
    await participant.save();

    res.json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unfollow organizer
export const unfollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const participantId = req.user.id;

    const participant = await Participant.findById(participantId);

    if (!participant.followedClubs.some((id) => id.toString() === organizerId)) {
      return res.status(400).json({ message: "Not following" });
    }

    participant.followedClubs = participant.followedClubs.filter(
      (id) => id.toString() !== organizerId
    );
    await participant.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my profile
export const getMyProfile = async (req, res) => {
  try {
    const participantId = req.user.id;

    const participant = await Participant.findById(participantId)
      .select("-password")
      .populate("followedClubs", "name category");

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    res.json(participant);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update my profile
export const updateMyProfile = async (req, res) => {
  try {
    const participantId = req.user.id;
    const { firstName, lastName, contactNumber, collegeName, interests } =
      req.body;

    const participant = await Participant.findByIdAndUpdate(
      participantId,
      {
        firstName,
        lastName,
        contactNumber,
        collegeName,
        interests,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    res.json({ message: "Profile updated successfully", participant });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const participantId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, participant.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    participant.password = hashedPassword;
    await participant.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

