import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    reactor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "reactorModel",
    },
    reactorModel: {
      type: String,
      required: true,
      enum: ["Participant", "Organizer"],
    },
    type: { type: String, required: true }, // 👍 ❤️ 🔥 etc
  },
  { _id: false }
);

const discussionMessageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Participant", "Organizer"],
    },
    content: { type: String, required: true },

    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionMessage",
      default: null,
    },
    isAnnouncement: { type: Boolean, default: false },

    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

discussionMessageSchema.index({ eventId: 1, createdAt: -1 });
discussionMessageSchema.index({ parentMessage: 1, createdAt: 1 });

export default mongoose.model("DiscussionMessage", discussionMessageSchema);
