import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProfileManagement from "./Pages/ProfileManagement";
import EventManagement from "./Pages/EventManagement";
import VolunteerHistory from "./Pages/VolunteerHistory";
import VolunteerMatching from "./Pages/VolunteerMatching";
import Sidebar from "./Pages/Sidebar";
import EditEvent from "./Pages/EditEvent";
import Inbox from "./Pages/Inbox";
import EventDetails from "./Pages/EventDetails";
import HistoryDetails from "./Pages/HistoryDetails";
import BrowseEvents from "./Pages/BrowseEvents";
import Home from "./Pages/Home";
import PublicHome from "./Pages/PublicHome";
import Logout from "./Pages/Logout";

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
function isTokenValid(token) {
  if (!token) return false;
  const d = decodeJwt(token);
  if (!d?.exp) return true;
  return d.exp > Math.floor(Date.now() / 1000);
}

function useAuth() {
  const getAuthed = () => isTokenValid(localStorage.getItem("token"));
  const [authed, setAuthed] = useState(getAuthed);

  useEffect(() => {
    const onStorage = () => setAuthed(getAuthed());
    window.addEventListener("storage", onStorage);
    // allow manual dispatch from code (we already do this on login/logout)
    window.addEventListener("auth-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onStorage);
    };
  }, []);

  return authed;
}

function App() {
  // keep your state exactly as before
  const [count, setCount] = useState(0);
  const [memberFirstName, setMemberFirstName] = useState("");
  const [memberLastName, setMemberLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventZipCode, setEventZipCode] = useState("");
  const [eventRequiredSkills, setEventRequiredSkills] = useState("");
  const [eventUrgency, setEventUrgency] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventsList, setEventsList] = useState([]);

  // ✅ reactive auth state
  const authed = useAuth();

  return (
    <Router>
      <Routes>
        {/* Root shows member dashboard if authed, otherwise public landing */}
        <Route path="/" element={authed ? <Home /> : <PublicHome />} />

        <Route
          path="/Login"
          element={
            <Login
              loginUsername={loginUsername}
              setLoginUsername={setLoginUsername}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
            />
          }
        />
        <Route
          path="/Register"
          element={
            <Register
              memberFirstName={memberFirstName}
              setMemberFirstName={setMemberFirstName}
              memberLastName={memberLastName}
              setMemberLastName={setMemberLastName}
              email={email}
              setEmail={setEmail}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
            />
          }
        />
        <Route path="/logout" element={<Logout />} />

        <Route path="/ProfileManagement" element={<ProfileManagement />} />
        <Route
          path="/EventManagement"
          element={
            <EventManagement
              eventName={eventName}
              setEventName={setEventName}
              eventDescription={eventDescription}
              setEventDescription={setEventDescription}
              eventLocation={eventLocation}
              setEventLocation={setEventLocation}
              eventZipCode={eventZipCode}
              setEventZipCode={setEventZipCode}
              eventRequiredSkills={eventRequiredSkills}
              setEventRequiredSkills={setEventRequiredSkills}
              eventUrgency={eventUrgency}
              setEventUrgency={setEventUrgency}
              eventDate={eventDate}
              setEventDate={setEventDate}
              eventsList={eventsList}
              setEventsList={setEventsList}
            />
          }
        />

        <Route path="/BrowseEvents" element={<BrowseEvents />} />
        <Route path="/VolunteerHistory" element={<VolunteerHistory />} />
        <Route path="/VolunteerMatching" element={<VolunteerMatching />} />
        <Route path="/events/edit/:eventName" element={<EditEvent />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/history/event/:eventId" element={<HistoryDetails />} />

        {/* Fallback */}
        <Route path="*" element={<Sidebar />} />
      </Routes>
    </Router>
  );
}

export default App;
