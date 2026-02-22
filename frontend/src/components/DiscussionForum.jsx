import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import API from "../services/api";

const REACTIONS = ["👍", "❤️", "🔥", "👏", "❓"];

const decodeToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const senderName = (message) => {
  if (!message?.sender) return "Unknown";
  if (message.senderModel === "Organizer") {
    return message.sender.name || "Organizer";
  }
  return `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() || "Participant";
};

const buildThread = (messages) => {
  const byId = new Map();
  const roots = [];

  messages.forEach((message) => {
    byId.set(String(message._id), { ...message, replies: [] });
  });

  byId.forEach((message) => {
    const parentId = message.parentMessage ? String(message.parentMessage) : "";
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).replies.push(message);
    } else {
      roots.push(message);
    }
  });

  const sortReplies = (list) => {
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    list.forEach((item) => sortReplies(item.replies));
  };

  roots.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  roots.forEach((item) => sortReplies(item.replies));

  return roots;
};

const DiscussionForum = ({ eventId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postText, setPostText] = useState("");
  const [postAsAnnouncement, setPostAsAnnouncement] = useState(false);
  const [replyTextById, setReplyTextById] = useState({});
  const [activeReplyId, setActiveReplyId] = useState("");
  const [canPost, setCanPost] = useState(false);
  const [isOrganizerModerator, setIsOrganizerModerator] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [notice, setNotice] = useState(null);
  const [posting, setPosting] = useState(false);
  const latestSeenRef = useRef(0);
  const user = decodeToken();

  const thread = useMemo(() => buildThread(messages), [messages]);

  const fetchMessages = async ({ initial = false } = {}) => {
    try {
      if (initial) setLoading(true);
      const res = await API.get(`/discussions/${eventId}`);
      const incoming = Array.isArray(res.data?.messages) ? res.data.messages : [];

      if (incoming.length > 0) {
        const latestTimestamp = Math.max(
          ...incoming.map((msg) => new Date(msg.createdAt).getTime() || 0)
        );

        if (!latestSeenRef.current) {
          latestSeenRef.current = latestTimestamp;
        } else if (latestTimestamp > latestSeenRef.current) {
          const delta = incoming.filter(
            (msg) => (new Date(msg.createdAt).getTime() || 0) > latestSeenRef.current
          ).length;
          setNewMessageCount((prev) => prev + Math.max(delta, 1));
          latestSeenRef.current = latestTimestamp;
        }
      }

      setMessages(incoming);
      setCanPost(Boolean(res.data?.canPost));
      setIsOrganizerModerator(Boolean(res.data?.isOrganizerModerator));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load discussion.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages({ initial: true });
    const interval = setInterval(() => fetchMessages(), 4000);
    return () => clearInterval(interval);
  }, [eventId]);

  const submitMessage = async ({ content, parentMessage = null, isAnnouncement = false }) => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await API.post("/discussions", {
        eventId,
        content: content.trim(),
        parentMessage,
        isAnnouncement,
      });
      await fetchMessages();
      setNotice({ type: "success", text: "Message posted." });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Failed to post message.",
      });
    } finally {
      setPosting(false);
    }
  };

  const submitPost = async () => {
    await submitMessage({
      content: postText,
      isAnnouncement: Boolean(postAsAnnouncement && isOrganizerModerator),
    });
    setPostText("");
    setPostAsAnnouncement(false);
  };

  const submitReply = async (messageId) => {
    await submitMessage({
      content: replyTextById[messageId] || "",
      parentMessage: messageId,
    });
    setReplyTextById((prev) => ({ ...prev, [messageId]: "" }));
    setActiveReplyId("");
  };

  const react = async (messageId, type) => {
    try {
      await API.patch(`/discussions/react/${messageId}`, { type });
      await fetchMessages();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Failed to react.",
      });
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await API.delete(`/discussions/${messageId}`);
      await fetchMessages();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Failed to delete message.",
      });
    }
  };

  const togglePin = async (messageId, isPinned) => {
    try {
      await API.patch(`/discussions/pin/${messageId}`, { isPinned: !isPinned });
      await fetchMessages();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Failed to pin/unpin message.",
      });
    }
  };

  const isOwnMessage = (message) => {
    if (!user?.id) return false;
    const sameSender = message?.sender?._id === user.id;
    const roleModel = user.role === "organizer" ? "Organizer" : "Participant";
    return sameSender && message.senderModel === roleModel;
  };

  const renderMessage = (message, depth = 0) => (
    <Box key={message._id} sx={{ ml: depth > 0 ? 3 : 0, mt: 1.5 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderColor: message.isPinned ? "#673ab7" : "#e0e0e0",
          bgcolor: message.isAnnouncement ? "#fff8e1" : "white",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
          <Typography variant="subtitle2">{senderName(message)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(message.createdAt).toLocaleString()}
          </Typography>
          {message.isAnnouncement && <Chip label="Announcement" size="small" color="warning" />}
          {message.isPinned && <Chip label="Pinned" size="small" color="secondary" />}
          {message.isDeleted && <Chip label="Deleted" size="small" />}
        </Stack>

        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
          {message.content}
        </Typography>

        {!message.isDeleted && (
          <Stack direction="row" spacing={0.75} mb={1} flexWrap="wrap">
            {REACTIONS.map((reaction) => {
              const count =
                message.reactions?.filter((item) => item.type === reaction).length || 0;
              return (
                <Button
                  key={`${message._id}-${reaction}`}
                  size="small"
                  variant={count ? "contained" : "outlined"}
                  onClick={() => react(message._id, reaction)}
                  sx={{ minWidth: 44, textTransform: "none", px: 1 }}
                >
                  {reaction} {count ? count : ""}
                </Button>
              );
            })}
          </Stack>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {!message.isDeleted && canPost && (
            <Button size="small" onClick={() => setActiveReplyId(message._id)}>
              Reply
            </Button>
          )}

          {(isOrganizerModerator || isOwnMessage(message)) && !message.isDeleted && (
            <Button size="small" color="error" onClick={() => deleteMessage(message._id)}>
              Delete
            </Button>
          )}

          {isOrganizerModerator && (
            <Button size="small" color="secondary" onClick={() => togglePin(message._id, message.isPinned)}>
              {message.isPinned ? "Unpin" : "Pin"}
            </Button>
          )}
        </Stack>

        {activeReplyId === message._id && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a reply..."
              value={replyTextById[message._id] || ""}
              onChange={(e) =>
                setReplyTextById((prev) => ({ ...prev, [message._id]: e.target.value }))
              }
            />
            <Button
              variant="contained"
              onClick={() => submitReply(message._id)}
              disabled={posting}
              sx={{ textTransform: "none" }}
            >
              Send
            </Button>
          </Stack>
        )}
      </Paper>

      {message.replies?.length > 0 &&
        message.replies.map((reply) => renderMessage(reply, depth + 1))}
    </Box>
  );

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ mt: 3, p: 3, textAlign: "center" }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 3, mt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
          Discussion Forum
        </Typography>
        {newMessageCount > 0 && (
          <Chip
            color="info"
            label={`${newMessageCount} new message${newMessageCount > 1 ? "s" : ""}`}
            onDelete={() => setNewMessageCount(0)}
          />
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {notice && <Alert severity={notice.type} sx={{ mb: 1.5 }}>{notice.text}</Alert>}
      {!canPost && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Register for this event to post, reply, and react in the discussion forum.
        </Alert>
      )}

      {canPost && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Ask a question, share updates, or start a discussion..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
          <Stack direction="row" spacing={1} mt={1}>
            {isOrganizerModerator && (
              <Button
                size="small"
                variant={postAsAnnouncement ? "contained" : "outlined"}
                onClick={() => setPostAsAnnouncement((prev) => !prev)}
              >
                Announcement
              </Button>
            )}
            <Button
              variant="contained"
              onClick={submitPost}
              disabled={posting || !postText.trim()}
              sx={{ textTransform: "none" }}
            >
              Post Message
            </Button>
          </Stack>
        </Box>
      )}

      <Divider />
      <Box sx={{ mt: 1.5 }}>
        {thread.length === 0 ? (
          <Typography color="text.secondary">
            No discussion messages yet. Start the conversation.
          </Typography>
        ) : (
          thread.map((message) => renderMessage(message))
        )}
      </Box>
    </Paper>
  );
};

export default DiscussionForum;
