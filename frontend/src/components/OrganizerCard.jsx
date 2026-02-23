import { Card, CardContent, Typography, Button } from "@mui/material";
import API from "../services/api";

const OrganizerCard = ({ organizer, refresh }) => {
  const toggleStatus = async () => {
    try {
      await API.patch(`/admin/toggle-organizer/${organizer._id}`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">
          {organizer.name}
        </Typography>

        <Typography>
          Category: {organizer.category}
        </Typography>

        <Typography>
          Status: {organizer.isActive ? "Active" : "Disabled"}
        </Typography>

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={toggleStatus}
        >
          Toggle Status
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrganizerCard;
