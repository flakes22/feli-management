import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "QR_SCAN_SUCCESS",
        "QR_SCAN_DUPLICATE",
        "MANUAL_OVERRIDE",
      ],
      required: true,
    },
    metadata: {
      type: Object,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
