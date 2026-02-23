import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogContent,
    CircularProgress,
    IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import CloseIcon from "@mui/icons-material/Close";

import API from "../services/api";
import AdminNavbar from "../components/AdminNavbar"; // or OrganizerNavbar if one exists, but keeping consistency

const MerchOrders = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [viewProofOpen, setViewProofOpen] = useState(false);
    const [currentProof, setCurrentProof] = useState("");

    const fetchOrders = async () => {
        try {
            const res = await API.get(`/organizer/orders/${eventId}`);
            setOrders(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [eventId]);

    const handleStatusUpdate = async (registrationId, status) => {
        try {
            await API.patch(`/organizer/orders/${registrationId}/status`, { status });
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status");
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case "APPROVED":
                return <Chip label="Approved" color="success" size="small" />;
            case "REJECTED":
                return <Chip label="Rejected" color="error" size="small" />;
            case "PENDING":
            default:
                return <Chip label="Pending Approval" color="warning" size="small" />;
        }
    };

    const openProof = (proofPath) => {
        const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:5001";
        setCurrentProof(`${backendUrl}/${proofPath}`);
        setViewProofOpen(true);
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc" }}>
            <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 3, bgcolor: "white", borderBottom: "1px solid #eee", display: "flex", alignItems: "center" }}>
                <IconButton sx={{ mr: 2 }} onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e" }}>
                    Merchandise Orders
                </Typography>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {error && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: "#ffebee", color: "#c62828", borderRadius: 2 }}>
                        <Typography variant="body2">{error}</Typography>
                    </Box>
                )}

                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: "0px 4px 20px rgba(0,0,0,0.05)" }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : orders.length === 0 ? (
                        <Box sx={{ textAlign: "center", p: 4, color: "#666" }}>
                            <InfoIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                            <Typography>No merchandise orders found for this event.</Typography>
                        </Box>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Buyer</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Payment Proof</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell>{order.ticketNumber || order._id.toString().slice(-6).toUpperCase()}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {order.participantId?.firstName} {order.participantId?.lastName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#888" }}>
                                                {order.participantId?.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {order.paymentProof ? (
                                                <Button size="small" variant="outlined" onClick={() => openProof(order.paymentProof)}>
                                                    View Proof
                                                </Button>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">N/A</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusChip(order.paymentStatus)}</TableCell>
                                        <TableCell sx={{ textAlign: "right" }}>
                                            {order.paymentStatus === "PENDING" && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        color="success"
                                                        variant="contained"
                                                        sx={{ mr: 1, textTransform: "none" }}
                                                        onClick={() => handleStatusUpdate(order._id, "APPROVED")}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        sx={{ textTransform: "none" }}
                                                        onClick={() => handleStatusUpdate(order._id, "REJECTED")}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            </Container>

            <Dialog open={viewProofOpen} onClose={() => setViewProofOpen(false)} maxWidth="md" fullWidth>
                <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
                    <IconButton onClick={() => setViewProofOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ display: "flex", justifyContent: "center", pb: 4 }}>
                    {currentProof ? (
                        <img src={currentProof} alt="Payment Proof" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }} />
                    ) : (
                        <Typography>No image available</Typography>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MerchOrders;
