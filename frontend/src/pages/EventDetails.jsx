import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  Paper,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GroupIcon from "@mui/icons-material/Group";
import CategoryIcon from "@mui/icons-material/Category";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/participant/event/${eventId}`);
      setData(res.data);
    } catch (err) {
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError("");
    setSuccess("");

    try {
      if (data.event.type === "MERCH") {
        await API.post("/registration/purchase", { eventId });
        setSuccess("Purchase successful! Check your email for the ticket.");
      } else {
        await API.post("/registration/register", { eventId });
        setSuccess("Registered successfully! Check your email for the ticket.");
      }
      // Refresh event data to update stats
      await fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <ParticipantNavbar />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress sx={{ color: "#673ab7" }} />
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <ParticipantNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Event not found or failed to load.
          </Alert>
          <Button
            onClick={() => navigate("/participant/browse")}
            sx={{ mt: 2, color: "#673ab7" }}
          >
            ← Back to Browse
          </Button>
        </Container>
      </Box>
    );
  }

  const { event, stats } = data;

  const isMerch = event.type === "MERCH";
  const isDeadlinePassed = stats.isDeadlinePassed;
  const isLimitReached = stats.isLimitReached;
  const isNotPublished = event.status !== "PUBLISHED";
  const isOutOfStock = isMerch && event.stock !== undefined && event.stock <= 0;

  const registrationBlocked =
    isNotPublished || isDeadlinePassed || isLimitReached || isOutOfStock;

  const getBlockReason = () => {
    if (isNotPublished) return "This event is not currently accepting registrations.";
    if (isDeadlinePassed) return "The registration deadline has passed.";
    if (isLimitReached) return isMerch ? "This item is out of stock." : "Registration limit has been reached.";
    if (isOutOfStock) return "This item is out of stock.";
    return "";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          onClick={() => navigate("/participant/browse")}
          sx={{
            color: "#673ab7",
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            pl: 0,
            "&:hover": { bgcolor: "transparent" },
          }}
        >
          ← Back to Browse
        </Button>

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column — Event Details */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 4,
              }}
            >
              {/* Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
                  {event.name}
                </Typography>
                <Chip
                  label={isMerch ? "Merchandise" : "Event"}
                  size="small"
                  sx={{
                    bgcolor: isMerch ? "#fff3e0" : "#f3e8ff",
                    color: isMerch ? "#e65100" : "#673ab7",
                    fontWeight: 600,
                  }}
                />
              </Box>

              {/* Status */}
              <Chip
                label={event.status}
                size="small"
                color={
                  event.status === "PUBLISHED"
                    ? "success"
                    : event.status === "DRAFT"
                    ? "default"
                    : event.status === "ONGOING"
                    ? "warning"
                    : "error"
                }
                variant="outlined"
                sx={{ fontWeight: 600, mb: 3 }}
              />

              <Divider sx={{ mb: 3 }} />

              {/* Description */}
              {event.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#555", lineHeight: 1.7 }}>
                    {event.description}
                  </Typography>
                </Box>
              )}

              {/* Details Grid */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}>
                  Event Details
                </Typography>

                <Grid container spacing={2}>
                  {/* Dates */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <CalendarTodayIcon sx={{ color: "#673ab7", mt: 0.3, fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          Start Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                          {formatDate(event.startDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <CalendarTodayIcon sx={{ color: "#673ab7", mt: 0.3, fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          End Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                          {formatDate(event.endDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Deadline */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <AccessTimeIcon sx={{ color: isDeadlinePassed ? "#d32f2f" : "#673ab7", mt: 0.3, fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          Registration Deadline
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: isDeadlinePassed ? "#d32f2f" : "#333",
                          }}
                        >
                          {formatDate(event.registrationDeadline)}
                          {isDeadlinePassed && " (Passed)"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Eligibility */}
                  {event.eligibility && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <CategoryIcon sx={{ color: "#673ab7", mt: 0.3, fontSize: "1.2rem" }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: "#888" }}>
                            Eligibility
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                            {event.eligibility}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {/* Fee */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <AttachMoneyIcon sx={{ color: "#673ab7", mt: 0.3, fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          {isMerch ? "Price" : "Registration Fee"}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                          {event.registrationFee ? `₹${event.registrationFee}` : "Free"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Registrations / Stock */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <GroupIcon sx={{ color: "#673ab7", mt: 0.3, fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          {isMerch ? "Stock Remaining" : "Registrations"}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                          {isMerch
                            ? event.stock !== undefined
                              ? `${event.stock} left`
                              : "Unlimited"
                            : `${stats.totalRegs}${event.registrationLimit ? ` / ${event.registrationLimit}` : ""}`}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Merch Variants */}
              {isMerch && event.variants && event.variants.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
                    Available Variants
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {event.variants.map((v, idx) => (
                      <Chip
                        key={idx}
                        label={`${v.size || ""}${v.color ? ` - ${v.color}` : ""}${v.price ? ` (₹${v.price})` : ""}`}
                        variant="outlined"
                        sx={{ borderColor: "#673ab7", color: "#673ab7" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {event.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        sx={{ bgcolor: "#f0f2f5", color: "#555" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column — Registration Card */}
          <Grid item xs={12} md={4}>
            {/* Organizer Card */}
            {event.organizerId && (
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 3,
                  p: 3,
                  mb: 3,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1.5 }}>
                  Organized by
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PersonIcon sx={{ color: "#673ab7" }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                      {event.organizerId.name}
                    </Typography>
                    {event.organizerId.category && (
                      <Typography variant="body2" sx={{ color: "#888" }}>
                        {event.organizerId.category}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {event.organizerId.description && (
                  <Typography variant="body2" sx={{ color: "#666", mt: 1.5 }}>
                    {event.organizerId.description}
                  </Typography>
                )}
                {event.organizerId.contactEmail && (
                  <Typography variant="body2" sx={{ color: "#888", mt: 1 }}>
                    Contact: {event.organizerId.contactEmail}
                  </Typography>
                )}
              </Paper>
            )}

            {/* Registration Action Card */}
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}>
                {isMerch ? "Purchase" : "Registration"}
              </Typography>

              {/* Price highlight */}
              <Box
                sx={{
                  bgcolor: "#f3e8ff",
                  borderRadius: 2,
                  p: 2,
                  textAlign: "center",
                  mb: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: "#673ab7", mb: 0.5 }}>
                  {isMerch ? "Price" : "Registration Fee"}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#673ab7" }}>
                  {event.registrationFee ? `₹${event.registrationFee}` : "Free"}
                </Typography>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    {isMerch ? "Stock" : "Spots"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#333" }}>
                    {isMerch
                      ? event.stock !== undefined
                        ? `${event.stock} remaining`
                        : "Unlimited"
                      : event.registrationLimit
                      ? `${event.registrationLimit - stats.totalRegs} remaining`
                      : "Unlimited"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    Deadline
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isDeadlinePassed ? "#d32f2f" : "#333",
                    }}
                  >
                    {formatShortDate(event.registrationDeadline)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    {isMerch ? "Total Purchases" : "Total Registrations"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#333" }}>
                    {stats.totalRegs}
                  </Typography>
                </Box>
              </Box>

              {/* Blocking Alerts */}
              {registrationBlocked && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2, borderRadius: 2, fontSize: "0.85rem" }}
                >
                  {getBlockReason()}
                </Alert>
              )}

              {/* Blocking Chips */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                {isDeadlinePassed && (
                  <Chip label="Deadline Passed" color="error" size="small" sx={{ fontWeight: 600 }} />
                )}
                {isLimitReached && (
                  <Chip
                    label={isMerch ? "Out of Stock" : "Limit Reached"}
                    color="error"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {isOutOfStock && !isLimitReached && (
                  <Chip label="Out of Stock" color="error" size="small" sx={{ fontWeight: 600 }} />
                )}
              </Box>

              {/* Register / Purchase Button */}
              <Button
                variant="contained"
                fullWidth
                disabled={registrationBlocked || registering}
                onClick={handleRegister}
                sx={{
                  py: 1.3,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: registrationBlocked ? undefined : "#673ab7",
                  "&:hover": {
                    bgcolor: "#5e35b1",
                  },
                }}
              >
                {registering
                  ? "Processing..."
                  : registrationBlocked
                  ? isMerch
                    ? "Purchase Unavailable"
                    : "Registration Closed"
                  : isMerch
                  ? "Purchase Now"
                  : "Register Now"}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EventDetails;
