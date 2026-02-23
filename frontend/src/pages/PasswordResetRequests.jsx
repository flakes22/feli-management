import { useEffect, useState } from "react";
import { Container, Typography, Box, Paper, CircularProgress, Alert, Chip, TextField, Button } from "@mui/material";
import API from "../services/api";
import AdminNavbar from "../components/AdminNavbar";

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

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <Container sx={{ mt: 4 }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
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
      </Container>
    </>
  );
};

export default PasswordResetRequests;
