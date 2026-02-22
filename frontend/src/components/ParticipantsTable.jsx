import { useEffect, useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
} from "@mui/material";

import API from "../services/api";

const ParticipantsTable = ({ eventId }) => {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");

  const fetchParticipants = async () => {
    const res = await API.get(
      `/organizer/event/${eventId}/participants`,
      { params: { search } }
    );
    setParticipants(res.data);
  };

  useEffect(() => {
    fetchParticipants();
  }, [search]);

  const exportCSV = async () => {
    try {
      const res = await API.get(
        `/organizer/event/${eventId}/export`,
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `participants-${eventId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export participants CSV:", error);
    }
  };

  return (
    <>
      <TextField
        label="Search"
        sx={{ mb: 2 }}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Button
        variant="contained"
        sx={{ ml: 2 }}
        onClick={exportCSV}
      >
        Export CSV
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Ticket</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {participants.map((p) => (
            <TableRow key={p._id}>
              <TableCell>
                {p.participantId.firstName}{" "}
                {p.participantId.lastName}
              </TableCell>
              <TableCell>
                {p.participantId.email}
              </TableCell>
              <TableCell>{p.ticketId}</TableCell>
              <TableCell>{p.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default ParticipantsTable;
