import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
  } from "@mui/material";
  import { useState } from "react";
  import API from "../services/api";
  
  const CreateOrganizerDialog = ({ open, setOpen, refresh }) => {
    const [form, setForm] = useState({
      name: "",
      category: "",
      description: "",
      contactEmail: "",
    });
  
    const handleSubmit = async () => {
      const res = await API.post("/admin/create-organizer", form);
  
      alert(
        `Login Email: ${res.data.organizer.loginEmail}
  Password: ${res.data.organizer.generatedPassword}`
      );
  
      setOpen(false);
      refresh();
    };
  
    return (
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create Organizer</DialogTitle>
  
        <DialogContent>
          {Object.keys(form).map((field) => (
            <TextField
              key={field}
              fullWidth
              margin="normal"
              label={field}
              onChange={(e) =>
                setForm({ ...form, [field]: e.target.value })
              }
            />
          ))}
        </DialogContent>
  
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  export default CreateOrganizerDialog;
  