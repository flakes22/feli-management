import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "textarea", "email", "number", "dropdown", "select", "checkbox", "radio", "file"],
    required: true,
  },
  options: [String],          // for dropdown/checkbox/radio
  required: { type: Boolean, default: false },
  placeholder: { type: String },
  description: { type: String },
  enabled: { type: Boolean, default: true },
});

const customFormSchema = new mongoose.Schema({
  fields: [fieldSchema],
  isLocked: { type: Boolean, default: false }, // locked after first registration
});

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    venue: { type: String, default: "" },

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

    customFields: [
      {
        label: String,
        fieldType: String,
        required: Boolean,
        options: [String],
      },
    ],

    // Legacy field kept for backward compatibility with older documents.
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

    customForm: { type: customFormSchema, default: () => ({ fields: [] }) },
  },
  { timestamps: true }
);

eventSchema.pre("save", function syncCustomFields() {
  const hasNew = Array.isArray(this.customFields) && this.customFields.length > 0;
  const hasLegacy =
    Array.isArray(this.customFormFields) && this.customFormFields.length > 0;

  if (!hasNew && hasLegacy) {
    this.customFields = this.customFormFields.map((f) => ({
      label: f.label,
      fieldType: f.fieldType || f.type || "TEXT",
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options : [],
    }));
  }

  if (hasNew) {
    this.customFormFields = this.customFields.map((f) => ({
      label: f.label,
      type: f.fieldType || f.type || "TEXT",
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options : [],
    }));
  }
});

export default mongoose.model("Event", eventSchema);
