import { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Paper,
  Avatar,
  Link,
} from "@mui/material";
import API from "../services/api";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("participant");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (!captchaToken) {
      alert("Please verify that you are not a robot.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email,
        password,
        role,
        captchaToken,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "participant") {
        navigate("/participant/dashboard");
      } else if (res.data.role === "organizer") {
        navigate("/organizer/dashboard");
      } else if (res.data.role === "admin") {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Header / Branding */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: "#673ab7",
              width: 44,
              height: 44,
              fontSize: "1.2rem",
              fontWeight: 700,
            }}
          >
            F
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            Felicity
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: "#666" }}>
          Event Management System
        </Typography>
      </Box>

      {/* Login Card */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: 4,
          borderRadius: 3,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1a1a2e" }}>
          Login
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Login as
        </Typography>
        <TextField
          select
          fullWidth
          value={role}
          onChange={(e) => setRole(e.target.value)}
          size="small"
          sx={{ mb: 2.5 }}
        >
          <MenuItem value="participant">Participant</MenuItem>
          <MenuItem value="organizer">Organizer</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Email
        </Typography>
        <TextField
          fullWidth
          placeholder="Enter your email"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2.5 }}
        />

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Password
        </Typography>
        <TextField
          fullWidth
          type="password"
          placeholder="Enter your password"
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <ReCAPTCHA
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            onChange={(token) => setCaptchaToken(token)}
          />
        </Box>

        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={handleLogin}
          sx={{
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
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Box sx={{ textAlign: "center", mt: 2.5 }}>
          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{ color: "#673ab7", fontSize: "0.9rem" }}
          >
            Back to Home
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;