import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  TextField,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";

import API from "../services/api";
import OrganizerCard from "../components/OrganizerCard";
import AdminNavbar from "../components/AdminNavbar";

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    contactEmail: "",
  });
  const [tabIndex, setTabIndex] = useState(0);

  const fetchOrganizers = async () => {
    const res = await API.get("/admin/organizers");
    setOrganizers(res.data);
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleCreate = async () => {
    const res = await API.post(
      "/admin/create-organizer",
      form
    );

    alert(
      `Login Email: ${res.data.organizer.loginEmail}
Password: ${res.data.organizer.generatedPassword}`
    );

    setOpen(false);
    fetchOrganizers();
  };

  const tabs = [
    { label: "Organizers", component: (
      <>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
        >
          Create Organizer
        </Button>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {organizers.map((org) => (
            <Grid item xs={12} md={4} key={org._id}>
              <OrganizerCard
                organizer={org}
                refresh={fetchOrganizers}
              />
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Create Organizer</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              margin="normal"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Category"
              margin="normal"
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Contact Email"
              margin="normal"
              onChange={(e) =>
                setForm({
                  ...form,
                  contactEmail: e.target.value,
                })
              }
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </>
    ) },
    { label: "Password Reset Requests", component: <PasswordResetRequests /> }
  ];

  return (
    <>
      <AdminNavbar />
      <Container>
        <Typography variant="h4" sx={{ my: 3 }}>
          Admin Dashboard
        </Typography>

        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          sx={{ mb: 3 }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>

        {tabs[tabIndex].component}
      </Container>
    </>
  );
};

const PasswordResetRequests = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get("/admin/organizers");
        // Only show organizers with PENDING requests
        const withPending = res.data.filter((org) =>
          org.passwordResetRequests?.some((r) => r.status === "PENDING")
        );
        setOrganizers(withPending);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleAction = async (orgId, reqId, action) => {
    try {
      await API.patch(`/admin/password-reset-requests/${orgId}/${reqId}`, {
        action,                        // "APPROVE" or "REJECT"
        note: notes[reqId] || "",
      });
      setMsg(`Request ${action}D successfully.`);
      setOrganizers((prev) =>
        prev
          .map((org) => ({
            ...org,
            passwordResetRequests: org.passwordResetRequests.map((r) =>
              r._id === reqId ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r
            ),
          }))
          .filter((org) =>
            org.passwordResetRequests.some((r) => r.status === "PENDING")
          )
      );
    } catch (e) {
      setMsg(e.response?.data?.message || "Error processing request.");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Password Reset Requests
      </Typography>
      {msg && <Alert severity="info" sx={{ mb: 2 }}>{msg}</Alert>}
      {organizers.length === 0 ? (
        <Typography color="text.secondary">No pending password reset requests.</Typography>
      ) : (
        organizers.map((org) =>
          org.passwordResetRequests
            .filter((r) => r.status === "PENDING")
            .map((req) => (
              <Paper key={req._id} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">
                  <strong>{org.name}</strong> ({org.email})
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📝 Reason: {req.reason}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Requested at: {new Date(req.requestedAt).toLocaleString()}
                </Typography>
                <Chip
                  label={req.status}
                  color="warning"
                  size="small"
                  sx={{ ml: 2 }}
                />
                <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    size="small"
                    label="Admin note (optional)"
                    value={notes[req._id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [req._id]: e.target.value }))
                    }
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleAction(org._id, req._id, "APPROVE")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleAction(org._id, req._id, "REJECT")}
                  >
                    Reject
                  </Button>
                </Box>
              </Paper>
            ))
        )
      )}
    </Box>
  );
};

export default AdminDashboard;
