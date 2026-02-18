import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import API from "../services/api";
import OrganizerNavbar from "../components/OrganizerNavbar";

const OrganizerEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters for participants table
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    activeRegistrations: 0,
    cancelledRegistrations: 0,
    totalRevenue: 0,
    fillRate: 0,
  });

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/organizer/events/${eventId}`);
      const { event: evt, registrations: regs, totalRegistrations } = res.data;

      setEvent(evt);
      setRegistrations(regs);

      // Calculate stats from registrations
      const activeRegs = regs.filter((r) => r.status !== "CANCELLED");
      const cancelledRegs = regs.filter((r) => r.status === "CANCELLED");
      const revenue = activeRegs.length * (evt.registrationFee || 0);
      const fillRate = evt.maxParticipants
        ? ((activeRegs.length / evt.maxParticipants) * 100).toFixed(1)
        : 0;

      setStats({
        totalRegistrations: totalRegistrations,
        activeRegistrations: activeRegs.length,
        cancelledRegistrations: cancelledRegs.length,
        totalRevenue: revenue,
        fillRate,
      });
    } catch (err) {
      console.error("Fetch event detail error:", err);
      setError(err.response?.data?.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetail();
  }, [eventId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventStatusConfig = (evt) => {
    if (!evt) return { label: "Unknown", bgcolor: "#f5f5f5", color: "#757575" };
    const now = new Date();
    const start = new Date(evt.startDate);
    const end = new Date(evt.endDate);

    if (evt.status === "CANCELLED")
      return { label: "Cancelled", bgcolor: "#ffebee", color: "#c62828" };
    if (evt.status === "DRAFT")
      return { label: "Draft", bgcolor: "#f5f5f5", color: "#757575" };
    if (now >= start && now <= end)
      return { label: "Ongoing", bgcolor: "#e8f5e9", color: "#2e7d32" };
    if (now > end)
      return { label: "Completed", bgcolor: "#f3e5f5", color: "#7b1fa2" };
    return { label: "Published", bgcolor: "#e3f2fd", color: "#1976d2" };
  };

  const getRegStatusChip = (status) => {
    const configs = {
      CONFIRMED: { label: "Confirmed", bgcolor: "#e8f5e9", color: "#2e7d32" },
      CANCELLED: { label: "Cancelled", bgcolor: "#ffebee", color: "#c62828" },
      PENDING: { label: "Pending", bgcolor: "#fff3e0", color: "#e65100" },
    };
    const config = configs[status] || configs.PENDING;
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgcolor,
          color: config.color,
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
      />
    );
  };

  const handleExportCSV = async () => {
    try {
      const response = await API.get(`/organizer/events/${eventId}/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${event?.name || "event"}_participants.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Fallback: generate CSV from existing data
      const headers = ["Name", "Email", "Ticket ID", "Status", "Registered At"];
      const rows = filteredRegistrations.map((reg) => {
        const p = reg.participantId;
        const name =
          `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "N/A";
        return [
          name,
          p?.email || "N/A",
          reg.ticketId || reg._id,
          reg.status || "CONFIRMED",
          formatDate(reg.createdAt),
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...rows].map((r) => r.join(",")).join("\n");

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute(
        "download",
        `${event?.name || "event"}_participants.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteEvent = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    )
      return;

    try {
      await API.delete(`/organizer/events/${eventId}`);
      setSuccess("Event deleted successfully");
      setTimeout(() => navigate("/organizer/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete event");
    }
  };

  // Filter participants
  const filteredRegistrations = registrations.filter((reg) => {
    const p = reg.participantId;
    const name = `${p?.firstName || ""} ${p?.lastName || ""}`.toLowerCase();
    const email = p?.email?.toLowerCase() || "";
    const ticketId = (reg.ticketId || "").toLowerCase();

    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      ticketId.includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (reg.status || "CONFIRMED").toUpperCase() ===
        statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
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

  if (error && !event) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <OrganizerNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  const statusConfig = getEventStatusConfig(event);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <OrganizerNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/organizer/dashboard")}
            sx={{ cursor: "pointer", fontWeight: 500 }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            {event?.name}
          </Typography>
        </Breadcrumbs>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* ── Event Header Card ── */}
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            {/* Left: Name + chips */}
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
              >
                {event?.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={event?.type || "Event"}
                  size="small"
                  sx={{
                    bgcolor: "#f3e5f5",
                    color: "#7b1fa2",
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    bgcolor: statusConfig.bgcolor,
                    color: statusConfig.color,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>

            {/* Right: Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() =>
                  navigate(`/organizer/edit-event/${eventId}`)
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#673ab7",
                  color: "#673ab7",
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "#5e35b1",
                    bgcolor: "rgba(103,58,183,0.04)",
                  },
                }}
              >
                Edit Event
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteEvent}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#ef5350",
                  color: "#ef5350",
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "#c62828",
                    bgcolor: "rgba(239,83,80,0.04)",
                  },
                }}
              >
                Delete
              </Button>
            </Box>
          </Box>

          {/* Event Info Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon sx={{ color: "#673ab7", fontSize: 20 }} />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a2e" }}>
                    {formatDate(event?.startDate)} – {formatDate(event?.endDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOnIcon sx={{ color: "#673ab7", fontSize: 20 }} />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    Venue
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a2e" }}>
                    {event?.venue || "TBA"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PeopleIcon sx={{ color: "#673ab7", fontSize: 20 }} />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "#888", fontWeight: 600 }}
                  >
                    Capacity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#1a1a2e" }}>
                    {stats.activeRegistrations} / {event?.maxParticipants || "∞"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: "#888", fontWeight: 600 }}
                >
                  Registration Fee
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 700, color: "#673ab7" }}
                >
                  ₹{event?.registrationFee || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* ── Stats Cards ── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
                bgcolor: "white",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", mb: 1, fontWeight: 600 }}
              >
                Total Registrations
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#00897b", mb: 1 }}
              >
                {stats.totalRegistrations}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {stats.activeRegistrations} active ·{" "}
                <span style={{ color: "#e65100" }}>
                  {stats.cancelledRegistrations} cancelled
                </span>
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
                bgcolor: "white",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", mb: 1, fontWeight: 600 }}
              >
                Total Revenue
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#00897b", mb: 1 }}
              >
                ₹{stats.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                ₹{event?.registrationFee || 0} per participant
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
                bgcolor: "white",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", mb: 1, fontWeight: 600 }}
              >
                Fill Rate
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
              >
                {stats.fillRate}%
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {stats.activeRegistrations} / {event?.maxParticipants || "∞"} spots
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
                bgcolor: "white",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", mb: 1, fontWeight: 600 }}
              >
                Eligibility
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
              >
                {event?.eligibility || "Open to All"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {event?.type || "General"} event
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ── Participants Table ── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            bgcolor: "white",
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a2e" }}
            >
              Participants ({filteredRegistrations.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#00897b",
                borderRadius: 2,
                "&:hover": { bgcolor: "#00796b" },
              }}
            >
              Export CSV
            </Button>
          </Box>

          {/* Filters */}
          <Box sx={{ p: 3, borderBottom: "1px solid #e0e0e0" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, email or ticket ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#999" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#fafafa" }}>
                  <TableCell sx={{ fontWeight: 700, color: "#666" }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#666" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#666" }}>
                    Ticket ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#666" }}>
                    Registered At
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#666" }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" sx={{ color: "#999" }}>
                        No participants found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const p = reg.participantId;
                    const name =
                      `${p?.firstName || ""} ${p?.lastName || ""}`.trim() ||
                      "N/A";
                    return (
                      <TableRow
                        key={reg._id}
                        sx={{
                          "&:hover": { bgcolor: "#fafafa" },
                          "&:last-child td": { border: 0 },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#1a1a2e" }}
                          >
                            {name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ color: "#673ab7" }}
                          >
                            {p?.email || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#666",
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                            }}
                          >
                            {reg.ticketId || `TKT-${reg._id.slice(-6).toUpperCase()}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            {formatDate(reg.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getRegStatusChip(reg.status || "CONFIRMED")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default OrganizerEventDetail;
