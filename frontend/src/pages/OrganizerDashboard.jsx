import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import API from "../services/api";
import OrganizerNavbar from "../components/OrganizerNavbar";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const CARDS_PER_PAGE = 3;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/organizer/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Fetch events error:", err);
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrev = () => {
    setCarouselIndex((prev) => Math.max(0, prev - CARDS_PER_PAGE));
  };

  const handleNext = () => {
    setCarouselIndex((prev) =>
      Math.min(events.length - CARDS_PER_PAGE, prev + CARDS_PER_PAGE)
    );
  };

  const visibleEvents = events.slice(
    carouselIndex,
    carouselIndex + CARDS_PER_PAGE
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      DRAFT: { label: "Draft", bgcolor: "#f5f5f5", color: "#757575" },
      PUBLISHED: { label: "Published", bgcolor: "#e3f2fd", color: "#1976d2" },
      ONGOING: { label: "Ongoing", bgcolor: "#e8f5e9", color: "#2e7d32" },
      CANCELLED: { label: "Cancelled", bgcolor: "#ffebee", color: "#c62828" },
      COMPLETED: { label: "Completed", bgcolor: "#f3e5f5", color: "#7b1fa2" },
    };
    return configs[status] || configs.DRAFT;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <OrganizerNavbar />

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
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}
            >
              Welcome back, {user.name || "Organizer"}!
            </Typography>
            <Typography variant="body1" sx={{ color: "#666" }}>
              Manage your events and track registrations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/organizer/create-event")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#673ab7",
              borderRadius: 2,
              px: 3,
              "&:hover": { bgcolor: "#5e35b1" },
            }}
          >
            Create Event
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Events Carousel Section */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#1a1a2e" }}
            >
              Your Events
            </Typography>

            {/* Carousel Controls */}
            {events.length > CARDS_PER_PAGE && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  onClick={handlePrev}
                  disabled={carouselIndex === 0}
                  sx={{
                    border: "1px solid #e0e0e0",
                    bgcolor: "white",
                    "&:disabled": { opacity: 0.4 },
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                >
                  <ArrowBackIosIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleNext}
                  disabled={carouselIndex + CARDS_PER_PAGE >= events.length}
                  sx={{
                    border: "1px solid #e0e0e0",
                    bgcolor: "white",
                    "&:disabled": { opacity: 0.4 },
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "300px",
              }}
            >
              <CircularProgress sx={{ color: "#673ab7" }} />
            </Box>
          ) : events.length === 0 ? (
            <Card
              elevation={0}
              sx={{
                border: "2px dashed #e0e0e0",
                borderRadius: 3,
                p: 6,
                textAlign: "center",
                bgcolor: "white",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#999", mb: 2, fontWeight: 600 }}
              >
                No events yet
              </Typography>
              <Typography variant="body2" sx={{ color: "#bbb", mb: 3 }}>
                Create your first event to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/organizer/create-event")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "#673ab7",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#5e35b1" },
                }}
              >
                Create Event
              </Button>
            </Card>
          ) : (
            <>
              <Grid container spacing={3}>
                {visibleEvents.map((event) => {
                  const statusConfig = getStatusConfig(event.status);
                  return (
                    <Grid item xs={12} md={4} key={event._id}>
                      <Card
                        elevation={0}
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 3,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          transition: "all 0.3s",
                          "&:hover": {
                            boxShadow: "0 8px 24px rgba(103,58,183,0.15)",
                            transform: "translateY(-4px)",
                            borderColor: "#673ab7",
                          },
                        }}
                        onClick={() =>
                          navigate(`/organizer/event/${event._id}`)
                        }
                      >
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Status + Type */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mb: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              label={event.type || "Event"}
                              size="small"
                              sx={{
                                bgcolor: "#f3e5f5",
                                color: "#7b1fa2",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                            <Chip
                              label={statusConfig.label}
                              size="small"
                              sx={{
                                bgcolor: statusConfig.bgcolor,
                                color: statusConfig.color,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          </Box>

                          {/* Event Name */}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "#1a1a2e",
                              mb: 1,
                              flexGrow: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {event.name}
                          </Typography>

                          {/* Date */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <CalendarTodayIcon
                              sx={{ fontSize: 16, color: "#999" }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: "#666" }}
                            >
                              {formatDate(event.startDate)}
                            </Typography>
                          </Box>

                          {/* Registrations */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 2,
                            }}
                          >
                            <PeopleIcon
                              sx={{ fontSize: 16, color: "#999" }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: "#666" }}
                            >
                              {event.registeredCount || 0} /{" "}
                              {event.maxParticipants || "∞"} registered
                            </Typography>
                          </Box>

                          {/* Divider + Manage Button */}
                          <Box
                            sx={{
                              pt: 2,
                              borderTop: "1px solid #f0f0f0",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ color: "#673ab7", fontWeight: 600 }}
                            >
                              ₹{event.registrationFee || 0}
                            </Typography>
                            <Button
                              variant="text"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizer/event/${event._id}`);
                              }}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                color: "#673ab7",
                                "&:hover": {
                                  bgcolor: "rgba(103,58,183,0.08)",
                                },
                              }}
                            >
                              Manage →
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Carousel Dots */}
              {events.length > CARDS_PER_PAGE && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 1,
                    mt: 3,
                  }}
                >
                  {Array.from({
                    length: Math.ceil(events.length / CARDS_PER_PAGE),
                  }).map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setCarouselIndex(i * CARDS_PER_PAGE)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        cursor: "pointer",
                        bgcolor:
                          Math.floor(carouselIndex / CARDS_PER_PAGE) === i
                            ? "#673ab7"
                            : "#e0e0e0",
                        transition: "all 0.3s",
                      }}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default OrganizerDashboard;
