import { useState } from "react";
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

function App() {
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

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Sidebar></Sidebar>} />
          <Route
            path="/Login"
            element={
              <Login
                loginUsername={loginUsername}
                setLoginUsername={setLoginUsername}
                loginPassword={loginPassword}
                setLoginPassword={setLoginPassword}
              ></Login>
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
          <Route
            path="/ProfileManagement"
            element={<ProfileManagement></ProfileManagement>}
          />

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

          <Route
            path="/VolunteerHistory"
            element={<VolunteerHistory></VolunteerHistory>}
          />
          <Route
            path="/VolunteerMatching"
            element={<VolunteerMatching></VolunteerMatching>}
          />

          <Route path="/events/:eventName" element={<EditEvent />} />
          <Route
            path="/inbox"
            element={<Inbox></Inbox>}
          />
          <Route
            path="/events/:id"
            element={<EventDetails></EventDetails>}
          />
          <Route
            path="/history/event/:eventId"
            element={<HistoryDetails></HistoryDetails>}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
