import { AppBar, Toolbar, Typography, Button, Avatar, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const ParticipantNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/participant/dashboard" },
    { label: "Browse Events", path: "/participant/browse" },
    { label: "Clubs/Organizers", path: "/participant/clubs" },
    { label: "Profile", path: "/participant/profile" },
  ];

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", mr: 4 }}
          onClick={() => navigate("/participant/dashboard")}
        >
          <Avatar
            sx={{
              bgcolor: "#673ab7",
              width: 32,
              height: 32,
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            F
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Felicity
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Nav Links */}
        {navItems.map((item) => (
          <Button
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              color: location.pathname === item.path ? "#673ab7" : "#555",
              fontWeight: location.pathname === item.path ? 700 : 500,
              textTransform: "none",
              fontSize: "0.9rem",
              mx: 0.5,
              "&:hover": {
                color: "#673ab7",
                bgcolor: "transparent",
              },
            }}
          >
            {item.label}
          </Button>
        ))}

        <Button
          onClick={logout}
          sx={{
            color: "#555",
            textTransform: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
            mx: 0.5,
            "&:hover": {
              color: "#d32f2f",
              bgcolor: "transparent",
            },
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default ParticipantNavbar;