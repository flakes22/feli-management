import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import Registration from "../models/Registration.js";
import Participant from "../models/Participant.js";
import bcrypt from "bcryptjs";

// Create Event Draft
export const createEvent = async (req, res) => {
    try {
      const organizerId = req.user.id;
  
      const event = await Event.create({
        ...req.body,
        organizerId,
        status: "DRAFT",
      });
  
      res.status(201).json({
        message: "Event created in Draft mode",
        event,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Publish Event
export const publishEvent= async(req,res)=>{
    try{
        const{id}=req.params;
        const event= await Event.findById(id);
        if(!event){
            return res.status(404).json({message: "Event not found"});
        }
        if(event.organizerId.toString()!==req.user.id){
            return res.status(403).json({message: "This is not your event"});
        }
        if(event.status!=="DRAFT"){
            return res.status(400).json({
                message:"Only draft events can be published.",
            });
        }
        event.status="PUBLISHED";
        await event.save();

        res.json({message: "Event published successfully"});
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }
};

// Edit Event
export const editEvent = async (req, res) => {
    try {
      const { id } = req.params;
  
      const event = await Event.findById(id);
  
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      if (event.organizerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Not your event" });
  
      // Draft → full edit
      if (event.status === "DRAFT") {
        Object.assign(event, req.body);
      }
  
      // Published → limited edit
      else if (event.status === "PUBLISHED") {
        const allowedFields = [
          "description",
          "registrationDeadline",
          "registrationLimit",
        ];
  
        allowedFields.forEach((field) => {
          if (req.body[field] !== undefined) {
            event[field] = req.body[field];
          }
        });
      }
  
      // Ongoing/Closed → locked
      else {
        return res.status(400).json({
          message: "Event cannot be edited at this stage",
        });
      }
  
      await event.save();
  
      res.json({ message: "Event updated successfully", event });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Get My events

export const getMyEvents = async (req, res) => {
    try {
      const events = await Event.find({
        organizerId: req.user.id,
      });
  
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

export const getDashboard = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({ organizerId }).sort({ createdAt: -1 });

    const totalEvents = events.length;
    const activeEvents = events.filter((e) =>
      ["PUBLISHED", "ONGOING"].includes(e.status)
    ).length;

    const eventIds = events.map((e) => e._id);
    const totalRegistrations = await Registration.countDocuments({
      eventId: { $in: eventIds },
      status: { $ne: "CANCELLED" },
    });

    let totalRevenue = 0;
    for (const event of events) {
      const eventRegs = await Registration.countDocuments({
        eventId: event._id,
        status: { $ne: "CANCELLED" },
      });
      totalRevenue += (event.registrationFee || 0) * eventRegs;
    }

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $ne: "CANCELLED" },
        });

        return {
          _id: event._id,
          name: event.name,
          type: event.type,
          status: event.status,
          startDate: event.startDate,
          registrationCount,
        };
      })
    );

    res.json({
      stats: {
        totalEvents,
        activeEvents,
        totalRegistrations,
        totalRevenue,
      },
      events: eventsWithStats,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id).select(
      "-password -generatedPassword"
    );

    if (!organizer) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Get profile stats
    const totalEvents = await Event.countDocuments({
      organizerId: req.user.id,
    });

    const upcomingEvents = await Event.countDocuments({
      organizerId: req.user.id,
      status: { $in: ["PUBLISHED", "ONGOING"] },
      startDate: { $gte: new Date() },
    });

    const completedEvents = await Event.countDocuments({
      organizerId: req.user.id,
      status: "COMPLETED",
    });

    const eventIds = await Event.find({ organizerId: req.user.id }).distinct(
      "_id"
    );

    const totalParticipants = await Registration.countDocuments({
      eventId: { $in: eventIds },
      status: { $ne: "CANCELLED" },
    });

    const followers = await Participant.countDocuments({
      followedOrganizers: req.user.id,
    });

    res.json({
      organizer,
      stats: {
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalParticipants,
        followers,
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
      description,
      establishedYear,
      memberCount,
      contactPhone,
      website,
      socialMedia,
    } = req.body;

    const organizer = await Organizer.findById(req.user.id);

    if (!organizer) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Only allow editing specific fields
    if (description !== undefined) organizer.description = description;
    if (establishedYear !== undefined)
      organizer.establishedYear = establishedYear;
    if (memberCount !== undefined) organizer.memberCount = memberCount;
    if (contactPhone !== undefined) organizer.contactPhone = contactPhone;
    if (website !== undefined) organizer.website = website;
    if (socialMedia !== undefined) organizer.socialMedia = socialMedia;

    await organizer.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const organizer = await Organizer.findById(req.user.id);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (organizer.passwordResetRequest?.requested) {
      return res.status(400).json({
        message: "You already have a pending password reset request",
      });
    }

    organizer.passwordResetRequest = {
      requested: true,
      requestedAt: new Date(),
      reason: reason.trim(),
    };

    await organizer.save();

    res.json({ message: "Password reset request submitted successfully" });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
