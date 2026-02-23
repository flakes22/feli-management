import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const TicketModal = ({ open, onClose, registration }) => {
  if (!registration) return null;

  const event = registration.eventId;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Event Ticket
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
            {event?.name || "Event"}
          </Typography>
          <Chip
            label={event?.type === "MERCH" ? "Merchandise" : "Normal"}
            size="small"
            sx={{ mt: 0.5, bgcolor: "#f3e8ff", color: "#673ab7", fontWeight: 600 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#888", mb: 0.3 }}>
            Ticket ID
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#673ab7" }}>
            {registration.ticketId}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 4, mb: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ color: "#888", mb: 0.3 }}>
              Date
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(event?.startDate)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#888", mb: 0.3 }}>
              Status
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {registration.status}
            </Typography>
          </Box>
        </Box>

        {event?.organizerId?.name && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: "#888", mb: 0.3 }}>
              Organizer
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {event.organizerId.name}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* QR Code */}
        {registration.qrCode ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
              Scan QR at entry
            </Typography>
            <img
              src={registration.qrCode}
              alt="QR Code"
              style={{ width: 180, height: 180 }}
            />
          </Box>
        ) : registration.paymentStatus === "PENDING" ? (
          <Box sx={{ textAlign: "center", p: 2, bgcolor: "#fff3e0", borderRadius: 2, mt: 2 }}>
            <Typography variant="body2" sx={{ color: "#ed6c02", fontWeight: 600, mb: 0.5 }}>
              Payment Under Review
            </Typography>
            <Typography variant="caption" sx={{ color: "#ed6c02" }}>
              Your QR ticket will be available here once approved by the organizer.
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;
