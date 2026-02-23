import mongoose from "mongoose";
import Organizer from "./backend/models/Organizer.js";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const org = await Organizer.findOne();
  if(!org) return console.log("No orgs");
  
  console.log("Original isActive:", org.isActive);
  org.isActive = !org.isActive;
  try {
    await org.save();
    console.log("Saved successfully! isActive:", org.isActive);
  } catch(e) {
    console.error("Save error:", e);
  }
  process.exit(0);
}
test();
