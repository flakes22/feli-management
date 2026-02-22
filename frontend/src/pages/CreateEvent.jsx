import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  FormControlLabel,
  Checkbox,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import API from "../services/api";
import OrganizerNavbar from "../components/OrganizerNavbar";

const STEPS = ["Basic Details", "Custom Form Fields", "Review & Publish"];

const FIELD_TYPES = [
  { value: "TEXT", label: "Text Input" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "FILE", label: "File Upload" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
];

const emptyField = () => ({
  label: "",
  fieldType: "TEXT",
  required: false,
  options: "",
  tempId: Date.now() + Math.random(),
});

const CreateEvent = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Basic Details
  const [name, setName] = useState("");
  const [type, setType] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [registrationFee, setRegistrationFee] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [eligibility, setEligibility] = useState("Open to All");
  const [savedEventId, setSavedEventId] = useState(null);

  // Step 2: Custom Fields
  const [customFields, setCustomFields] = useState([]);

  // ── Step 1 Validation ──
  const validateStep1 = () => {
    if (!name.trim()) return "Event name is required.";
    if (!description.trim()) return "Description is required.";
    if (!venue.trim()) return "Venue is required.";
    if (!startDate) return "Start date is required.";
    if (!endDate) return "End date is required.";
    if (new Date(endDate) < new Date(startDate))
      return "End date must be after start date.";
    if (!registrationDeadline) return "Registration deadline is required.";
    if (new Date(registrationDeadline) > new Date(startDate))
      return "Registration deadline must be before start date.";
    return null;
  };

  // ── Save Draft (Step 1 → Step 2) ──
  const handleSaveDraft = async () => {
    const err = validateStep1();
    if (err) return setError(err);

    setLoading(true);
    setError("");
    try {
      const payload = {
        name,
        type,
        description,
        venue,
        startDate,
        endDate,
        registrationDeadline,
        registrationFee: Number(registrationFee),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        eligibility,
        status: "DRAFT",
      };

      let res;
      if (savedEventId) {
        res = await API.put(`/organizer/events/${savedEventId}`, payload);
        setSuccess("Draft updated!");
      } else {
        res = await API.post("/organizer/events", payload);
        setSavedEventId(res.data.event._id);
        setSuccess("Event saved as Draft!");
      }
      setTimeout(() => setSuccess(""), 2000);
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  // ── Save Custom Fields (Step 2 → Step 3) ──
  const handleSaveFields = async () => {
    // Validate fields
    for (const f of customFields) {
      if (!f.label.trim()) return setError("All field labels are required.");
      if (
        (f.fieldType === "DROPDOWN") &&
        (!f.options || !f.options.trim())
      )
        return setError(`Dropdown field "${f.label}" needs options (comma-separated).`);
    }

    setLoading(true);
    setError("");
    try {
      const formattedFields = customFields.map((f) => ({
        label: f.label,
        fieldType: f.fieldType,
        type: f.fieldType, // legacy compatibility for older backend shape
        required: f.required,
        options:
          (f.fieldType === "DROPDOWN")
            ? f.options?.split(",").map((o) => o.trim()).filter(Boolean) || []
            : [],
      }));

      await API.put(`/organizer/events/${savedEventId}`, {
        customFields: formattedFields,
      });

      setSuccess("Form fields saved!");
      setTimeout(() => setSuccess(""), 2000);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save fields");
    } finally {
      setLoading(false);
    }
  };

  // ── Publish Event ──
  const handlePublish = async () => {
    setLoading(true);
    setError("");
    try {
      await API.patch(`/organizer/events/${savedEventId}/publish`);
      setSuccess("Event published successfully!");
      setTimeout(() => navigate("/organizer/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish event");
    } finally {
      setLoading(false);
    }
  };

  // ── Save as Draft and Exit ──
  const handleSaveAndExit = async () => {
    if (!savedEventId) {
      const err = validateStep1();
      if (err) return setError(err);
      await handleSaveDraft();
    }
    navigate("/organizer/dashboard");
  };

  // ── Custom Fields Helpers ──
  const addField = () =>
    setCustomFields((prev) => [...prev, emptyField()]);

  const removeField = (tempId) =>
    setCustomFields((prev) => prev.filter((f) => f.tempId !== tempId));

  const updateField = (tempId, key, value) =>
    setCustomFields((prev) =>
      prev.map((f) => (f.tempId === tempId ? { ...f, [key]: value } : f))
    );

  const moveField = (index, direction) => {
    const newFields = [...customFields];
    const target = index + direction;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    setCustomFields(newFields);
  };

  // ────────────────────────────────
  //  RENDER
  // ────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <OrganizerNavbar />

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Title */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}
          >
            Create New Event
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Follow the steps to create and publish your event
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": { fontWeight: 600 },
                  "& .MuiStepIcon-root.Mui-active": { color: "#673ab7" },
                  "& .MuiStepIcon-root.Mui-completed": { color: "#673ab7" },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* ── STEP 0: Basic Details ── */}
        {activeStep === 0 && (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4 }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}
            >
              Basic Details
            </Typography>

            <Grid container spacing={3}>
              {/* Name */}
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Event Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Annual Tech Symposium 2026"
                />
              </Grid>

              {/* Type + Eligibility */}
              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Event Type *
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="MERCH">Merchandise</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Eligibility *
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                >
                  <MenuItem value="Open to All">Open to All</MenuItem>
                  <MenuItem value="IIIT Students Only">
                    IIIT Students Only
                  </MenuItem>
                  <MenuItem value="External Participants">
                    External Participants
                  </MenuItem>
                </TextField>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Description *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  size="small"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                />
              </Grid>

              {/* Venue */}
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Venue *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g., Auditorium A, Main Campus"
                />
              </Grid>

              {/* Dates */}
              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Start Date *
                </Typography>
                <TextField
                  fullWidth
                  type="datetime-local"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  End Date *
                </Typography>
                <TextField
                  fullWidth
                  type="datetime-local"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Registration Deadline *
                </Typography>
                <TextField
                  fullWidth
                  type="datetime-local"
                  size="small"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Fee + Limit */}
              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Registration Fee (₹)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                >
                  Max Participants (leave blank for unlimited)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  inputProps={{ min: 1 }}
                  placeholder="Unlimited"
                />
              </Grid>
            </Grid>

            {/* Actions */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 4,
                pt: 3,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleSaveAndExit}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#ccc",
                  color: "#666",
                  borderRadius: 2,
                }}
              >
                Save Draft & Exit
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveDraft}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "#673ab7",
                  borderRadius: 2,
                  px: 4,
                  "&:hover": { bgcolor: "#5e35b1" },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Save & Continue →"
                )}
              </Button>
            </Box>
          </Paper>
        )}

        {/* ── STEP 1: Form Builder ── */}
        {activeStep === 1 && (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1a1a2e" }}
              >
                Custom Registration Form
              </Typography>
              <Chip
                label="Form locked after first registration"
                size="small"
                sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
              Add custom fields to your registration form. Standard fields
              (Name, Email, Phone) are always included automatically.
            </Typography>

            {customFields.length === 0 ? (
              <Box
                sx={{
                  border: "2px dashed #e0e0e0",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  mb: 3,
                }}
              >
                <Typography sx={{ color: "#999", mb: 2 }}>
                  No custom fields added yet. Click below to add fields.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                {customFields.map((field, index) => (
                  <Paper
                    key={field.tempId}
                    elevation={0}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      p: 2.5,
                      mb: 2,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <DragIndicatorIcon sx={{ color: "#bbb" }} />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#673ab7" }}
                      >
                        Field {index + 1}
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      {/* Reorder */}
                      <IconButton
                        size="small"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => moveField(index, 1)}
                        disabled={index === customFields.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      {/* Delete */}
                      <IconButton
                        size="small"
                        onClick={() => removeField(field.tempId)}
                        sx={{ color: "#ef5350" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Field Label *"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.tempId, "label", e.target.value)
                          }
                          placeholder="e.g., T-Shirt Size"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Field Type"
                          value={field.fieldType}
                          onChange={(e) =>
                            updateField(
                              field.tempId,
                              "fieldType",
                              e.target.value
                            )
                          }
                        >
                          {FIELD_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                              {t.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.required}
                              onChange={(e) =>
                                updateField(
                                  field.tempId,
                                  "required",
                                  e.target.checked
                                )
                              }
                              sx={{
                                color: "#673ab7",
                                "&.Mui-checked": { color: "#673ab7" },
                              }}
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              Required
                            </Typography>
                          }
                        />
                      </Grid>

                      {/* Options input */}
                      {(field.fieldType === "DROPDOWN") && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Options (comma-separated) *"
                            value={field.options}
                            onChange={(e) =>
                              updateField(
                                field.tempId,
                                "options",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Small, Medium, Large, XL"
                            helperText="Separate each option with a comma"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Add Field Button */}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addField}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#673ab7",
                color: "#673ab7",
                borderRadius: 2,
                mb: 3,
                "&:hover": { bgcolor: "rgba(103,58,183,0.04)" },
              }}
            >
              Add Field
            </Button>

            <Divider sx={{ mb: 3 }} />

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#ccc",
                  color: "#666",
                  borderRadius: 2,
                }}
              >
                ← Back
              </Button>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCustomFields([]);
                    setActiveStep(2);
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#ccc",
                    color: "#666",
                    borderRadius: 2,
                  }}
                >
                  Skip (No Custom Fields)
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveFields}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "#673ab7",
                    borderRadius: 2,
                    px: 4,
                    "&:hover": { bgcolor: "#5e35b1" },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    "Save & Continue →"
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* ── STEP 2: Review & Publish ── */}
        {activeStep === 2 && (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4 }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}
            >
              Review & Publish
            </Typography>

            {/* Summary */}
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 3,
                mb: 3,
                bgcolor: "#fafafa",
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "#1a1a2e" }}
                  >
                    {name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Chip
                      label={type}
                      size="small"
                      sx={{
                        bgcolor: "#f3e5f5",
                        color: "#7b1fa2",
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label="DRAFT"
                      size="small"
                      sx={{
                        bgcolor: "#f5f5f5",
                        color: "#757575",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {description}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    VENUE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {venue}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    START DATE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {startDate
                      ? new Date(startDate).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    FEE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{registrationFee || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    CAPACITY
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {maxParticipants || "Unlimited"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Custom Fields Summary */}
            {customFields.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
                >
                  Custom Form Fields ({customFields.length})
                </Typography>
                {customFields.map((f, i) => (
                  <Chip
                    key={i}
                    label={`${f.label} (${f.fieldType})${f.required ? " *" : ""}`}
                    sx={{ mr: 1, mb: 1, bgcolor: "#f3e5f5", color: "#7b1fa2" }}
                  />
                ))}
              </Box>
            )}

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Publishing will make this event visible to participants. Once
              published, only limited edits are allowed.
            </Alert>

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#ccc",
                  color: "#666",
                  borderRadius: 2,
                }}
              >
                ← Back
              </Button>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/organizer/dashboard")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#ccc",
                    color: "#666",
                    borderRadius: 2,
                  }}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  onClick={handlePublish}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "#00897b",
                    borderRadius: 2,
                    px: 4,
                    "&:hover": { bgcolor: "#00796b" },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    "🚀 Publish Event"
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default CreateEvent;
