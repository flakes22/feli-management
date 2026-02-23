import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

dotenv.config();

await connectDB();

const seedAdmin = async () => {
  const existing = await Admin.findOne({
    email: "admin@felicity.com",
  });

  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    email: "admin@felicity.com",
    password: hashedPassword,
  });

  console.log("Admin created successfully");
  process.exit();
};

seedAdmin();
