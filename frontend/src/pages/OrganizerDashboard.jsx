import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Paper,
  CircularProgress,
} from "@mui/material";

import API from "../services/api";
import OrganizerNavbar from "../components/OrganizerNavbar";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await API.get("/organizer/dashboard");
      setStats(res.data.stats);
      setEvents(res.data.events);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PUBLISHED":
        return { bgcolor: "#e3f2fd", color: "#1976d2", label: "Published" };
      case "ONGOING":
        return { bgcolor: "#e8f5e9", color: "#2e7d32", label: "Ongoing" };
      case "DRAFT":
        return { bgcolor: "#fff3e0", color: "#ed6c02", label: "Draft" };
      case "COMPLETED":
        return { bgcolor: "#f3e5f5", color: "#7b1fa2", label: "Completed" };
      case "CANCELLED":
        return { bgcolor: "#ffebee", color: "#c62828", label: "Closed" };
      default:
        return { bgcolor: "#f5f5f5", color: "#616161", label: status };
    }
  };

  const getEventCategoryLabel = (type) => {
    const map = {
      NORMAL: "Workshop",
      MERCH: "Merchandise",
    };
    return map[type] || "Event";
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
        {/* Page Title */}
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "#1a1a2e", mb: 4 }}
        >
          My Events
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
                height: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", fontWeight: 500, mb: 1 }}
              >
                Total Events
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#1a1a2e" }}
              >
                {stats?.totalEvents || 0}
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
                height: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", fontWeight: 500, mb: 1 }}
              >
                Active Events
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#00897b" }}
              >
                {stats?.activeEvents || 0}
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
                height: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", fontWeight: 500, mb: 1 }}
              >
                Total Registrations
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#673ab7" }}
              >
                {stats?.totalRegistrations || 0}
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
                height: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#888", fontWeight: 500, mb: 1 }}
              >
                Revenue
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#1a1a2e" }}
              >
                ₹{stats?.totalRevenue?.toLocaleString("en-IN") || 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Event Cards */}
        {events.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography sx={{ color: "#999" }}>
              No events created yet. Click "Create Event" to get started.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => {
              const statusConfig = getStatusColor(event.status);
              return (
                <Grid item xs={12} md={4} key={event._id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 3,
                      cursor: "pointer",
                      height: "100%",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: "#673ab7",
                        transform: "translateY(-4px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      },
                    }}
                    onClick={() => navigate(`/organizer/event/${event._id}`)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Event Name */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#1a1a2e",
                            flex: 1,
                            pr: 1,
                          }}
                        >
                          {event.name}
                        </Typography>

                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig.bgcolor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: "24px",
                          }}
                        />
                      </Box>

                      {/* Category */}
                      <Typography
                        variant="body2"
                        sx={{ color: "#888", mb: 2 }}
                      >
                        {getEventCategoryLabel(event.type)}
                      </Typography>

                      {/* Date */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          Date:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#333" }}
                        >
                          {formatDate(event.startDate)}
                        </Typography>
                      </Box>

                      {/* Registrations */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          Registrations:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#673ab7" }}
                        >
                          {event.registrationCount || 0}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default OrganizerDashboard;
