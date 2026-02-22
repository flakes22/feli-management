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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import LockIcon from "@mui/icons-material/Lock";
import API from "../services/api";
import OrganizerNavbar from "../components/OrganizerNavbar";
import DiscussionForum from "../components/DiscussionForum";

const OrganizerEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Editable fields (depend on status)
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editMaxParticipants, setEditMaxParticipants] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Filters
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
      setRegistrations(regs || []);

      // Init edit fields
      setEditDescription(evt.description || "");
      setEditDeadline(
        evt.registrationDeadline
          ? new Date(evt.registrationDeadline).toISOString().slice(0, 16)
          : ""
      );
      setEditMaxParticipants(evt.maxParticipants || "");
      setEditStatus(evt.status);

      const activeRegs = (regs || []).filter((r) => r.status !== "CANCELLED");
      const cancelledRegs = (regs || []).filter((r) => r.status === "CANCELLED");
      const revenue = activeRegs.length * (evt.registrationFee || 0);
      const fillRate = evt.maxParticipants
        ? ((activeRegs.length / evt.maxParticipants) * 100).toFixed(1)
        : 0;

      setStats({
        totalRegistrations: totalRegistrations || (regs || []).length,
        activeRegistrations: activeRegs.length,
        cancelledRegistrations: cancelledRegs.length,
        totalRevenue: revenue,
        fillRate,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetail();
  }, [eventId]);

  // ── Determine what is editable based on status ──
  const getEditableFields = () => {
    if (!event) return { canEdit: false, fields: [], canChangeStatus: false };
    const s = event.status;
    if (s === "DRAFT") {
      return {
        canEdit: true,
        label: "Full edit available (Draft)",
        fields: ["description", "deadline", "maxParticipants"],
        canChangeStatus: true,
        statusOptions: [{ value: "PUBLISHED", label: "Publish Event" }],
        editNote: "Draft events can be fully edited.",
      };
    }
    if (s === "PUBLISHED") {
      return {
        canEdit: true,
        label: "Limited edits (Published)",
        fields: ["description", "deadline", "maxParticipants"],
        canChangeStatus: true,
        statusOptions: [{ value: "CANCELLED", label: "Close Registrations" }],
        editNote:
          "You can update description, extend deadline, or increase participant limit.",
      };
    }
    if (s === "ONGOING" || s === "COMPLETED") {
      return {
        canEdit: false,
        label: "No edits allowed",
        fields: [],
        canChangeStatus: true,
        statusOptions:
          s === "ONGOING"
            ? [{ value: "COMPLETED", label: "Mark as Completed" }]
            : [],
        editNote: "Ongoing/Completed events cannot be edited.",
      };
    }
    return { canEdit: false, fields: [], canChangeStatus: false };
  };

  const editConfig = getEditableFields();

  const handleSaveEdit = async () => {
    setEditLoading(true);
    setError("");
    try {
      const payload = {};
      if (editConfig.fields.includes("description"))
        payload.description = editDescription;
      if (editConfig.fields.includes("deadline"))
        payload.registrationDeadline = editDeadline;
      if (editConfig.fields.includes("maxParticipants") && editMaxParticipants)
        payload.maxParticipants = Number(editMaxParticipants);

      await API.put(`/organizer/events/${eventId}`, payload);
      setSuccess("Event updated successfully!");
      setEditDialog(false);
      fetchEventDetail();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update event");
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to change status to "${newStatus}"?`
      )
    )
      return;
    setError("");
    try {
      if (newStatus === "PUBLISHED") {
        await API.patch(`/organizer/events/${eventId}/publish`);
      } else {
        await API.put(`/organizer/events/${eventId}`, { status: newStatus });
      }
      setSuccess(`Event status changed to ${newStatus}`);
      fetchEventDetail();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change status");
    }
  };

  const handleDeleteEvent = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This cannot be undone."
      )
    )
      return;
    try {
      await API.delete(`/organizer/events/${eventId}`);
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Ticket ID", "Status", "Registered At"];
    const rows = filteredRegistrations.map((reg) => {
      const p = reg.participantId;
      return [
        `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "N/A",
        p?.email || "N/A",
        reg.ticketId || reg._id,
        reg.status || "CONFIRMED",
        new Date(reg.createdAt).toLocaleDateString(),
      ];
    });
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `${event?.name || "event"}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventStatusConfig = (evt) => {
    if (!evt) return { label: "Unknown", bgcolor: "#f5f5f5", color: "#757575" };
    const configs = {
      DRAFT: { label: "Draft", bgcolor: "#f5f5f5", color: "#757575" },
      PUBLISHED: { label: "Published", bgcolor: "#e3f2fd", color: "#1976d2" },
      ONGOING: { label: "Ongoing", bgcolor: "#e8f5e9", color: "#2e7d32" },
      CANCELLED: { label: "Cancelled", bgcolor: "#ffebee", color: "#c62828" },
      COMPLETED: { label: "Completed", bgcolor: "#f3e5f5", color: "#7b1fa2" },
    };
    return configs[evt.status] || configs.DRAFT;
  };

  const getRegStatusChip = (status) => {
    const configs = {
      CONFIRMED: { label: "Confirmed", bgcolor: "#e8f5e9", color: "#2e7d32" },
      CANCELLED: { label: "Cancelled", bgcolor: "#ffebee", color: "#c62828" },
      PENDING: { label: "Pending", bgcolor: "#fff3e0", color: "#e65100" },
    };
    const c = configs[status] || configs.CONFIRMED;
    return (
      <Chip
        label={c.label}
        size="small"
        sx={{
          bgcolor: c.bgcolor,
          color: c.color,
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
      />
    );
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const p = reg.participantId;
    const name = `${p?.firstName || ""} ${p?.lastName || ""}`.toLowerCase();
    const email = p?.email?.toLowerCase() || "";
    const ticketId = (reg.ticketId || "").toLowerCase();
    const matchSearch =
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      ticketId.includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (reg.status || "CONFIRMED").toUpperCase() === statusFilter.toUpperCase();
    return matchSearch && matchStatus;
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

  if (!event) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <OrganizerNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error || "Event not found"}</Alert>
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
            {event.name}
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

        {/* ── Event Header ── */}
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
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
              >
                {event.name}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Chip
                  label={event.type || "Event"}
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
                {/* Edit badge */}
                {editConfig.canEdit ? (
                  <Chip
                    label={editConfig.label}
                    size="small"
                    sx={{
                      bgcolor: "#e8f5e9",
                      color: "#2e7d32",
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Chip
                    icon={<LockIcon sx={{ fontSize: 14 }} />}
                    label={editConfig.editNote}
                    size="small"
                    sx={{
                      bgcolor: "#fff3e0",
                      color: "#e65100",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {editConfig.canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialog(true)}
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
              )}
              {editConfig.canChangeStatus &&
                editConfig.statusOptions?.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outlined"
                    onClick={() => handleStatusChange(opt.value)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor:
                        opt.value === "PUBLISHED" ? "#00897b" : "#ef5350",
                      color: opt.value === "PUBLISHED" ? "#00897b" : "#ef5350",
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              {event.status === "DRAFT" && (
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
                  }}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>

          {/* Event Info */}
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
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#1a1a2e" }}
                  >
                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
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
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#1a1a2e" }}
                  >
                    {event.venue || "TBA"}
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
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#1a1a2e" }}
                  >
                    {stats.activeRegistrations} /{" "}
                    {event.maxParticipants || "∞"}
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
                  Fee
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "#673ab7" }}
                >
                  ₹{event.registrationFee || 0}
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
                ₹{event.registrationFee || 0} per participant
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
                {stats.activeRegistrations} / {event.maxParticipants || "∞"}{" "}
                spots
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
                Reg. Deadline
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
              >
                {formatDate(event.registrationDeadline)}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {event.eligibility || "Open to All"}
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
                      <Typography sx={{ color: "#999" }}>
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
                            {reg.ticketId ||
                              `TKT-${reg._id?.slice(-6).toUpperCase()}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ color: "#666" }}
                          >
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

        <DiscussionForum eventId={eventId} />

        {/* ── Edit Dialog ── */}
        <Dialog
          open={editDialog}
          onClose={() => setEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Edit Event
            <Typography
              variant="body2"
              sx={{ color: "#888", fontWeight: 400, mt: 0.5 }}
            >
              {editConfig.editNote}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {editConfig.fields.includes("description") && (
                <Box>
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
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </Box>
              )}
              {editConfig.fields.includes("deadline") && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                  >
                    Registration Deadline
                    {event.status === "PUBLISHED" && (
                      <Chip
                        label="Can only extend"
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                  </Typography>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    size="small"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              )}
              {editConfig.fields.includes("maxParticipants") && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontWeight: 600, color: "#666" }}
                  >
                    Max Participants
                    {event.status === "PUBLISHED" && (
                      <Chip
                        label="Can only increase"
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={editMaxParticipants}
                    onChange={(e) => setEditMaxParticipants(e.target.value)}
                    inputProps={{ min: stats.activeRegistrations }}
                    helperText={`Current registrations: ${stats.activeRegistrations}`}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setEditDialog(false)}
              sx={{ textTransform: "none", color: "#666" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={editLoading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                "&:hover": { bgcolor: "#5e35b1" },
              }}
            >
              {editLoading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OrganizerEventDetail;
