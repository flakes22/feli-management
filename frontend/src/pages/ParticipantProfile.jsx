import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";

import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const ParticipantProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");

  // Password change dialog
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await API.get("/participant/profile");
      console.log("Profile data:", res.data); // Debug log
      
      const p = res.data;
      setProfile(p);
      setFirstName(p.firstName || "");
      setLastName(p.lastName || "");
      setContactNumber(p.contactNumber || "");
      setCollegeName(p.collegeName || "");
      setInterests(p.interests || []);
    } catch (err) {
      console.error("Profile fetch error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to load profile");
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
      console.log("Updating profile with:", {
        firstName,
        lastName,
        contactNumber,
        collegeName,
        interests,
      });

      const res = await API.put("/participant/profile", {
        firstName,
        lastName,
        contactNumber,
        collegeName,
        interests,
      });

      console.log("Update response:", res.data);

      setSuccess("Profile updated successfully!");
      setEditMode(false);
      await fetchProfile();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setContactNumber(profile.contactNumber || "");
    setCollegeName(profile.collegeName || "");
    setInterests(profile.interests || []);
    setEditMode(false);
    setError("");
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleInterestKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      await API.delete(`/participant/unfollow/${organizerId}`);
      setSuccess("Unfollowed successfully");
      fetchProfile();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unfollow");
    }
  };

  const handleChangePassword = async () => {
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdError("New passwords do not match");
      return;
    }

    setPwdLoading(true);

    try {
      await API.put("/participant/change-password", {
        currentPassword,
        newPassword,
      });

      setPwdSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setTimeout(() => {
        setPwdOpen(false);
        setPwdSuccess("");
      }, 2000);
    } catch (err) {
      setPwdError(
        err.response?.data?.message || "Failed to change password"
      );
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Profile
          </Typography>

          {!editMode && (
            <Button
              variant="contained"
              onClick={() => setEditMode(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": { bgcolor: "#5e35b1" },
              }}
            >
              Edit Profile
            </Button>
          )}
        </Box>

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

        {/* Personal Information */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: 4,
            mb: 3,
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}
          >
            Personal Information
          </Typography>

          <Grid container spacing={3}>
            {/* First Name */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#555" }}
              >
                First Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!editMode}
                placeholder="Enter first name"
                sx={{
                  bgcolor: editMode ? "white" : "#fafafa",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#666",
                  },
                }}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#555" }}
              >
                Last Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!editMode}
                placeholder="Enter last name"
                sx={{
                  bgcolor: editMode ? "white" : "#fafafa",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#666",
                  },
                }}
              />
            </Grid>

            {/* Email (Non-editable) */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#555" }}
              >
                Email Address <span style={{ color: "#999" }}>(Non-editable)</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={profile?.email || ""}
                disabled
                sx={{
                  bgcolor: "#fafafa",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#666",
                  },
                }}
              />
            </Grid>

            {/* Contact Number */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#555" }}
              >
                Contact Number
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                disabled={!editMode}
                placeholder="+91 98765 43210"
                sx={{
                  bgcolor: editMode ? "white" : "#fafafa",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#666",
                  },
                }}
              />
            </Grid>

            {/* College/Organization */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#555" }}
              >
                College/Organization
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                disabled={!editMode}
                placeholder="IIIT Hyderabad"
                sx={{
                  bgcolor: editMode ? "white" : "#fafafa",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#666",
                  },
                }}
              />
            </Grid>

            {/* Participant Type (Non-editable) */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#555" }}
              >
                Participant Type <span style={{ color: "#999" }}>(Non-editable)</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={profile?.participantType || ""}
                disabled
                sx={{
                  bgcolor: "#fafafa",
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#666",
                  },
                }}
              />
            </Grid>
          </Grid>

          {editMode && (
            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
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
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveProfile}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "#673ab7",
                  borderRadius: 2,
                  px: 3,
                  "&:hover": { bgcolor: "#5e35b1" },
                }}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Paper>

        {/* Interests */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: 4,
            mb: 3,
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
          >
            Interests
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {interests.length === 0 && (
              <Typography variant="body2" sx={{ color: "#999" }}>
                No interests added yet.
              </Typography>
            )}
            {interests.map((interest, idx) => (
              <Chip
                key={idx}
                label={interest}
                onDelete={editMode ? () => handleRemoveInterest(interest) : undefined}
                sx={{
                  bgcolor: "#673ab7",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  "& .MuiChip-deleteIcon": { color: "white" },
                }}
              />
            ))}
          </Box>

          {editMode && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add an interest (e.g., Music, Tech, Sports)"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={handleInterestKeyDown}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddInterest}
                disabled={!newInterest.trim()}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#673ab7",
                  color: "#673ab7",
                  "&:hover": { borderColor: "#5e35b1", bgcolor: "rgba(103, 58, 183, 0.04)" },
                }}
              >
                <AddIcon sx={{ fontSize: "1.2rem" }} />
              </Button>
            </Box>
          )}
        </Paper>

        {/* Followed Clubs */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: 4,
            mb: 3,
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
          >
            Followed Clubs
          </Typography>

          {!profile?.following || profile.following.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#999" }}>
              You are not following any clubs yet. Browse events to discover organizers.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {profile.following.map((org) => {
                const orgId = org._id || org;
                const orgName = org.name || "Unknown Club";

                return (
                  <Chip
                    key={orgId}
                    label={orgName}
                    onDelete={editMode ? () => handleUnfollow(orgId) : undefined}
                    sx={{
                      bgcolor: "#00897b",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      "& .MuiChip-deleteIcon": { color: "white" },
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Security Settings */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: 4,
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
          >
            Security Settings
          </Typography>

          <Button
            variant="outlined"
            onClick={() => setPwdOpen(true)}
            startIcon={<LockIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#673ab7",
              color: "#673ab7",
              borderRadius: 2,
              px: 3,
              py: 1,
              "&:hover": {
                borderColor: "#5e35b1",
                bgcolor: "rgba(103, 58, 183, 0.04)",
              },
            }}
          >
            Change Password
          </Button>
        </Paper>
      </Container>

      {/* Password Change Dialog */}
      <Dialog
        open={pwdOpen}
        onClose={() => {
          setPwdOpen(false);
          setPwdError("");
          setPwdSuccess("");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Change Password
          <IconButton
            onClick={() => {
              setPwdOpen(false);
              setPwdError("");
              setPwdSuccess("");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmNewPassword("");
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {pwdError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {pwdError}
            </Alert>
          )}
          {pwdSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {pwdSuccess}
            </Alert>
          )}

          <Typography
            variant="body2"
            sx={{ mb: 1, mt: 1, fontWeight: 600, color: "#555" }}
          >
            Current Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600, color: "#555" }}
          >
            New Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600, color: "#555" }}
          >
            Confirm New Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="Re-enter new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setPwdOpen(false);
              setPwdError("");
              setPwdSuccess("");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmNewPassword("");
            }}
            sx={{ textTransform: "none", color: "#666" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={pwdLoading}
            onClick={handleChangePassword}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#673ab7",
              borderRadius: 2,
              "&:hover": { bgcolor: "#5e35b1" },
            }}
          >
            {pwdLoading ? "Changing..." : "Change Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParticipantProfile;