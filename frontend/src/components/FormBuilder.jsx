import { useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Box,
} from "@mui/material";

const FormBuilder = ({ setFormFields }) => {
  const [field, setField] = useState({
    label: "",
    type: "text",
    required: false,
  });

  const addField = () => {
    setFormFields((prev) => [...prev, field]);
    setField({ label: "", type: "text", required: false });
  };

  return (
    <Box sx={{ mt: 3 }}>
      <TextField
        label="Field Label"
        value={field.label}
        onChange={(e) =>
          setField({ ...field, label: e.target.value })
        }
      />

      <TextField
        select
        label="Field Type"
        value={field.type}
        onChange={(e) =>
          setField({ ...field, type: e.target.value })
        }
        sx={{ ml: 2 }}
      >
        <MenuItem value="text">Text</MenuItem>
        <MenuItem value="dropdown">Dropdown</MenuItem>
        <MenuItem value="checkbox">Checkbox</MenuItem>
      </TextField>

      <Button
        variant="contained"
        sx={{ ml: 2 }}
        onClick={addField}
      >
        Add Field
      </Button>
    </Box>
  );
};

export default FormBuilder;
