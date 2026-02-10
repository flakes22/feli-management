import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Participant from "../models/Participant.js";

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
  
      // Search (partial match on name)
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }
  
      // Event Type filter
      if (type) {
        filter.type = type;
      }
  
      // Eligibility filter
      if (eligibility) {
        filter.eligibility = eligibility;
      }
  
      // Date range filter
      if (startDate && endDate) {
        filter.startDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      // Followed clubs filter
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
      const last24Hours = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      );
  
      const trending = await Registration.aggregate([
        {
          $match: {
            createdAt: { $gte: last24Hours },
          },
        },
        {
          $group: {
            _id: "$eventId",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
  
      const eventIds = trending.map((item) => item._id);
  
      const events = await Event.find({
        _id: { $in: eventIds },
      });
  
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };