import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  TextField,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from "@mui/material";

import API from "../services/api";
import OrganizerCard from "../components/OrganizerCard";
import AdminNavbar from "../components/AdminNavbar";

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    contactEmail: "",
  });
  const [tabIndex, setTabIndex] = useState(0);

  const fetchOrganizers = async () => {
    const res = await API.get("/admin/organizers");
    setOrganizers(res.data);
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleCreate = async () => {
    const res = await API.post(
      "/admin/create-organizer",
      form
    );

    alert(
      `Login Email: ${res.data.organizer.loginEmail}
Password: ${res.data.organizer.generatedPassword}`
    );

    setOpen(false);
    fetchOrganizers();
  };

  return (
    <>
      <AdminNavbar />
      <Container>
        <Typography variant="h4" sx={{ my: 3 }}>
          Admin Dashboard
        </Typography>

        <Button
          variant="contained"
          onClick={() => setOpen(true)}
        >
          Create Organizer
        </Button>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {organizers.map((org) => (
            <Grid item xs={12} md={4} key={org._id}>
              <OrganizerCard
                organizer={org}
                refresh={fetchOrganizers}
              />
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Create Organizer</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              margin="normal"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Category"
              margin="normal"
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Contact Email"
              margin="normal"
              onChange={(e) =>
                setForm({
                  ...form,
                  contactEmail: e.target.value,
                })
              }
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default AdminDashboard;
