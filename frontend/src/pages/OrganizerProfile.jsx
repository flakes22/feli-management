import { useEffect, useState } from "react";
import {
  Container, TextField, Typography, Button, Box, Grid,
  Paper, Alert, CircularProgress, Chip, Divider,
} from "@mui/material";
import OrganizerNavbar from "../components/OrganizerNavbar";
import API from "../services/api";

const PasswordResetSection = () => {
  const [form, setForm] = useState({
    reason: "",
    currentPassword: "",
    newPassword: "",
  });
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      // ✅ correct path: /organizer/ not /organizers/
      const res = await API.get("/organizer/password-reset-status");
      setStatus(res.data.request);
    } catch (e) {
      console.error("fetchStatus error:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async () => {
    setMsg("");
    setError("");

    if (!form.reason.trim()) return setError("Please provide a reason.");
    if (!form.currentPassword) return setError("Current password is required.");
    if (form.newPassword.length < 6)
      return setError("New password must be at least 6 characters.");

    setLoading(true);
    try {
      // ✅ correct path
      const res = await API.post("/organizer/request-password-reset", form);
      setMsg(res.data.message);
      setForm({ reason: "", currentPassword: "", newPassword: "" });
      fetchStatus();
    } catch (e) {
      setError(e.response?.data?.message || "Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!window.confirm("Apply the new password now? You will need to log in again."))
      return;
    setMsg("");
    setError("");
    setLoading(true);
    try {
      // ✅ PATCH not POST, correct path
      const res = await API.patch(`/organizer/apply-password/${status._id}`);
      setMsg(res.data.message);
      setStatus(null);
    } catch (e) {
      setError(e.response?.data?.message || "Error applying password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mt: 0 }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
        🔐 Password Reset
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {msg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {msg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Active Request Status Banner ── */}
      {status && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor:
              status.status === "APPROVED"
                ? "#a5d6a7"
                : status.status === "REJECTED"
                ? "#ef9a9a"
                : "#ffe082",
            bgcolor:
              status.status === "APPROVED"
                ? "#f1f8f1"
                : status.status === "REJECTED"
                ? "#fff5f5"
                : "#fffde7",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Current Request Status:
            </Typography>
            <Chip
              label={status.status}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor:
                  status.status === "APPROVED"
                    ? "#e8f5e9"
                    : status.status === "REJECTED"
                    ? "#ffebee"
                    : "#fff3e0",
                color:
                  status.status === "APPROVED"
                    ? "#2e7d32"
                    : status.status === "REJECTED"
                    ? "#c62828"
                    : "#e65100",
              }}
            />
          </Box>

          <Typography variant="body2" sx={{ color: "#555" }}>
            Reason submitted: <em>{status.reason}</em>
          </Typography>

          {status.adminNote && (
            <Typography variant="body2" sx={{ mt: 0.5, color: "#555" }}>
              Admin note: <em>"{status.adminNote}"</em>
            </Typography>
          )}

          {/* ── APPROVED → show Apply button ── */}
          {status.status === "APPROVED" && !status.appliedByOrganizer && (
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={loading}
              sx={{
                mt: 2,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#2e7d32",
                borderRadius: 2,
                "&:hover": { bgcolor: "#1b5e20" },
              }}
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: "white" }} />
              ) : (
                "✅ Apply New Password"
              )}
            </Button>
          )}

          {status.status === "APPROVED" && status.appliedByOrganizer && (
            <Typography
              variant="body2"
              sx={{ mt: 1, color: "#2e7d32", fontWeight: 600 }}
            >
              ✓ Password has been applied. Please log in with your new password.
            </Typography>
          )}

          {/* ── REJECTED → let them submit a new one ── */}
          {status.status === "REJECTED" && (
            <Typography variant="body2" sx={{ mt: 1, color: "#c62828" }}>
              You can submit a new request below.
            </Typography>
          )}
        </Box>
      )}

      {/* ── Form: only show when no PENDING request ── */}
      {(!status || status.status === "REJECTED") && (
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Your request will go to Admin for approval. Your password will
            only change after Admin approves <strong>and</strong> you click
            "Apply New Password".
          </Alert>

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
            >
              Current Password *
            </Typography>
            <TextField
              fullWidth
              type="password"
              size="small"
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
              placeholder="Enter your current password"
            />
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
            >
              New Password * (min 6 characters)
            </Typography>
            <TextField
              fullWidth
              type="password"
              size="small"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              placeholder="Enter your new password"
            />
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
            >
              Reason for Password Change *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g., Routine security change, forgot old password, etc."
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#673ab7",
              borderRadius: 2,
              alignSelf: "flex-start",
              px: 4,
              "&:hover": { bgcolor: "#5e35b1" },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Submit Reset Request"
            )}
          </Button>
        </Box>
      )}

      {/* ── PENDING: block form, show waiting message ── */}
      {status && status.status === "PENDING" && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Your request is pending admin review. You cannot submit another
          request until this one is resolved.
        </Alert>
      )}
    </Paper>
  );
};

// ─────────────────────────────────────────────────────
const OrganizerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

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
      const organizer = res.data.organizer || res.data;
      setProfile(organizer);
      setStats(res.data.stats || null);
      setDescription(organizer.description || "");
      setEstablishedYear(organizer.establishedYear || "");
      setMemberCount(organizer.memberCount || "");
      setContactPhone(organizer.contactPhone || "");
      setWebsite(organizer.website || "");
      setTwitter(organizer.socialMedia?.twitter || "");
      setInstagram(organizer.socialMedia?.instagram || "");
      setLinkedin(organizer.socialMedia?.linkedin || "");
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

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
        socialMedia: { twitter, instagram, linkedin },
      });
      setSuccess("Profile updated successfully!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setDescription(profile?.description || "");
    setEstablishedYear(profile?.establishedYear || "");
    setMemberCount(profile?.memberCount || "");
    setContactPhone(profile?.contactPhone || "");
    setWebsite(profile?.website || "");
    setTwitter(profile?.socialMedia?.twitter || "");
    setInstagram(profile?.socialMedia?.instagram || "");
    setLinkedin(profile?.socialMedia?.linkedin || "");
    setEditMode(false);
    setError("");
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <OrganizerNavbar />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Organizer Profile
          </Typography>
          {!editMode ? (
            <Button variant="contained" onClick={() => setEditMode(true)}
              sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#673ab7", borderRadius: 2, px: 3, "&:hover": { bgcolor: "#5e35b1" } }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={handleCancelEdit}
                sx={{ textTransform: "none", fontWeight: 600, borderColor: "#ccc", color: "#666", borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSaveProfile}
                sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#00897b", borderRadius: 2, "&:hover": { bgcolor: "#00796b" } }}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Events", value: stats?.totalEvents || 0, color: "#1a1a2e" },
            { label: "Upcoming", value: stats?.upcomingEvents || 0, color: "#1976d2" },
            { label: "Completed", value: stats?.completedEvents || 0, color: "#2e7d32" },
            { label: "Participants", value: stats?.totalParticipants || 0, color: "#673ab7" },
            { label: "Followers", value: stats?.followers || 0, color: "#00897b" },
          ].map((stat) => (
            <Grid item xs={12} sm={6} md={2.4} key={stat.label}>
              <Paper elevation={0}
                sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2, textAlign: "center" }}
              >
                <Typography variant="body2" sx={{ color: "#888", mb: 0.5 }}>{stat.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Basic Information */}
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}>
                Organization Name (Non-editable)
              </Typography>
              <TextField fullWidth size="small" value={profile?.name || ""} disabled
                sx={{ bgcolor: "#f5f5f5", "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#888" } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}>
                Category (Non-editable)
              </Typography>
              <TextField fullWidth size="small" value={profile?.category || ""} disabled
                sx={{ bgcolor: "#f5f5f5", "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#888" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}>
                Description
              </Typography>
              <TextField fullWidth multiline rows={4} size="small"
                value={description} onChange={(e) => setDescription(e.target.value)}
                disabled={!editMode} placeholder="Describe your organization..."
                sx={!editMode ? { bgcolor: "#f5f5f5" } : {}}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Contact Information */}
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}>
            Contact Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}>
                Email (Non-editable)
              </Typography>
              <TextField fullWidth size="small"
                value={profile?.email || ""} disabled
                sx={{ bgcolor: "#f5f5f5", "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#888" } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Security Settings */}
        <PasswordResetSection />

      </Container>
    </Box>
  );
};

export default OrganizerProfile;
