import mongoose from "mongoose";
import dotenv from "dotenv";
import Registration from "../models/Registration.js";

dotenv.config();

const connectDB=async()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");

    // Keep DB indexes aligned with schema, including removing stale unique indexes
    // (e.g. old unique index on eventId that blocks multiple registrations per event).
    try {
      await Registration.syncIndexes();
      console.log("Registration indexes synced");
    } catch (indexError) {
      console.error("Registration index sync failed:", indexError.message);
    }
  }
  catch (error){
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
