import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    type: {
      type: String,
      enum: ["NORMAL", "MERCH"],
      required: true,
    },

    eligibility: String,
    registrationDeadline: Date,
    startDate: Date,
    endDate: Date,

    registrationLimit: Number,
    registrationFee: { type: Number, default: 0 },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },

    tags: [String],

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ONGOING", "CLOSED"],
      default: "DRAFT",
    },

    customFormFields: [
      {
        label: String,
        type: String,
        required: Boolean,
        options: [String],
      },
    ],

    variants: [
      {
        size: String,
        color: String,
        price: Number,
      },
    ],

    stock: Number,
    purchaseLimit: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
