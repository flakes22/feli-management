import DiscussionMessage from "../models/DiscussionMessage.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const ACTIVE_REGISTRATION_STATUSES = ["REGISTERED", "ATTENDED"];
const ALLOWED_REACTIONS = ["👍", "❤️", "🔥", "👏", "❓"];

const getRoleModel = (role) => {
  if (role === "organizer") return "Organizer";
  if (role === "participant") return "Participant";
  if (role === "admin") return "Admin";
  return null;
};

const verifyForumAccess = async ({ req, eventId, forPosting = false }) => {
  const role = req.user.role;

  const event = await Event.findById(eventId).select("_id organizerId");
  if (!event) {
    return { ok: false, status: 404, message: "Event not found" };
  }

  if (role === "organizer") {
    if (event.organizerId.toString() !== req.user.id.toString()) {
      return { ok: false, status: 403, message: "Not your event" };
    }
    return { ok: true, event, isOrganizerModerator: true, canPost: true };
  }

  if (role === "admin") {
    return { ok: true, event, isOrganizerModerator: true, canPost: true };
  }

  if (role !== "participant") {
    return { ok: false, status: 403, message: "Access denied" };
  }

  const registration = await Registration.findOne({
    participantId: req.user.id,
    eventId,
    status: { $in: ACTIVE_REGISTRATION_STATUSES },
  }).select("_id");

  if (!registration && forPosting) {
    return {
      ok: false,
      status: 403,
      message: "You must be registered for this event to post",
    };
  }

  return {
    ok: true,
    event,
    isOrganizerModerator: false,
    canPost: !!registration,
  };
};

export const getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const access = await verifyForumAccess({ req, eventId, forPosting: false });

    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const messages = await DiscussionMessage.find({ eventId })
      .populate("sender", "firstName lastName name email")
      .populate("reactions.reactor", "firstName lastName name")
      .sort({ isPinned: -1, createdAt: 1 });

    return res.json({
      messages,
      canPost: access.canPost || access.isOrganizerModerator,
      isOrganizerModerator: access.isOrganizerModerator,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { eventId, content, parentMessage, isAnnouncement = false } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const access = await verifyForumAccess({ req, eventId, forPosting: true });
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (isAnnouncement && !access.isOrganizerModerator) {
      return res.status(403).json({ message: "Only organizers can post announcements" });
    }

    if (parentMessage) {
      const parent = await DiscussionMessage.findOne({
        _id: parentMessage,
        eventId,
      }).select("_id");
      if (!parent) {
        return res.status(404).json({ message: "Parent message not found" });
      }
    }

    const senderModel = getRoleModel(req.user.role);
    if (!senderModel) {
      return res.status(403).json({ message: "Invalid role for messaging" });
    }

    const message = await DiscussionMessage.create({
      eventId,
      content: content.trim(),
      parentMessage: parentMessage || null,
      sender: req.user.id,
      senderModel,
      isAnnouncement: Boolean(isAnnouncement),
    });

    const populated = await DiscussionMessage.findById(message._id)
      .populate("sender", "firstName lastName name email")
      .populate("reactions.reactor", "firstName lastName name");

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await DiscussionMessage.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const access = await verifyForumAccess({
      req,
      eventId: message.eventId,
      forPosting: true,
    });
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const isOwner =
      message.sender.toString() === req.user.id.toString() &&
      message.senderModel === getRoleModel(req.user.role);

    if (!access.isOrganizerModerator && !isOwner) {
      return res.status(403).json({ message: "Not allowed to delete this message" });
    }

    message.isDeleted = true;
    message.content = "[deleted]";
    message.reactions = [];
    message.isAnnouncement = false;
    await message.save();

    return res.json({ message: "Message deleted successfully", id: message._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    const message = await DiscussionMessage.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const access = await verifyForumAccess({
      req,
      eventId: message.eventId,
      forPosting: false,
    });
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }
    if (!access.isOrganizerModerator) {
      return res.status(403).json({ message: "Only organizer can pin/unpin messages" });
    }

    message.isPinned = typeof isPinned === "boolean" ? isPinned : !message.isPinned;
    await message.save();

    return res.json({
      message: message.isPinned ? "Message pinned" : "Message unpinned",
      id: message._id,
      isPinned: message.isPinned,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!type || !ALLOWED_REACTIONS.includes(type)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const message = await DiscussionMessage.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot react to a deleted message" });
    }

    const access = await verifyForumAccess({
      req,
      eventId: message.eventId,
      forPosting: false,
    });
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const reactorModel = getRoleModel(req.user.role);
    const existingIndex = message.reactions.findIndex(
      (reaction) =>
        reaction.reactor.toString() === req.user.id.toString() &&
        reaction.reactorModel === reactorModel
    );

    if (existingIndex >= 0) {
      const current = message.reactions[existingIndex];
      if (current.type === type) {
        message.reactions.splice(existingIndex, 1);
      } else {
        current.type = type;
      }
    } else {
      message.reactions.push({
        reactor: req.user.id,
        reactorModel,
        type,
      });
    }

    await message.save();

    const updated = await DiscussionMessage.findById(id)
      .populate("sender", "firstName lastName name email")
      .populate("reactions.reactor", "firstName lastName name");

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
