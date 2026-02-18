import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const ParticipantClubs = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/participant/organizers");
      setOrganizers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleFollow = async (organizerId) => {
    try {
      setError("");
      await API.post(`/participant/follow/${organizerId}`);
      setSuccess("Followed successfully!");
      fetchOrganizers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to follow");
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      setError("");
      await API.delete(`/participant/unfollow/${organizerId}`);
      setSuccess("Unfollowed successfully!");
      fetchOrganizers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unfollow");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <ParticipantNavbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
            Clubs & Organizers
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Follow clubs to stay updated on their events
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <CircularProgress sx={{ color: "#673ab7" }} />
          </Box>
        ) : organizers.length === 0 ? (
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 3, p: 6, textAlign: "center" }}>
            <Typography sx={{ color: "#999" }}>No clubs found.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {organizers.map((org) => (
              <Grid item xs={12} md={6} key={org._id}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 3,
                    p: 3,
                    transition: "all 0.3s",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
                        {org.name}
                      </Typography>
                      <Chip
                        label={org.category || "General"}
                        size="small"
                        sx={{ bgcolor: "#673ab7", color: "white", fontWeight: 600 }}
                      />
                    </Box>
                    <Button
                      variant={org.isFollowing ? "outlined" : "contained"}
                      size="small"
                      onClick={() =>
                        org.isFollowing ? handleUnfollow(org._id) : handleFollow(org._id)
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                        minWidth: 100,
                        ...(org.isFollowing
                          ? { borderColor: "#673ab7", color: "#673ab7" }
                          : { bgcolor: "#673ab7", "&:hover": { bgcolor: "#5e35b1" } }),
                      }}
                    >
                      {org.isFollowing ? "Following" : "Follow"}
                    </Button>
                  </Box>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {org.description || "No description available."}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ParticipantClubs;