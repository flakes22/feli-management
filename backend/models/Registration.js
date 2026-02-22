import mongoose from "mongoose";

const formResponseSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true },
    label: { type: String },
    value: { type: mongoose.Schema.Types.Mixed }, // supports string, array, boolean
  },
  { _id: false }
);

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
    attendanceMarked: { type: Boolean, default: false },
    attendanceTime: { type: Date, default: null },
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      default: null,
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
    formResponses: [formResponseSchema],
  },
  { timestamps: true }
);

registrationSchema.virtual("ticketId").get(function ticketIdGetter() {
  return this.ticketNumber;
});

registrationSchema.virtual("ticketId").set(function ticketIdSetter(value) {
  this.ticketNumber = value;
});

registrationSchema.set("toJSON", { virtuals: true });
registrationSchema.set("toObject", { virtuals: true });

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
