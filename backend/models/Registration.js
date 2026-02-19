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
      enum: ["REGISTERED", "ATTENDED", "CANCELLED"],
      default: "REGISTERED",
    },
    registeredAt: { type: Date, default: Date.now },
    qrCode: String,
    // ✅ ticketNumber is unique per ticket but NOT a unique index
    // because multiple registrations exist in the collection
    ticketNumber: { type: String },
    customFieldResponses: [
      {
        fieldLabel: String,
        fieldType: String,
        response: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

// ✅ Only ONE active (non-cancelled) registration per participant per event
// This is a SPARSE PARTIAL index — allows multiple CANCELLED registrations
// but blocks duplicate ACTIVE ones
registrationSchema.index(
  { participantId: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["REGISTERED", "ATTENDED"] } },
    name: "unique_active_registration",
  }
);

// ✅ Fast lookup by eventId (for organizer dashboards)
registrationSchema.index({ eventId: 1 });

// ✅ Fast lookup by participantId (for participation history)
registrationSchema.index({ participantId: 1 });

export default mongoose.model("Registration", registrationSchema);
