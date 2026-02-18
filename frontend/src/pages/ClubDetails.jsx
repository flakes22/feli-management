import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";

import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const ClubDetails = () => {
  const { organizerId } = useParams();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClubDetails = async () => {
    try {
      setLoading(true);

      const res = await API.get(`/participant/club/${organizerId}`);

      // Backend response structure:
      // { club: {...}, events: [...], stats: {...} }

      setClub(res.data.club);
      setEvents(res.data.events || []);
      setStats(res.data.stats || {});

      // If backend later adds isFollowing, this will support it
      if (res.data.isFollowing !== undefined) {
        setIsFollowing(res.data.isFollowing);
      }

    } catch (err) {
      setError(err.response?.data?.message || "Failed to load club details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubDetails();
  }, [organizerId]);

  const handleFollow = async () => {
    try {
      const res = await API.post(`/participant/follow/${organizerId}`);

      // Backend returns:
      // { message: "...", isFollowing: true/false }

      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
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

  if (error || !club) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
        <ParticipantNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error || "Club not found."}
          </Alert>
          <Button
            onClick={() => navigate("/participant/clubs")}
            sx={{ mt: 2, color: "#673ab7", textTransform: "none", fontWeight: 600 }}
          >
            ← Back to Clubs
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          onClick={() => navigate("/participant/clubs")}
          sx={{
            color: "#673ab7",
            textTransform: "none",
            fontWeight: 600,
            mb: 2,
            pl: 0,
            "&:hover": { bgcolor: "transparent" },
          }}
        >
          ← Back to Clubs
        </Button>

        {/* Club Header */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, mb: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}
              >
                {club.name}
              </Typography>

              {club.category && (
                <Chip
                  label={club.category}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    borderColor: "#ccc",
                    color: "#555",
                    mb: 2,
                  }}
                />
              )}

              {club.description && (
                <Typography
                  variant="body1"
                  sx={{ color: "#555", lineHeight: 1.7, mt: 1, maxWidth: 600 }}
                >
                  {club.description}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
                {club.contactEmail && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <EmailIcon sx={{ fontSize: "1rem", color: "#888" }} />
                    <Typography variant="body2" sx={{ color: "#888" }}>
                      {club.contactEmail}
                    </Typography>
                  </Box>
                )}
                {club.contactPhone && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: "1rem", color: "#888" }} />
                    <Typography variant="body2" sx={{ color: "#888" }}>
                      {club.contactPhone}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Button
              variant={isFollowing ? "contained" : "outlined"}
              onClick={handleFollow}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                minWidth: 120,
                ...(isFollowing
                  ? {
                      bgcolor: "#00897b",
                      "&:hover": { bgcolor: "#00796b" },
                    }
                  : {
                      borderColor: "#673ab7",
                      color: "#673ab7",
                      "&:hover": {
                        borderColor: "#5e35b1",
                        bgcolor: "rgba(103, 58, 183, 0.04)",
                      },
                    }),
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </Box>
        </Paper>

        {/* Events Section */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}
        >
          Events by {club.name}
        </Typography>

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
              No events from this club yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {events.map((event) => (
              <Grid item xs={12} md={4} key={event._id}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    cursor: "pointer",
                    height: "100%",
                    "&:hover": { borderColor: "#673ab7" },
                  }}
                  onClick={() =>
                    navigate(`/participant/event/${event._id}`)
                  }
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}
                    >
                      {event.name}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                      <Chip
                        label={
                          event.type === "MERCH"
                            ? "Merchandise"
                            : "Event"
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            event.type === "MERCH"
                              ? "#fff3e0"
                              : "#f3e8ff",
                          color:
                            event.type === "MERCH"
                              ? "#e65100"
                              : "#673ab7",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                      <Chip
                        label={event.status}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                      Date: <strong>{formatDate(event.startDate)}</strong>
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Fee:{" "}
                      <strong>
                        {event.registrationFee
                          ? `₹${event.registrationFee}`
                          : "Free"}
                      </strong>
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        mt: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#673ab7",
                        color: "#673ab7",
                        borderRadius: 2,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/participant/event/${event._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ClubDetails;
