import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import BrowseEvents from "./pages/BrowseEvents";
import EventDetails from "./pages/EventDetails";
import ParticipantProfile from "./pages/ParticipantProfile";
import ClubsOrganizers from "./pages/ClubsOrganizers";
import ClubDetails from "./pages/ClubDetails";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEvent from "./pages/CreateEvent";
import OrganizerEventDetail from "./pages/OrganizerEventDetail";
import OrganizerProfile from "./pages/OrganizerProfile";

import ProtectedRoute from "./components/ProtectedRoute";
import ManageOrganizers from "./pages/ManageOrganizers";
import PasswordResetRequests from "./pages/PasswordResetRequests";
import OngoingEvents from "./pages/OngoingEvents";

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= HOME ================= */}
        <Route path="/" element={<Home />} />

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ================= PARTICIPANT ================= */}
        <Route
          path="/participant/dashboard"
          element={
            <ProtectedRoute role="participant">
              <ParticipantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/browse"
          element={
            <ProtectedRoute role="participant">
              <BrowseEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/event/:eventId"
          element={
            <ProtectedRoute role="participant">
              <EventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/clubs"
          element={
            <ProtectedRoute role="participant">
              <ClubsOrganizers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/club/:organizerId"
          element={
            <ProtectedRoute role="participant">
              <ClubDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/profile"
          element={
            <ProtectedRoute role="participant">
              <ParticipantProfile />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-organizers"
          element={
            <ProtectedRoute role="admin">
              <ManageOrganizers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/password-requests"
          element={
            <ProtectedRoute role="admin">
              <PasswordResetRequests />
            </ProtectedRoute>
          }
        />

        {/* ================= ORGANIZER ================= */}
        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute role="organizer">
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/create-event"
          element={
            <ProtectedRoute role="organizer">
              <CreateEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/ongoing"
          element={
            <ProtectedRoute role="organizer">
              <OngoingEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/event/:eventId"
          element={
            <ProtectedRoute role="organizer">
              <OrganizerEventDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/profile"
          element={
            <ProtectedRoute role="organizer">
              <OrganizerProfile />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
