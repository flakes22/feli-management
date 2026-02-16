import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
} from "@mui/material";

import API from "../services/api";
import EventCard from "../components/EventCard";
import TicketModal from "../components/TicketModal";
import ParticipantNavbar from "../components/ParticipantNavbar";

const ParticipantDashboard = () => {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/registration/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTabData = () => {
    switch (tab) {
      case 0:
        return data.upcoming || [];
      case 1:
        return data.normal || [];
      case 2:
        return data.merchandise || [];
      case 3:
        return data.completed || [];
      case 4:
        return data.cancelled || [];
      default:
        return [];
    }
  };

  const tabLabels = ["Upcoming", "Normal", "Merchandise", "Completed", "Cancelled"];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <ParticipantNavbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 3 }}>
          My Events
        </Typography>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(e, val) => setTab(val)}
            sx={{
              px: 2,
              pt: 1,
              borderBottom: "1px solid #e0e0e0",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.9rem",
                color: "#666",
                minWidth: "auto",
                px: 2,
              },
              "& .Mui-selected": {
                color: "#673ab7",
                fontWeight: 700,
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#673ab7",
              },
            }}
          >
            {tabLabels.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>

          {/* Event Cards */}
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Typography sx={{ color: "#999", textAlign: "center", py: 4 }}>
                Loading...
              </Typography>
            ) : getTabData().length === 0 ? (
              <Typography sx={{ color: "#999", textAlign: "center", py: 4 }}>
                No events found in this category.
              </Typography>
            ) : (
              getTabData().map((reg) => (
                <EventCard
                  key={reg._id}
                  registration={reg}
                  onViewTicket={setSelected}
                />
              ))
            )}
          </Box>
        </Paper>
      </Container>

      <TicketModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        registration={selected}
      />
    </Box>
  );
};

export default ParticipantDashboard;
