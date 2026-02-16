import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    status: {
      type: String,
      enum: ["REGISTERED", "ATTENDED", "CANCELLED"],
      default: "REGISTERED",
    },
    registeredAt: { type: Date, default: Date.now },
    qrCode: String,
    ticketNumber: String,
    customFieldResponses: [
      {
        fieldLabel: String,
        fieldType: String,
        response: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Registration", registrationSchema);
