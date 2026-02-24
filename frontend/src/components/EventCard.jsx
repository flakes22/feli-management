import { Card, CardContent, Typography, Button, Box, Chip } from "@mui/material";

const EventCard = ({ registration, onViewTicket }) => {
  const event = registration?.eventId;

  if (!event) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "REGISTERED":
        return "success";
      case "COMPLETED":
        return "info";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "REGISTERED":
        return "Registered";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        "&:hover": {
          borderColor: "#ccc",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Left Section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
              {event.name}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Chip
                label={event.type === "MERCH" ? "Merchandise" : "Normal Event"}
                size="small"
                sx={{
                  bgcolor: "#f3e8ff",
                  color: "#673ab7",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
              {event.organizerId?.name && (
                <Typography variant="body2" sx={{ color: "#888" }}>
                  • {event.organizerId.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 4, mb: 1 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Date: <strong>{formatDate(event.startDate)}</strong>
              </Typography>
              {event.venue && (
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Venue: <strong>{event.venue}</strong>
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Status:{" "}
                <Chip
                  label={getStatusLabel(registration.status)}
                  size="small"
                  color={getStatusColor(registration.status)}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
              </Typography>

              {registration.paymentStatus && (
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Payment:{" "}
                  <Chip
                    label={registration.paymentStatus}
                    size="small"
                    color={
                      registration.paymentStatus === "APPROVED"
                        ? "success"
                        : registration.paymentStatus === "REJECTED"
                          ? "error"
                          : "warning"
                    }
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                  />
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ textAlign: "right", ml: 3 }}>
            <Typography variant="caption" sx={{ color: "#999" }}>
              Ticket ID
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "#673ab7", fontFamily: "monospace", mb: 2 }}
            >
              {registration.ticketId
                ? registration.ticketId.length > 12
                  ? registration.ticketId.slice(-8)
                  : registration.ticketId
                : "N/A"}
            </Typography>

            <Button
              variant="contained"
              size="small"
              onClick={() => onViewTicket(registration)}
              sx={{
                mt: 1,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#673ab7",
                borderRadius: 2,
                px: 2.5,
                "&:hover": {
                  bgcolor: "#5e35b1",
                },
              }}
            >
              View Ticket
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;