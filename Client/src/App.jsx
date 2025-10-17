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
import Inbox from "./Pages/Inbox";

function App() {
  const [count, setCount] = useState(0);
  const [memberFirstName, setMemberFirstName] = useState("");
  const [memberLastName, setMemberLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
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
              ></Register>
            }
          />
          <Route
            path="/ProfileManagement"
            element={<ProfileManagement></ProfileManagement>}
          />

          <Route
            path="/EventManagement"
            element={<EventManagement></EventManagement>}
          />

          <Route
            path="/VolunteerHistory"
            element={<VolunteerHistory></VolunteerHistory>}
          />
          <Route
            path="/VolunteerMatching"
            element={<VolunteerMatching></VolunteerMatching>}
          />
          <Route
            path="/inbox"
            element={<Inbox></Inbox>}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
