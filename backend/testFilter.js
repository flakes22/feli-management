import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event.js';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/feli').then(async () => {
  const allEvents = await Event.find({ status: "PUBLISHED" });
  let filteredEvents = allEvents;
  const followedOnly = "true";
  const followedOrgIds = new Set([]); 

  if (String(followedOnly) === "true") {
      filteredEvents = filteredEvents.filter(
        (e) => e.organizerId?._id && followedOrgIds.has(e.organizerId._id.toString())
      );
  }
  
  console.log("Filtered length: ", filteredEvents.length);
  process.exit(0);
}).catch(console.error);
