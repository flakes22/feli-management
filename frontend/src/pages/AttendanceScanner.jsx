import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import OrganizerNavbar from "../components/OrganizerNavbar";
import API from "../services/api";
import { Html5Qrcode } from "html5-qrcode";

const AttendanceScanner = () => {
  const { eventId } = useParams();
  const scannerRef = useRef(null);
  const lastHandledCodeRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [scanInFlight, setScanInFlight] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanMessage, setScanMessage] = useState(null);
  const [stats, setStats] = useState({
    eventName: "",
    total: 0,
    attended: 0,
    notAttended: 0,
    scannedParticipants: [],
    pendingParticipants: [],
  });
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideError, setOverrideError] = useState("");

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        scannerRef.current = null;
      }).catch((err) => {
        console.warn("Error stopping scanner setup", err);
      });
      setCameraRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  const fetchStats = async (withLoader = false) => {
    try {
      if (withLoader) setLoading(true);
      const res = await API.get(`/attendance/stats/${eventId}`);
      setStats(res.data);
    } catch (err) {
      setScanMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load attendance dashboard",
      });
    } finally {
      if (withLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(true);
    const timer = setInterval(() => fetchStats(false), 8000);
    return () => clearInterval(timer);
  }, [eventId]);

  const submitScan = async (rawCode, source = "scanner") => {
    if (!rawCode || scanInFlight) return;
    setScanInFlight(true);
    try {
      const res = await API.post("/attendance/scan", {
        eventId,
        qrData: rawCode,
      });
      const participantName = res.data?.participant
        ? `${res.data.participant.firstName || ""} ${res.data.participant.lastName || ""}`.trim()
        : "Participant";
      setScanMessage({
        type: "success",
        text: `${participantName} marked present via ${source}.`,
      });
      lastHandledCodeRef.current = rawCode;
      await fetchStats(false);
    } catch (err) {
      const duplicate = err.response?.status === 409;
      const participant = err.response?.data?.participant;
      const participantName = participant
        ? `${participant.firstName || ""} ${participant.lastName || ""}`.trim()
        : "Participant";
      setScanMessage({
        type: duplicate ? "warning" : "error",
        text: duplicate
          ? `${participantName} was already scanned (duplicate rejected).`
          : err.response?.data?.message || "Scan failed",
      });
    } finally {
      setScanInFlight(false);
      setManualCode(""); // clear input box on submit
    }
  };

  const startCamera = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (decodedText && decodedText !== lastHandledCodeRef.current) {
            submitScan(decodedText, "camera");
          }
        },
        () => {
          // ignore scan frame errors
        }
      );
      setCameraRunning(true);
    } catch (err) {
      setScanMessage({
        type: "error",
        text: "Unable to start camera. Please check permissions.",
      });
    }
  };

  const scanFromFile = async (file) => {
    if (!file) return;
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText) {
        await submitScan(decodedText, "file upload");
      }
    } catch (err) {
      setScanMessage({ type: "error", text: "Failed to decode QR from image." });
    }
  };

  const handleExport = async () => {
    try {
      const res = await API.get(`/attendance/export/${eventId}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-${eventId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setScanMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to export attendance CSV",
      });
    }
  };

  const openOverrideDialog = (participant) => {
    setOverrideTarget(participant);
    setOverrideReason("");
    setOverrideError("");
    setOverrideDialogOpen(true);
  };

  const submitManualOverride = async () => {
    if (!overrideTarget?.registrationId) return;
    if (!overrideReason.trim()) {
      setOverrideError("Reason is required for audit logging.");
      return;
    }
    try {
      await API.patch(`/attendance/manual/${overrideTarget.registrationId}`, {
        reason: overrideReason.trim(),
      });
      setOverrideDialogOpen(false);
      setScanMessage({
        type: "success",
        text: `${overrideTarget.name || "Participant"} manually marked present.`,
      });
      await fetchStats(false);
    } catch (err) {
      setOverrideError(err.response?.data?.message || "Manual override failed.");
    }
  };

  if (loading) {
    return (
      <Box>
        <OrganizerNavbar />
        <LinearProgress />
      </Box>
    );
  }

  return (
    <>
      <OrganizerNavbar />
      <Container sx={{ mt: 4, mb: 6 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h4">Attendance Scanner</Typography>
            <Typography color="text.secondary">
              {stats.eventName || "Event"} ({stats.attended}/{stats.total} scanned)
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleExport}>
            Export Attendance CSV
          </Button>
        </Stack>

        {scanMessage && (
          <Alert severity={scanMessage.type} sx={{ mb: 2 }}>
            {scanMessage.text}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Total Registrations</Typography>
                <Typography variant="h5">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Scanned</Typography>
                <Typography variant="h5" color="success.main">
                  {stats.attended}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Not Yet Scanned</Typography>
                <Typography variant="h5" color="warning.main">
                  {stats.notAttended}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" mb={1}>
                QR Scanner
              </Typography>
              <Box
                id="qr-reader"
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  overflow: "hidden",
                  background: cameraRunning ? "#000" : "#f5f5f5",
                  minHeight: 240,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!cameraRunning && <Typography color="text.secondary">Camera is off</Typography>}
              </Box>
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                {!cameraRunning ? (
                  <Button variant="contained" onClick={startCamera}>
                    Start Camera
                  </Button>
                ) : (
                  <Button variant="outlined" color="error" onClick={stopCamera}>
                    Stop Camera
                  </Button>
                )}
                <Button variant="outlined" component="label">
                  Upload QR Image
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) => scanFromFile(e.target.files?.[0])}
                  />
                </Button>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}>
                <TextField
                  fullWidth
                  label="Manual QR/Ticket Input"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste QR content or ticket number"
                />
                <Button variant="contained" onClick={() => submitScan(manualCode, "manual input")}>
                  Validate
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" mb={1}>
                Not Yet Scanned ({stats.pendingParticipants.length})
              </Typography>
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Ticket</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.pendingParticipants.map((p) => (
                      <TableRow key={p.registrationId}>
                        <TableCell>{p.name || "N/A"}</TableCell>
                        <TableCell>{p.email || "N/A"}</TableCell>
                        <TableCell>{p.ticketNumber || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => openOverrideDialog(p)}>
                            Manual Override
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {stats.pendingParticipants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>Everyone has been scanned.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" mb={1}>
            Recently Scanned ({stats.scannedParticipants.length})
          </Typography>
          <TableContainer sx={{ maxHeight: 320 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Ticket</TableCell>
                  <TableCell>Attendance Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.scannedParticipants.map((p) => (
                  <TableRow key={p.registrationId}>
                    <TableCell>{p.name || "N/A"}</TableCell>
                    <TableCell>{p.email || "N/A"}</TableCell>
                    <TableCell>{p.ticketNumber || "N/A"}</TableCell>
                    <TableCell>
                      {p.attendanceTime ? new Date(p.attendanceTime).toLocaleString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.scannedParticipants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No attendees scanned yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} fullWidth>
        <DialogTitle>Manual Attendance Override</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Mark <strong>{overrideTarget?.name || "participant"}</strong> as attended.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason (required)"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />
          {overrideError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {overrideError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitManualOverride}>
            Confirm Override
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AttendanceScanner;
