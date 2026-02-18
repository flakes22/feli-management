import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const ParticipantBrowse = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get("/participants/events");
        setEvents(res.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter ? event.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Browse Events
      </Typography>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Search events"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Filter by type"
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="TECHNICAL">Technical</MenuItem>
          <MenuItem value="CULTURAL">Cultural</MenuItem>
          <MenuItem value="SPORTS">Sports</MenuItem>
          <MenuItem value="WORKSHOP">Workshop</MenuItem>
        </TextField>
      </Box>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Typography color="text.secondary">No events found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {event.name}
                  </Typography>
                  <Chip
                    label={event.type}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {event.description?.slice(0, 100)}...
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    📅 {new Date(event.startDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" display="block">
                    💰 Fee: ₹{event.registrationFee || 0}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/events/${event._id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ParticipantBrowse;