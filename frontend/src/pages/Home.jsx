import { Container, Typography, Button, Box, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box textAlign="center">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: "#673ab7",
              width: 56,
              height: 56,
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            F
          </Avatar>
          <Typography variant="h3" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Felicity
          </Typography>
        </Box>

        <Typography variant="subtitle1" sx={{ color: "#666", mb: 5 }}>
          Event Management System
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
            sx={{
              px: 5,
              py: 1.3,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: "#673ab7",
              "&:hover": {
                bgcolor: "#5e35b1",
              },
            }}
          >
            Login
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/signup")}
            sx={{
              px: 5,
              py: 1.3,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: 2,
              color: "#673ab7",
              borderColor: "#673ab7",
              "&:hover": {
                borderColor: "#5e35b1",
                bgcolor: "rgba(103, 58, 183, 0.04)",
              },
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
