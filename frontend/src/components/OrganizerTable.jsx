import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Chip,
  } from "@mui/material";
  
  import API from "../services/api";
  
  const OrganizerTable = ({ organizers, refresh }) => {
  
    const toggleStatus = async (id) => {
      await API.patch(`/admin/toggle-organizer/${id}`);
      refresh();
    };
  
    const deleteOrganizer = async (id) => {
      if (!window.confirm("Delete permanently?")) return;
      await API.delete(`/admin/delete-organizer/${id}`);
      refresh();
    };
  
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
  
        <TableBody>
          {organizers.map((org) => (
            <TableRow key={org._id}>
              <TableCell>{org.name}</TableCell>
              <TableCell>{org.category}</TableCell>
              <TableCell>
                <Chip
                  label={org.isActive ? "Active" : "Disabled"}
                  color={org.isActive ? "success" : "error"}
                />
              </TableCell>
  
              <TableCell>
                <Button
                  size="small"
                  onClick={() => toggleStatus(org._id)}
                >
                  Disable / Enable
                </Button>
  
                <Button
                  size="small"
                  color="error"
                  onClick={() => deleteOrganizer(org._id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  export default OrganizerTable;
  