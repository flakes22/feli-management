import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Participant pages
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ParticipantProfile from "./pages/ParticipantProfile";
import EventDetails from "./pages/EventDetails";
import BrowseEvents from "./pages/BrowseEvents";
import ClubsOrganizers from "./pages/ClubsOrganizers";
import ClubDetails from "./pages/ClubDetails";
// Organizer pages
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerEventDetail from "./pages/OrganizerEventDetail";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerProfile from "./pages/OrganizerProfile";
import CreateEvent from "./pages/CreateEvent";
import OngoingEvents from "./pages/OngoingEvents";
import ManageOrganizers from "./pages/ManageOrganizers";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Participant */}
        <Route path="/participant/dashboard" element={<ParticipantDashboard />} />
        <Route path="/participant/browse" element={<BrowseEvents />} />
        <Route path="/participant/clubs" element={<ClubsOrganizers />} />
        <Route path="/participant/profile" element={<ParticipantProfile />} />
        <Route path="/participant/event/:eventId" element={<EventDetails />} />
        <Route path="/participant/club/:clubId" element={<ClubDetails />} />
        {/* Organizer */}
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route path="/organizer/event/:eventId" element={<OrganizerEventDetail />} />
        <Route path="/organizer/profile" element={<OrganizerProfile />}/>
        <Route path="/organizer/create-event" element={<CreateEvent />}/>
        <Route path="/organizer/ongoing" element={<OngoingEvents />}/>
        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-organizers" element={<ManageOrganizers />} />
      </Routes>
    </Router>
  );
}

export default App;
