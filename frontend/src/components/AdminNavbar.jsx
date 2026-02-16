import {
    AppBar,
    Toolbar,
    Typography,
    Button,
  } from "@mui/material";
  import { useNavigate } from "react-router-dom";
  
  const AdminNavbar = () => {
    const navigate = useNavigate();
  
    const logout = () => {
      localStorage.clear();
      navigate("/login");
    };
  
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
  
          <Button color="inherit" onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </Button>
  
          <Button color="inherit" onClick={() => navigate("/admin/manage-organizers")}>
            Manage Organizers
          </Button>
  
          <Button color="inherit" onClick={() => navigate("/admin/password-requests")}>
            Password Reset Requests
          </Button>
  
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
    );
  };
  
  export default AdminNavbar;
  