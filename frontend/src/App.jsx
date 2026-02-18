import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Participant pages
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ParticipantBrowse from "./pages/ParticipantBrowse";
import ParticipantClubs from "./pages/ParticipantClubs";
import ParticipantProfile from "./pages/ParticipantProfile";
import EventDetails from "./pages/EventDetails";

// Organizer pages
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerEventDetail from "./pages/OrganizerEventDetail";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerProfile from "./pages/OrganizerProfile";
import CreateEvent from "./pages/CreateEvent";
import OngoingEvents from "./pages/OngoingEvents";

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
        <Route path="/participant/browse" element={<ParticipantBrowse />} />
        <Route path="/participant/clubs" element={<ParticipantClubs />} />
        <Route path="/participant/profile" element={<ParticipantProfile />} />
        <Route path="/participant/event/:eventId" element={<EventDetails />} />

        {/* Organizer */}
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route path="/organizer/event/:eventId" element={<OrganizerEventDetail />} />
        <Route path="/organizer/profile" element={<OrganizerProfile />}/>
        <Route path="/organizer/create-event" element={<CreateEvent />}/>
        <Route path="/organizer/ongoing" element={<OngoingEvents />}/>
        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
