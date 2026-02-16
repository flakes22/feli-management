import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rollNumber: { type: String, unique: true, sparse: true },
    contactNumber: String,
    department: String,
    year: Number,
    followedOrganizers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Organizer" },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Participant", participantSchema);