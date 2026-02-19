import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    participantType: {
      type: String,
      enum: ["IIIT", "NON_IIIT"],
      default: "IIIT",
    },
    collegeName: { type: String, default: "" },
    rollNumber: { type: String, unique: true, sparse: true },
    contactNumber: String,
    interests: [{ type: String }],
    department: String,
    year: Number,
    role: {
      type: String,
      default: "participant",
    },
    followedOrganizers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Organizer" },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Participant", participantSchema);
