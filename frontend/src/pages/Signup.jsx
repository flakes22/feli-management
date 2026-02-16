import { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Paper,
  Avatar,
  Link,
  Alert,
} from "@mui/material";
import API from "../services/api";
import { useNavigate, Link as RouterLink } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    participantType: "IIIT",
    collegeName: "",
    contactNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError("");
  };

  const validate = () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "Please fill in all required fields";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match";
    }

    if (
      form.participantType === "IIIT" &&
      !form.email.endsWith("@students.iiit.ac.in") &&
      !form.email.endsWith("@research.iiit.ac.in")
    ) {
      return "IIIT participants must use an IIIT email (@students.iiit.ac.in or @research.iiit.ac.in)";
    }

    if (form.participantType === "NON_IIIT" && !form.collegeName) {
      return "Please enter your college name";
    }

    return null;
  };

  const handleSignup = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { confirmPassword, ...payload } = form;

      const res = await API.post("/auth/register", payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      navigate("/participant/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSignup();
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
        py: 4,
      }}
    >
      {/* Header / Branding */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            mb: 1,
          }}
        >
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

      {/* Signup Card */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 480,
          p: 4,
          borderRadius: 3,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#1a1a2e" }}>
          Create Account
        </Typography>
        <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>
          Register as a participant to browse and join events.
          <br />
          Organizer accounts are created by the Admin only.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Participant Type */}
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Participant Type *
        </Typography>
        <TextField
          select
          fullWidth
          value={form.participantType}
          onChange={handleChange("participantType")}
          size="small"
          sx={{ mb: 2.5 }}
        >
          <MenuItem value="IIIT">IIIT Student</MenuItem>
          <MenuItem value="NON_IIIT">Non-IIIT Participant</MenuItem>
        </TextField>

        {/* Name Row */}
        <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
              First Name *
            </Typography>
            <TextField
              fullWidth
              placeholder="First name"
              size="small"
              value={form.firstName}
              onChange={handleChange("firstName")}
              onKeyDown={handleKeyDown}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
              Last Name *
            </Typography>
            <TextField
              fullWidth
              placeholder="Last name"
              size="small"
              value={form.lastName}
              onChange={handleChange("lastName")}
              onKeyDown={handleKeyDown}
            />
          </Box>
        </Box>

        {/* Email */}
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Email *
        </Typography>
        <TextField
          fullWidth
          placeholder={
            form.participantType === "IIIT"
              ? "yourname@students.iiit.ac.in"
              : "Enter your email"
          }
          size="small"
          value={form.email}
          onChange={handleChange("email")}
          onKeyDown={handleKeyDown}
          helperText={
            form.participantType === "IIIT"
              ? "Must use @students.iiit.ac.in or @research.iiit.ac.in"
              : ""
          }
          sx={{ mb: 2.5 }}
        />

        {/* College Name (Non-IIIT only) */}
        {form.participantType === "NON_IIIT" && (
          <>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
              College Name *
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your college name"
              size="small"
              value={form.collegeName}
              onChange={handleChange("collegeName")}
              onKeyDown={handleKeyDown}
              sx={{ mb: 2.5 }}
            />
          </>
        )}

        {/* Contact Number */}
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Contact Number
        </Typography>
        <TextField
          fullWidth
          placeholder="Enter your contact number"
          size="small"
          value={form.contactNumber}
          onChange={handleChange("contactNumber")}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2.5 }}
        />

        {/* Password */}
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Password *
        </Typography>
        <TextField
          fullWidth
          type="password"
          placeholder="Minimum 6 characters"
          size="small"
          value={form.password}
          onChange={handleChange("password")}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2.5 }}
        />

        {/* Confirm Password */}
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, color: "#333" }}>
          Confirm Password *
        </Typography>
        <TextField
          fullWidth
          type="password"
          placeholder="Re-enter your password"
          size="small"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          onKeyDown={handleKeyDown}
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={handleSignup}
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
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>

        <Box sx={{ textAlign: "center", mt: 2.5 }}>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to="/login"
              underline="hover"
              sx={{ color: "#673ab7", fontWeight: 600 }}
            >
              Login
            </Link>
          </Typography>
        </Box>

        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{ color: "#673ab7", fontSize: "0.85rem" }}
          >
            Back to Home
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;