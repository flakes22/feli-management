import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
} from "@mui/material";

import OrganizerNavbar from "../components/OrganizerNavbar";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const OngoingEvents = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchEvents = async () => {
    const ongoingEndpoints = [
      "/organizer/ongoing-events",
      "/organizer/ongoing",
      "/organizer/event/ongoing",
    ];

    try {
      setError("");
      let res = null;
      let lastError = null;

      for (const endpoint of ongoingEndpoints) {
        try {
          res = await API.get(endpoint);
          break;
        } catch (err) {
          lastError = err;
          if (err.response?.status !== 404) {
            break;
          }
        }
      }

      if (!res) {
        throw lastError || new Error("Failed to load ongoing events.");
      }

      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setEvents([]);
      setError(
        err.response?.data?.message ||
          "Failed to load ongoing events."
      );
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <>
      <OrganizerNavbar />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Ongoing Events
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {events.length === 0 && (
          <Typography>
            No ongoing events currently.
          </Typography>
        )}

        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} md={4} key={event._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {event.name}
                  </Typography>

                  <Typography>
                    Type: {event.type}
                  </Typography>

                  <Typography>
                    Start:{" "}
                    {new Date(
                      event.startDate
                    ).toLocaleDateString()}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() =>
                        navigate(
                          `/organizer/event/${event._id}`
                        )
                      }
                    >
                      View Details
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() =>
                        navigate(
                          `/organizer/attendance/${event._id}`
                        )
                      }
                    >
                      Scan Attendance
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default OngoingEvents;
