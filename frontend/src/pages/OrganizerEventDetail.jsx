import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
} from "@mui/material";

import OrganizerNavbar from "../components/OrganizerNavbar";
import API from "../services/api";
import ParticipantsTable from "../components/ParticipantsTable";

const OrganizerEventDetail = () => {
  const { eventId } = useParams();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await API.get(
      `/organizer/event/${eventId}`
    );
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <>
      <OrganizerNavbar />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4">
          {data.event.name}
        </Typography>

        <Typography>
          Type: {data.event.type}
        </Typography>

        <Typography>
          Status: {data.event.status}
        </Typography>

        <Typography>
          Revenue: ₹{data.analytics.revenue}
        </Typography>

        <Typography>
          Registrations: {data.analytics.totalRegistrations}
        </Typography>

        <Typography>
          Attendance: {data.analytics.attendanceCount}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <ParticipantsTable eventId={eventId} />
        </Box>
      </Container>
    </>
  );
};

export default OrganizerEventDetail;
