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
    // Contact email for organizer profile/communication
    email: { type: String, required: true, unique: true },
    // Backward-compatible login email used by existing admin/organizer flows
    loginEmail: { type: String, unique: true, sparse: true },
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

// Hash password only when it changes.
// Promise-style middleware avoids `next is not a function` issues.
organizerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model("Organizer", organizerSchema);
