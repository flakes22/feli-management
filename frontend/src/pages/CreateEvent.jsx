import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import API from "../services/api";
import OrganizerNavbar from "../components/OrganizerNavbar";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Basic Details
  const [name, setName] = useState("");
  const [type, setType] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [eligibility, setEligibility] = useState("Open to All");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [registrationLimit, setRegistrationLimit] = useState("");
  const [registrationFee, setRegistrationFee] = useState("0");

  // Custom Fields
  const [customFields, setCustomFields] = useState([]);
  const [newFieldType, setNewFieldType] = useState("TEXT");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const handleSaveDraft = async () => {
    setError("");
    setSuccess("");

    if (!name || !startDate || !endDate || !registrationDeadline) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await API.post("/organizer/event/event", {
        name,
        type,
        description,
        startDate,
        endDate,
        venue,
        eligibility,
        registrationDeadline,
        registrationLimit: registrationLimit || null,
        registrationFee: parseFloat(registrationFee) || 0,
        customFields,
        status: "DRAFT",
      });

      setSuccess("Event saved as draft!");
      setTimeout(() => navigate("/organizer/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    }
  };

  const handlePublish = async () => {
    setError("");
    setSuccess("");

    if (!name || !startDate || !endDate || !registrationDeadline) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await API.post("/organizer/event/event", {
        name,
        type,
        description,
        startDate,
        endDate,
        venue,
        eligibility,
        registrationDeadline,
        registrationLimit: registrationLimit || null,
        registrationFee: parseFloat(registrationFee) || 0,
        customFields,
        status: "PUBLISHED",
      });

      setSuccess("Event published successfully!");
      setTimeout(() => navigate("/organizer/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish event");
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) {
      setError("Field label is required");
      return;
    }

    setCustomFields([
      ...customFields,
      {
        fieldType: newFieldType,
        label: newFieldLabel.trim(),
        required: newFieldRequired,
      },
    ]);

    setNewFieldLabel("");
    setNewFieldRequired(false);
    setError("");
  };

  const handleRemoveField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <OrganizerNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Create Event
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#ccc",
                color: "#666",
                borderRadius: 2,
                px: 3,
                "&:hover": { borderColor: "#999" },
              }}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                borderRadius: 2,
                px: 3,
                "&:hover": { bgcolor: "#5e35b1" },
              }}
            >
              Publish Event
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3 }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              borderBottom: "1px solid #e0e0e0",
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                color: "#666",
              },
              "& .Mui-selected": {
                color: "#673ab7 !important",
              },
              "& .MuiTabs-indicator": {
                bgcolor: "#673ab7",
              },
            }}
          >
            <Tab label="Basic Details" />
            <Tab label="Registration Form" />
          </Tabs>

          <Box sx={{ p: 4 }}>
            {/* TAB 0: Basic Details */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Event Name *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter event name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Event Type *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <MenuItem value="NORMAL">Workshop</MenuItem>
                    <MenuItem value="MERCH">Merchandise</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Description *
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    placeholder="Describe your event"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Start Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    End Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Venue *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Event venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Eligibility *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                  >
                    <MenuItem value="Open to All">Open to All</MenuItem>
                    <MenuItem value="IIIT Students Only">IIIT Students Only</MenuItem>
                    <MenuItem value="External Only">External Only</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Registration Deadline *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Max Participants *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    placeholder="100"
                    value={registrationLimit}
                    onChange={(e) => setRegistrationLimit(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                    Registration Fee (₹)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    placeholder="0"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                  />
                </Grid>
              </Grid>
            )}

            {/* TAB 1: Registration Form */}
            {activeTab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Create custom registration fields for your event. Form will be locked after first registration.
                </Alert>

                {/* Existing Custom Fields */}
                {customFields.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#1a1a2e" }}>
                      Custom Fields
                    </Typography>
                    {customFields.map((field, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          mb: 1,
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                            {field.label}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                            <Chip label={field.fieldType} size="small" variant="outlined" />
                            {field.required && (
                              <Chip label="Required" size="small" color="error" />
                            )}
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveField(index)}
                          sx={{ color: "#d32f2f" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Add Custom Field Section */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#1a1a2e" }}>
                  Add Custom Field
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                      Field Type
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                    >
                      <MenuItem value="TEXT">Text Input</MenuItem>
                      <MenuItem value="NUMBER">Number</MenuItem>
                      <MenuItem value="EMAIL">Email</MenuItem>
                      <MenuItem value="PHONE">Phone</MenuItem>
                      <MenuItem value="DROPDOWN">Dropdown</MenuItem>
                      <MenuItem value="CHECKBOX">Checkbox</MenuItem>
                    </Select>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
                      Field Label
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., T-Shirt Size"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newFieldRequired}
                          onChange={(e) => setNewFieldRequired(e.target.checked)}
                          sx={{ color: "#673ab7", "&.Mui-checked": { color: "#673ab7" } }}
                        />
                      }
                      label="Required Field"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleAddCustomField}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor: "#00897b",
                        borderRadius: 2,
                        "&:hover": { bgcolor: "#00796b" },
                      }}
                    >
                      Add Field
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateEvent;