import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const passwordResetRequestSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  newPasswordHash: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  adminNote: { type: String, default: "" },
  appliedByOrganizer: { type: Boolean, default: false },
  requestedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

const organizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    establishedYear: { type: Number },
    memberCount: { type: Number },
    contactPhone: { type: String, default: "" },
    website: { type: String, default: "" },
    socialMedia: {
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Participant" }],
    passwordResetRequests: [passwordResetRequestSchema],
    role: { type: String, default: "organizer" },
  },
  { timestamps: true }
);

// ✅ Only hash password if it was explicitly modified
organizerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Organizer", organizerSchema);