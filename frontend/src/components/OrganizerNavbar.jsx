import {
    AppBar,
    Toolbar,
    Typography,
    Button,
  } from "@mui/material";
  import { useNavigate } from "react-router-dom";
  
  const OrganizerNavbar = () => {
    const navigate = useNavigate();
  
    const logout = () => {
      localStorage.clear();
      navigate("/login");
    };
  
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Organizer Panel
          </Typography>
  
          <Button color="inherit" onClick={() => navigate("/organizer/dashboard")}>
            Dashboard
          </Button>
  
          <Button color="inherit" onClick={() => navigate("/organizer/create-event")}>
            Create Event
          </Button>
  
          <Button color="inherit" onClick={() => navigate("/organizer/ongoing")}>
            Ongoing Events
          </Button>
  
          <Button color="inherit" onClick={() => navigate("/organizer/profile")}>
            Profile
          </Button>
  
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
    );
  };
  
  export default OrganizerNavbar;
  