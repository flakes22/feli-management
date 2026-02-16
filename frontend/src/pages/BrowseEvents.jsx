import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Button,
  Card,
  CardContent,
  Box,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const BrowseEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [followedOnly, setFollowedOnly] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/participant/browse", {
        params: {
          search,
          type,
          eligibility,
          startDate,
          endDate,
          followedOnly,
        },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await API.get("/participant/trending");
      setTrending(res.data);
    } catch (err) {
      console.error("Failed to fetch trending:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchTrending();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}>
          Browse Events
        </Typography>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 3, mb: 4 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search events..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                fullWidth
                label="Type"
                size="small"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="MERCH">Merchandise</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                placeholder="Eligibility"
                size="small"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                type="date"
                fullWidth
                label="Start"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                type="date"
                fullWidth
                label="End"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={followedOnly}
                      onChange={(e) => setFollowedOnly(e.target.checked)}
                      sx={{
                        "& .Mui-checked": { color: "#673ab7" },
                        "& .Mui-checked + .MuiSwitch-track": { bgcolor: "#673ab7" },
                      }}
                    />
                  }
                  label="Followed Clubs Only"
                />
                <Button
                  variant="contained"
                  onClick={fetchEvents}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "#673ab7",
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { bgcolor: "#5e35b1" },
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Trending Section */}
        {trending.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}>
              🔥 Trending Events
            </Typography>
            <Grid container spacing={2}>
              {trending.map((event) => (
                <Grid item xs={12} md={4} key={event._id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      cursor: "pointer",
                      "&:hover": { borderColor: "#673ab7" },
                    }}
                    onClick={() => navigate(`/participant/event/${event._id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
                          {event.name}
                        </Typography>
                        <Chip
                          label="🔥 Trending"
                          size="small"
                          sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600, fontSize: "0.7rem" }}
                        />
                      </Box>
                      <Chip
                        label={event.type === "MERCH" ? "Merchandise" : "Event"}
                        size="small"
                        sx={{ mt: 1, bgcolor: "#f3e8ff", color: "#673ab7", fontWeight: 600, fontSize: "0.75rem" }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* All Events */}
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 2 }}>
          All Events
        </Typography>

        {events.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 4, textAlign: "center" }}
          >
            <Typography sx={{ color: "#999" }}>
              No events found. Try adjusting your filters.
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
                    borderRadius: 3,
                    cursor: "pointer",
                    height: "100%",
                    "&:hover": { borderColor: "#673ab7" },
                  }}
                  onClick={() => navigate(`/participant/event/${event._id}`)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
                      {event.name}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                      <Chip
                        label={event.type === "MERCH" ? "Merchandise" : "Event"}
                        size="small"
                        sx={{ bgcolor: "#f3e8ff", color: "#673ab7", fontWeight: 600, fontSize: "0.75rem" }}
                      />
                      {event.eligibility && (
                        <Chip
                          label={event.eligibility}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      )}
                    </Box>

                    {event.organizerId?.name && (
                      <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                        by {event.organizerId.name}
                        {event.organizerId.category ? ` • ${event.organizerId.category}` : ""}
                      </Typography>
                    )}

                    <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                      Date: <strong>{formatDate(event.startDate)}</strong>
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Fee: <strong>{event.registrationFee ? `₹${event.registrationFee}` : "Free"}</strong>
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
                        "&:hover": {
                          borderColor: "#5e35b1",
                          bgcolor: "rgba(103, 58, 183, 0.04)",
                        },
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

export default BrowseEvents;