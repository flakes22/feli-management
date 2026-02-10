import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["REGISTERED", "CANCELLED", "COMPLETED"],
      default: "REGISTERED",
    },
    ticketId: {
      type: String,
      unique: true,
    },
    qrCode: {
      type: String, // base64 image
    },
    formResponses: {
      type: Object,
    },
    attendanceMarked: {
        type: Boolean,
        default: false,
      },
      attendanceTime: {
        type: Date,
      },
      attendanceMarkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizer",
      },
      
  },
  { timestamps: true }
);

export default mongoose.model("Registration", registrationSchema);
