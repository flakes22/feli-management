import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  MenuItem,
  TextField,
  Paper,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import ParticipantNavbar from "../components/ParticipantNavbar";

const ClubsOrganizers = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClubs = async () => {
    try {
      const res = await API.get("/participant/clubs");
      setClubs(res.data);
      setFiltered(res.data);

      // Extract unique categories
      const cats = [...new Set(res.data.map((c) => c.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch clubs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setFiltered(clubs);
    } else {
      setFiltered(clubs.filter((c) => c.category === selectedCategory));
    }
  }, [selectedCategory, clubs]);

  const handleFollow = async (organizerId) => {
    try {
      const res = await API.post(`/participant/follow/${organizerId}`);
      // Update local state
      setClubs((prev) =>
        prev.map((club) => {
          if (club._id === organizerId) {
            return { ...club, isFollowing: res.data.isFollowing };
          }
          return club;
        })
      );
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Clubs & Organizers
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: "#666", fontWeight: 600 }}>
              Filter:
            </Typography>
            <TextField
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* Club Cards */}
        {loading ? (
          <Typography sx={{ color: "#999", textAlign: "center", py: 8 }}>
            Loading clubs...
          </Typography>
        ) : filtered.length === 0 ? (
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
              No clubs found for the selected category.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((club) => (
              <Grid item xs={12} md={6} key={club._id}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": {
                      borderColor: "#ccc",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {/* Top Row: Name + Follow Button */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#1a1a2e" }}
                        >
                          {club.name}
                        </Typography>
                        {club.category && (
                          <Chip
                            label={club.category}
                            size="small"
                            variant="outlined"
                            sx={{
                              mt: 0.5,
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              borderColor: "#ccc",
                              color: "#555",
                            }}
                          />
                        )}
                      </Box>

                      <Button
                        variant={club.isFollowing ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handleFollow(club._id)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 2.5,
                          minWidth: 100,
                          ...(club.isFollowing
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
                        {club.isFollowing ? "Following" : "Follow"}
                      </Button>
                    </Box>

                    {/* Description */}
                    {club.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666",
                          mt: 1.5,
                          mb: 2,
                          flex: 1,
                          lineHeight: 1.6,
                        }}
                      >
                        {club.description}
                      </Typography>
                    )}

                    {/* Bottom Row */}
                    <Divider sx={{ mb: 1.5 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#888" }}>
                        {club.upcomingEvents !== undefined
                          ? `${club.upcomingEvents} upcoming event${club.upcomingEvents !== 1 ? "s" : ""}`
                          : ""}
                      </Typography>

                      <Button
                        size="small"
                        onClick={() =>
                          navigate(`/participant/club/${club._id}`)
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          color: "#673ab7",
                          "&:hover": {
                            bgcolor: "transparent",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        View Details →
                      </Button>
                    </Box>
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

export default ClubsOrganizers;