import { useEffect, useState } from "react";
import {
  Container,
  TextField,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

import OrganizerNavbar from "../components/OrganizerNavbar";
import API from "../services/api";

const OrganizerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Password Change Dialog
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordReason, setPasswordReason] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Editable fields state
  const [description, setDescription] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await API.get("/organizer/profile");
      setProfile(res.data.organizer);
      setStats(res.data.stats);

      // Initialize editable fields
      setDescription(res.data.organizer.description || "");
      setEstablishedYear(res.data.organizer.establishedYear || "");
      setMemberCount(res.data.organizer.memberCount || "");
      setContactPhone(res.data.organizer.contactPhone || "");
      setWebsite(res.data.organizer.website || "");
      setTwitter(res.data.organizer.socialMedia?.twitter || "");
      setInstagram(res.data.organizer.socialMedia?.instagram || "");
      setLinkedin(res.data.organizer.socialMedia?.linkedin || "");
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    try {
      await API.put("/organizer/profile", {
        description,
        establishedYear: establishedYear || null,
        memberCount: memberCount || null,
        contactPhone,
        website,
        socialMedia: {
          twitter,
          instagram,
          linkedin,
        },
      });

      setSuccess("Profile updated successfully!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setDescription(profile.description || "");
    setEstablishedYear(profile.establishedYear || "");
    setMemberCount(profile.memberCount || "");
    setContactPhone(profile.contactPhone || "");
    setWebsite(profile.website || "");
    setTwitter(profile.socialMedia?.twitter || "");
    setInstagram(profile.socialMedia?.instagram || "");
    setLinkedin(profile.socialMedia?.linkedin || "");
    setEditMode(false);
    setError("");
  };

  const handlePasswordRequest = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordReason.trim()) {
      setPasswordError("Please provide a reason for password reset");
      return;
    }

    try {
      await API.post("/organizer/request-password-reset", {
        reason: passwordReason,
      });

      setPasswordSuccess(
        "Password reset request submitted! Admin will review your request."
      );
      setPasswordReason("");
      setTimeout(() => {
        setPasswordDialog(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to submit request"
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <OrganizerNavbar />
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
            Organizer Profile
          </Typography>

          {!editMode ? (
            <Button
              variant="contained"
              onClick={() => setEditMode(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                borderRadius: 2,
                px: 3,
                "&:hover": { bgcolor: "#5e35b1" },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#ccc",
                  color: "#666",
                  borderRadius: 2,
                  "&:hover": { borderColor: "#999" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveProfile}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "#00897b",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#00796b" },
                }}
              >
                Save Changes
              </Button>
            </Box>
          )}
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

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#888", mb: 0.5 }}>
                Total Events
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
                {stats?.totalEvents || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#888", mb: 0.5 }}>
                Upcoming
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1976d2" }}>
                {stats?.upcomingEvents || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#888", mb: 0.5 }}>
                Completed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                {stats?.completedEvents || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#888", mb: 0.5 }}>
                Participants
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#673ab7" }}>
                {stats?.totalParticipants || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#888", mb: 0.5 }}>
                Followers
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#00897b" }}>
                {stats?.followers || 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Basic Information */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}
          >
            Basic Information
          </Typography>

          <Grid container spacing={3}>
            {/* NON-EDITABLE: Organization Name */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Organization Name (Non-editable)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={profile?.name || ""}
                disabled
                sx={{
                  bgcolor: "#f5f5f5",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#888",
                  },
                }}
              />
            </Grid>

            {/* NON-EDITABLE: Category */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Category (Non-editable)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={profile?.category || ""}
                disabled
                sx={{
                  bgcolor: "#f5f5f5",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#888",
                  },
                }}
              />
            </Grid>

            {/* EDITABLE: Description */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!editMode}
                placeholder="Describe your organization..."
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>

            {/* EDITABLE: Established Year */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Established Year
              </Typography>
              <TextField
                fullWidth
                type="number"
                size="small"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                disabled={!editMode}
                placeholder="2015"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>

            {/* EDITABLE: Member Count */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Member Count
              </Typography>
              <TextField
                fullWidth
                type="number"
                size="small"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                disabled={!editMode}
                placeholder="450"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Contact Information */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}
          >
            Contact Information
          </Typography>

          <Grid container spacing={3}>
            {/* NON-EDITABLE: Email */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Email (Non-editable)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={profile?.email || profile?.contactEmail || ""}
                disabled
                sx={{
                  bgcolor: "#f5f5f5",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#888",
                  },
                }}
              />
            </Grid>

            {/* EDITABLE: Phone Number */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Phone Number
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!editMode}
                placeholder="+91 98765 43210"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>

            {/* EDITABLE: Website */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Website
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={!editMode}
                placeholder="https://techclub.university.edu"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Social Media - ALL EDITABLE */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}
          >
            Social Media
          </Typography>

          <Grid container spacing={3}>
            {/* EDITABLE: Twitter */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Twitter Handle
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                disabled={!editMode}
                placeholder="@techclub_iiit"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>

            {/* EDITABLE: Instagram */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                Instagram Handle
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={!editMode}
                placeholder="@techclub_official"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>

            {/* EDITABLE: LinkedIn */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
              >
                LinkedIn
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                disabled={!editMode}
                placeholder="techclub-iiit"
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Security Settings */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4 }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
          >
            Security Settings
          </Typography>

          <Button
            variant="outlined"
            onClick={() => setPasswordDialog(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#673ab7",
              color: "#673ab7",
              borderRadius: 2,
              "&:hover": {
                borderColor: "#5e35b1",
                bgcolor: "rgba(103, 58, 183, 0.04)",
              },
            }}
          >
            Change Password
          </Button>
        </Paper>

        {/* Password Change Dialog */}
        <Dialog
          open={passwordDialog}
          onClose={() => setPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Request Password Reset
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2, mt: 1, borderRadius: 2 }}>
              Password reset requests must be approved by admin. Please provide a
              reason for your request.
            </Alert>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {passwordSuccess}
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for Password Reset"
              value={passwordReason}
              onChange={(e) => setPasswordReason(e.target.value)}
              placeholder="e.g., Forgot my password, security concern, etc."
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setPasswordDialog(false)}
              sx={{ textTransform: "none", color: "#666" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordRequest}
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                "&:hover": { bgcolor: "#5e35b1" },
              }}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OrganizerProfile;
