import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Registration dialog
  const [registerDialog, setRegisterDialog] = useState(false);
  const [customResponses, setCustomResponses] = useState({});
  const [registering, setRegistering] = useState(false);

  const fetchEventDetails = async () => {
    try {
      const res = await API.get(`/participant/event/${eventId}`);
      setEvent(res.data.event);
      setStats(res.data.stats);

      // Initialize custom responses
      const initialResponses = {};
      if (res.data.event.customFields) {
        res.data.event.customFields.forEach((field) => {
          initialResponses[field.label] = field.fieldType === "CHECKBOX" ? false : "";
        });
      }
      setCustomResponses(initialResponses);
    } catch (err) {
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setRegistering(true);

    try {
      // Convert responses to array format
      const customFieldResponses = Object.keys(customResponses).map((label) => ({
        fieldLabel: label,
        fieldType: event.customFields.find((f) => f.label === label)?.fieldType,
        response: customResponses[label],
      }));

      const res = await API.post("/registration/register", {
        eventId,
        customFieldResponses,
      });

      setSuccess("Registration successful!");
      setTimeout(() => {
        setRegisterDialog(false);
        navigate("/participant/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleCustomFieldChange = (label, value) => {
    setCustomResponses((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const renderCustomField = (field) => {
    const value = customResponses[field.label] || "";

    switch (field.fieldType) {
      case "TEXT":
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            required={field.required}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
          />
        );

      case "NUMBER":
        return (
          <TextField
            fullWidth
            type="number"
            size="small"
            label={field.label}
            required={field.required}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
          />
        );

      case "EMAIL":
        return (
          <TextField
            fullWidth
            type="email"
            size="small"
            label={field.label}
            required={field.required}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
          />
        );

      case "PHONE":
        return (
          <TextField
            fullWidth
            type="tel"
            size="small"
            label={field.label}
            required={field.required}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
          />
        );

      case "DROPDOWN":
        return (
          <FormControl fullWidth size="small" required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
            >
              {field.options?.map((opt, idx) => (
                <MenuItem key={idx} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "CHECKBOX":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) =>
                  handleCustomFieldChange(field.label, e.target.checked)
                }
                sx={{ color: "#673ab7", "&.Mui-checked": { color: "#673ab7" } }}
              />
            }
            label={field.label + (field.required ? " *" : "")}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <ParticipantNavbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress sx={{ color: "#673ab7" }} />
        </Box>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <ParticipantNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Event not found</Alert>
        </Container>
      </Box>
    );
  }

  const isDeadlinePassed = stats?.isDeadlinePassed || false;
  const isLimitReached = stats?.isLimitReached || false;
  const canRegister = !isDeadlinePassed && !isLimitReached;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          onClick={() => navigate("/participant/browse")}
          sx={{ mb: 2, textTransform: "none", color: "#673ab7" }}
        >
          ← Back to Browse
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Event Header */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
              >
                {event.name}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Chip
                  label={event.type === "NORMAL" ? "Workshop" : "Merchandise"}
                  size="small"
                  sx={{ bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: 600 }}
                />
                <Chip
                  label={event.eligibility || "Open to All"}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body1" sx={{ color: "#666", mb: 2 }}>
                Organized by{" "}
                <strong>{event.organizerId?.name || "Unknown"}</strong>
              </Typography>
            </Box>

            {canRegister && (
              <Button
                variant="contained"
                size="large"
                onClick={() => setRegisterDialog(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "#673ab7",
                  borderRadius: 2,
                  px: 4,
                  "&:hover": { bgcolor: "#5e35b1" },
                }}
              >
                Register Now
              </Button>
            )}

            {isDeadlinePassed && (
              <Chip
                label="Registration Closed"
                color="error"
                sx={{ fontWeight: 600 }}
              />
            )}

            {isLimitReached && !isDeadlinePassed && (
              <Chip
                label="Seats Full"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>

          {/* Event Info Grid */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarTodayIcon sx={{ color: "#673ab7", mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    Start Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarTodayIcon sx={{ color: "#673ab7", mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    End Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(event.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationOnIcon sx={{ color: "#673ab7", mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    Venue
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {event.venue || "TBA"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AttachMoneyIcon sx={{ color: "#673ab7", mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    Registration Fee
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {event.registrationFee > 0
                      ? `₹${event.registrationFee}`
                      : "Free"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PeopleIcon sx={{ color: "#673ab7", mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    Registrations
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats?.totalRegs || 0}
                    {event.registrationLimit
                      ? ` / ${event.registrationLimit}`
                      : ""}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarTodayIcon sx={{ color: "#673ab7", mr: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#888" }}>
                    Registration Deadline
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(event.registrationDeadline).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Description */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
          >
            About this Event
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.8 }}>
            {event.description || "No description available."}
          </Typography>
        </Paper>

        {/* Organizer Info */}
        {event.organizerId && (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4 }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
            >
              Organized By
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              {event.organizerId.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
              {event.organizerId.category}
            </Typography>
            {event.organizerId.description && (
              <Typography variant="body2" sx={{ color: "#666" }}>
                {event.organizerId.description}
              </Typography>
            )}
          </Paper>
        )}

        {/* Registration Dialog */}
        <Dialog
          open={registerDialog}
          onClose={() => setRegisterDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Register for {event.name}
          </DialogTitle>
          <DialogContent>
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

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Please fill in all required fields to complete your registration.
            </Alert>

            {event.customFields && event.customFields.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {event.customFields.map((field, index) => (
                  <Box key={index}>{renderCustomField(field)}</Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: "#666", textAlign: "center", py: 2 }}>
                No additional information required. Click register to confirm.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setRegisterDialog(false)}
              disabled={registering}
              sx={{ textTransform: "none", color: "#666" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegister}
              variant="contained"
              disabled={registering}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                "&:hover": { bgcolor: "#5e35b1" },
              }}
            >
              {registering ? <CircularProgress size={24} /> : "Register"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default EventDetails;
