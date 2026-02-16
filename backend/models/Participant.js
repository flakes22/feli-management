import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "",
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "participant",
    },
    participantType: {
      type: String,
      enum: ["IIIT", "NON_IIIT"],
      required: true,
    },
    collegeName: {
      type: String,
      default: "",
    },
    contactNumber: {
      type: String,
      default: "",
    },
    interests: [
      {
        type: String,
      },
    ],
    followedClubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizer",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Participant", participantSchema);