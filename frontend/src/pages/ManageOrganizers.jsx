import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import API from "../services/api";
import AdminNavbar from "../components/AdminNavbar";

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    contactEmail: "",
  });

  const fetchOrganizers = async () => {
    const res = await API.get("/admin/organizers");
    setOrganizers(res.data);
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleCreate = async () => {
    const res = await API.post("/admin/create-organizer", form);
    alert(
      `Login Email: ${res.data.organizer.loginEmail}\nPassword: ${res.data.organizer.generatedPassword}`
    );
    setOpen(false);
    setForm({ name: "", category: "", description: "", contactEmail: "" });
    fetchOrganizers();
  };

  const handleToggle = async (id) => {
    try {
      await API.patch(`/admin/toggle-organizer/${id}`);
      fetchOrganizers();
    } catch (e) {
      console.error(e.response ? e.response.data : e.message);
      alert(e.response ? e.response.data.message : e.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this organizer?")) {
      await API.delete(`/admin/delete-organizer/${id}`);
      fetchOrganizers();
    }
  };

  return (
    <>
      <AdminNavbar />
      <Container>
        <Typography variant="h4" sx={{ my: 3 }}>
          Manage Organizers
        </Typography>

        <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
          Add New Organizer
        </Button>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Login Email</strong></TableCell>
                <TableCell><strong>Password</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizers.map((org) => (
                <TableRow key={org._id}>
                  <TableCell>{org.name}</TableCell>
                  <TableCell>{org.category}</TableCell>
                  <TableCell>{org.loginEmail}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {org.generatedPassword || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={org.isActive ? "Active" : "Disabled"}
                      color={org.isActive ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleToggle(org._id)}
                    >
                      {org.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(org._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Create Organizer</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Name" margin="normal"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth label="Category" margin="normal"
              onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <TextField fullWidth label="Description" margin="normal"
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField fullWidth label="Contact Email" margin="normal"
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ManageOrganizers;
